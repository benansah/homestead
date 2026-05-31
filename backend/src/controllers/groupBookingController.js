import pool from '../../database/db.js';
import { initializePayment } from '../services/paystack.js';

const VIEWING_FEE = 50;

// POST /api/bookings/group — lead student creates a group booking
export const createGroupBooking = async (req, res) => {
  const lead_student_id = req.user.id;
  const { room_id, max_members = 2 } = req.body;

  try {
    // Check room exists and is available
    const roomRes = await pool.query(
      `SELECT r.*, h.hostel_name FROM Rooms r JOIN Hostels h ON h.id=r.hostel_id WHERE r.id=$1`,
      [room_id]
    );
    if (!roomRes.rows.length) return res.status(404).json({ message: 'Room not found' });
    const room = roomRes.rows[0];
    if (!room.is_available) return res.status(400).json({ message: 'Room is not available' });

    // Check lead hasn't already booked this room individually
    const existing = await pool.query(
      `SELECT id FROM Bookings WHERE student_id=$1 AND room_id=$2
       AND booking_status NOT IN ('cancelled','no_show')`,
      [lead_student_id, room_id]
    );
    if (existing.rows.length) {
      return res.status(400).json({ message: 'You already have a booking for this room' });
    }

    const studentRes = await pool.query('SELECT email, fullname FROM Users WHERE id=$1', [lead_student_id]);
    const student = studentRes.rows[0];

    // Create group booking record
    const groupRes = await pool.query(
      `INSERT INTO Group_bookings (room_id, lead_student_id, max_members)
       VALUES ($1,$2,$3) RETURNING *`,
      [room_id, lead_student_id, max_members]
    );
    const group = groupRes.rows[0];

    // Create individual booking for the lead, linked to this group
    const bookingRes = await pool.query(
      `INSERT INTO Bookings (student_id, room_id, booking_type, booking_status, viewing_fee, group_booking_id)
       VALUES ($1,$2,'Viewing','pending',$3,$4) RETURNING *`,
      [lead_student_id, room_id, VIEWING_FEE, group.id]
    );
    const booking = bookingRes.rows[0];

    // Initiate Paystack payment for lead
    const payment = await initializePayment(student.email, VIEWING_FEE, {
      booking_id: booking.id,
      group_booking_id: group.id,
      room_id,
      student_id: lead_student_id,
      hostel_name: room.hostel_name,
    });

    if (!payment.status) {
      return res.status(500).json({ message: 'Payment initialization failed' });
    }

    await pool.query('UPDATE Bookings SET payment_ref=$1 WHERE id=$2', [payment.data.reference, booking.id]);

    res.status(201).json({
      message: 'Group booking created — complete your payment then share the group code',
      group_booking_id: group.id,
      booking_id: booking.id,
      payment_url: payment.data.authorization_url,
      payment_reference: payment.data.reference,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/bookings/group/:id/join — another student joins a group
export const joinGroupBooking = async (req, res) => {
  const student_id = req.user.id;
  const { id: group_booking_id } = req.params;

  try {
    // Get group booking
    const groupRes = await pool.query(
      `SELECT gb.*, r.is_available, h.hostel_name,
              (SELECT COUNT(*) FROM Bookings b
               WHERE b.group_booking_id=gb.id
               AND b.booking_status NOT IN ('cancelled','no_show')) AS member_count
       FROM Group_bookings gb
       JOIN Rooms r ON r.id=gb.room_id
       JOIN Hostels h ON h.id=r.hostel_id
       WHERE gb.id=$1`,
      [group_booking_id]
    );
    if (!groupRes.rows.length) return res.status(404).json({ message: 'Group booking not found' });
    const group = groupRes.rows[0];

    if (group.status !== 'open') {
      return res.status(400).json({ message: `This group booking is ${group.status}` });
    }
    if (parseInt(group.member_count) >= group.max_members) {
      return res.status(400).json({ message: 'This group is already full' });
    }
    if (group.lead_student_id === student_id) {
      return res.status(400).json({ message: 'You are already the group lead' });
    }

    // Check student not already in this group
    const alreadyIn = await pool.query(
      `SELECT id FROM Bookings WHERE student_id=$1 AND group_booking_id=$2
       AND booking_status NOT IN ('cancelled','no_show')`,
      [student_id, group_booking_id]
    );
    if (alreadyIn.rows.length) {
      return res.status(409).json({ message: 'You are already in this group' });
    }

    const studentRes = await pool.query('SELECT email, fullname FROM Users WHERE id=$1', [student_id]);
    const student = studentRes.rows[0];

    // Create booking for this member
    const bookingRes = await pool.query(
      `INSERT INTO Bookings (student_id, room_id, booking_type, booking_status, viewing_fee, group_booking_id)
       VALUES ($1,$2,'Viewing','pending',$3,$4) RETURNING *`,
      [student_id, group.room_id, VIEWING_FEE, group_booking_id]
    );
    const booking = bookingRes.rows[0];

    const payment = await initializePayment(student.email, VIEWING_FEE, {
      booking_id: booking.id,
      group_booking_id: parseInt(group_booking_id),
      room_id: group.room_id,
      student_id,
      hostel_name: group.hostel_name,
    });

    if (!payment.status) return res.status(500).json({ message: 'Payment initialization failed' });

    await pool.query('UPDATE Bookings SET payment_ref=$1 WHERE id=$2', [payment.data.reference, booking.id]);

    res.status(201).json({
      message: 'Joined group — complete your payment',
      booking_id: booking.id,
      payment_url: payment.data.authorization_url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/bookings/group/:id — group status (members + payment states)
export const getGroupBooking = async (req, res) => {
  const { id: group_booking_id } = req.params;
  const student_id = req.user.id;

  try {
    const groupRes = await pool.query(
      `SELECT gb.*, r.room_type, r.price, h.hostel_name, h.hostel_address
       FROM Group_bookings gb
       JOIN Rooms r ON r.id=gb.room_id
       JOIN Hostels h ON h.id=r.hostel_id
       WHERE gb.id=$1`,
      [group_booking_id]
    );
    if (!groupRes.rows.length) return res.status(404).json({ message: 'Group booking not found' });
    const group = groupRes.rows[0];

    // Check requester is part of this group
    const memberCheck = await pool.query(
      `SELECT id FROM Bookings WHERE group_booking_id=$1 AND student_id=$2`,
      [group_booking_id, student_id]
    );
    if (!memberCheck.rows.length && group.lead_student_id !== student_id) {
      return res.status(403).json({ message: 'You are not part of this group' });
    }

    // Get all members
    const membersRes = await pool.query(
      `SELECT b.id AS booking_id, b.booking_status, b.payment_ref,
              u.fullname, u.university,
              CASE WHEN b.booking_status='contact_released' THEN u.phone ELSE NULL END AS phone
       FROM Bookings b
       JOIN Users u ON u.id=b.student_id
       WHERE b.group_booking_id=$1
       ORDER BY b.booked_at ASC`,
      [group_booking_id]
    );

    res.json({
      ...group,
      members: membersRes.rows,
      member_count: membersRes.rows.length,
      paid_count: membersRes.rows.filter(m => m.booking_status !== 'pending').length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/bookings/group/my — student sees their group bookings
export const getMyGroupBookings = async (req, res) => {
  const student_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT gb.*, r.room_type, r.price, h.hostel_name, h.hostel_address,
              b.booking_status AS my_status, b.id AS my_booking_id,
              (SELECT COUNT(*) FROM Bookings b2 WHERE b2.group_booking_id=gb.id
               AND b2.booking_status NOT IN ('cancelled','no_show')) AS member_count
       FROM Group_bookings gb
       JOIN Rooms r ON r.id=gb.room_id
       JOIN Hostels h ON h.id=r.hostel_id
       JOIN Bookings b ON b.group_booking_id=gb.id AND b.student_id=$1
       WHERE b.booking_status NOT IN ('cancelled','no_show')
       ORDER BY gb.created_at DESC`,
      [student_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
