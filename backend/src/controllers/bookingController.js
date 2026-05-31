import pool from '../../database/db.js';
import { initializePayment, verifyPayment, refundPayment } from '../services/paystack.js';
import {
  sendBookingConfirmedEmail,
  sendNewBookingAlertEmail,
  sendContactReleasedEmail,
  sendRefundEmail,
} from '../services/email.js';

const VIEWING_FEE = 50; // GHS 50

// POST — student initiates a booking (before payment)
export const initiateBooking = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { room_id } = req.body;

    // check room exists and is available
    const room = await pool.query(
      `SELECT r.*, h.hostel_name FROM Rooms r
       JOIN Hostels h ON h.id = r.hostel_id
       WHERE r.id = $1`,
      [room_id]
    );

    if (room.rows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (!room.rows[0].is_available) {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // check student hasn't already booked this room
    const existing = await pool.query(
      `SELECT * FROM Bookings 
       WHERE student_id = $1 AND room_id = $2 
       AND booking_status NOT IN ('cancelled', 'no_show')`,
      [student_id, room_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You already have a booking for this room' });
    }

    // get student email for paystack
    const student = await pool.query(
      'SELECT email, fullname FROM Users WHERE id = $1',
      [student_id]
    );

    // create booking record with pending status
    const booking = await pool.query(
      `INSERT INTO Bookings
        (student_id, room_id, booking_type, booking_status, viewing_fee)
       VALUES ($1, $2, 'Viewing', 'pending', $3)
       RETURNING *`,
      [student_id, room_id, VIEWING_FEE]
    );

    const bookingId = booking.rows[0].id;

    // initialize paystack payment
    const payment = await initializePayment(
      student.rows[0].email,
      VIEWING_FEE,
      {
        booking_id: bookingId,
        room_id,
        student_id,
        hostel_name: room.rows[0].hostel_name,
        custom_fields: [
          {
            display_name: 'Booking ID',
            variable_name: 'booking_id',
            value: bookingId,
          },
        ],
      }
    );

    if (!payment.status) {
      return res.status(500).json({ message: 'Payment initialization failed' });
    }

    // save payment reference to booking
    await pool.query(
      `UPDATE Bookings SET payment_ref = $1 WHERE id = $2`,
      [payment.data.reference, bookingId]
    );

    res.status(201).json({
      message: 'Booking initiated — complete payment to confirm',
      booking_id: bookingId,
      payment_url: payment.data.authorization_url, // redirect student here
      payment_reference: payment.data.reference,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET — verify payment after student pays (Paystack redirects here)
export const verifyBookingPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    // verify with paystack
    const payment = await verifyPayment(reference);

    if (!payment.status || payment.data.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    const booking_id = payment.data.metadata.booking_id;

    // update booking to confirmed
    const updated = await pool.query(
      `UPDATE Bookings 
       SET booking_status = 'confirmed'
       WHERE id = $1 AND payment_ref = $2
       RETURNING *`,
      [booking_id, reference]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // notify admin
    await pool.query(
      `INSERT INTO Notifications (user_id, not_message, not_type, is_read)
       SELECT id,
         'New booking confirmed — action required to release landlord contact',
         'booking', FALSE
       FROM Users WHERE role = 'admin'`,
    );

    // fetch details for emails
    const details = await pool.query(
      `SELECT
         s.email AS student_email, s.fullname AS student_name,
         l.email AS landlord_email, l.fullname AS landlord_name,
         h.hostel_name, r.room_type
       FROM Bookings b
       JOIN Users s ON s.id = b.student_id
       JOIN Rooms r ON r.id = b.room_id
       JOIN Hostels h ON h.id = r.hostel_id
       JOIN Users l ON l.id = h.landlord_id
       WHERE b.id = $1`,
      [booking_id]
    );

    if (details.rows.length > 0) {
      const d = details.rows[0];
      sendBookingConfirmedEmail(d.student_email, d.student_name, {
        hostelName: d.hostel_name,
        roomType:   d.room_type,
        bookingId:  booking_id,
      }).catch(console.error);
      sendNewBookingAlertEmail(d.landlord_email, d.landlord_name, {
        studentName: d.student_name,
        hostelName:  d.hostel_name,
        roomType:    d.room_type,
      }).catch(console.error);
    }

    res.json({
      message: 'Payment confirmed — awaiting admin to release landlord contact',
      booking: updated.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH — admin releases landlord contact to student
export const releaseContact = async (req, res) => {
  try {
    const { id } = req.params; // booking id

    const booking = await pool.query(
      `UPDATE Bookings 
       SET booking_status = 'contact_released'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // get landlord contact for this booking
    const contact = await pool.query(
      `SELECT u.fullname, u.phone
       FROM Bookings b
       JOIN Rooms r ON r.id = b.room_id
       JOIN Hostels h ON h.id = r.hostel_id
       JOIN Users u ON u.id = h.landlord_id
       WHERE b.id = $1`,
      [id]
    );

    // notify student
    await pool.query(
      `INSERT INTO Notifications (user_id, not_message, not_type, is_read)
       VALUES ($1, 'Landlord contact has been released. Check your booking for details.', 'booking', FALSE)`,
      [booking.rows[0].student_id]
    );

    // send email to student with landlord contact
    const studentInfo = await pool.query(
      `SELECT u.email, u.fullname, r.room_type, h.hostel_name
       FROM Bookings b
       JOIN Users u ON u.id = b.student_id
       JOIN Rooms r ON r.id = b.room_id
       JOIN Hostels h ON h.id = r.hostel_id
       WHERE b.id = $1`,
      [id]
    );
    if (studentInfo.rows.length > 0 && contact.rows.length > 0) {
      const s = studentInfo.rows[0];
      const l = contact.rows[0];
      sendContactReleasedEmail(s.email, s.fullname, {
        landlordName:  l.fullname,
        landlordPhone: l.phone,
        hostelName:    s.hostel_name,
        roomType:      s.room_type,
      }).catch(console.error);
    }

    res.json({
      message: 'Contact released to student',
      landlord_contact: contact.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH — admin processes a refund
export const processRefund = async (req, res) => {
  try {
    const { id } = req.params; // booking id
    const { refund_type } = req.body; // 'full' or 'half'

    const booking = await pool.query(
      'SELECT * FROM Bookings WHERE id = $1',
      [id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const amount = refund_type === 'full' ? VIEWING_FEE : VIEWING_FEE / 2;

    // call paystack refund
    const refund = await refundPayment(
      booking.rows[0].payment_ref,
      amount
    );

    if (!refund.status) {
      return res.status(500).json({ message: 'Refund failed' });
    }

    // update booking status
    await pool.query(
      `UPDATE Bookings SET booking_status = 'cancelled' WHERE id = $1`,
      [id]
    );

    // notify student
    await pool.query(
      `INSERT INTO Notifications (user_id, not_message, not_type, is_read)
       VALUES ($1, $2, 'payment', FALSE)`,
      [
        booking.rows[0].student_id,
        `Your refund of GHS ${amount} has been processed.`,
      ]
    );

    // send refund email
    const refundInfo = await pool.query(
      `SELECT u.email, u.fullname, h.hostel_name
       FROM Bookings b
       JOIN Users u ON u.id = b.student_id
       JOIN Rooms r ON r.id = b.room_id
       JOIN Hostels h ON h.id = r.hostel_id
       WHERE b.id = $1`,
      [id]
    );
    if (refundInfo.rows.length > 0) {
      const r = refundInfo.rows[0];
      sendRefundEmail(r.email, r.fullname, {
        amount,
        hostelName: r.hostel_name,
      }).catch(console.error);
    }

    res.json({
      message: `Refund of GHS ${amount} processed successfully`,
      refund: refund.data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET — student sees their own bookings
export const getMyBookings = async (req, res) => {
  try {
    const student_id = req.user.id;

    const bookings = await pool.query(
      `SELECT b.*, 
        r.room_type, r.price,
        h.hostel_name, h.hostel_address,
        CASE WHEN b.booking_status = 'contact_released' 
          THEN u.phone ELSE NULL END AS landlord_phone,
        CASE WHEN b.booking_status = 'contact_released'
          THEN u.fullname ELSE NULL END AS landlord_name
       FROM Bookings b
       JOIN Rooms r ON r.id = b.room_id
       JOIN Hostels h ON h.id = r.hostel_id
       JOIN Users u ON u.id = h.landlord_id
       WHERE b.student_id = $1
       ORDER BY b.booked_at DESC`,
      [student_id]
    );

    res.json(bookings.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET — landlord sees bookings for rooms in their hostels
export const getLandlordBookings = async (req, res) => {
  try {
    const landlord_id = req.user.id;

    const bookings = await pool.query(
      `SELECT b.*,
        u.fullname AS student_name, u.phone AS student_phone,
        r.room_type, r.price,
        h.hostel_name, h.hostel_address, h.id AS hostel_id
       FROM Bookings b
       JOIN Users u ON u.id = b.student_id
       JOIN Rooms r ON r.id = b.room_id
       JOIN Hostels h ON h.id = r.hostel_id
       WHERE h.landlord_id = $1
       ORDER BY b.booked_at DESC
       LIMIT 50`,
      [landlord_id]
    );

    res.json(bookings.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET — admin sees all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await pool.query(
      `SELECT b.*,
        u.fullname AS student_name, u.email AS student_email, u.phone AS student_phone,
        r.room_type, r.price,
        h.hostel_name, h.hostel_address,
        lu.fullname AS landlord_name, lu.phone AS landlord_phone
       FROM Bookings b
       JOIN Users u ON u.id = b.student_id
       JOIN Rooms r ON r.id = b.room_id
       JOIN Hostels h ON h.id = r.hostel_id
       JOIN Users lu ON lu.id = h.landlord_id
       ORDER BY b.booked_at DESC`
    );

    res.json(bookings.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};