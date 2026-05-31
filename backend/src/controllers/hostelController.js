import pool from '../../database/db.js';
import {
  sendListingApprovedEmail,
  sendListingRejectedEmail,
  sendWishlistAlertEmail,
} from '../services/email.js';

// GET all approved hostels (students browsing)
export const getAllHostels = async (req, res) => {
  try {
    const { university, min_price, max_price, gender_policy } = req.query;

    let query = `
      SELECT h.*, 
        COUNT(DISTINCT r.id) AS total_rooms,
        AVG(rv.rating) AS avg_rating,
        MIN(r.price) AS starting_price
      FROM Hostels h
      LEFT JOIN Rooms r ON r.hostel_id = h.id
      LEFT JOIN Reviews rv ON rv.hostel_id = h.id
      WHERE h.status = 'approved'
    `;

    const values = [];
    let i = 1;

    if (university) {
      query += ` AND h.university ILIKE $${i++}`;
      values.push(`%${university}%`);
    }
    if (gender_policy) {
      query += ` AND r.gender_policy = $${i++}`;
      values.push(gender_policy);
    }
    if (min_price) {
      query += ` AND r.price >= $${i++}`;
      values.push(min_price);
    }
    if (max_price) {
      query += ` AND r.price <= $${i++}`;
      values.push(max_price);
    }

    query += ` GROUP BY h.id ORDER BY h.is_verified DESC, avg_rating DESC`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single hostel by id (full detail page)
export const getHostelById = async (req, res) => {
  try {
    const { id } = req.params;

    const hostel = await pool.query(
      `SELECT h.*, u.fullname AS landlord_name, u.phone AS landlord_phone
       FROM Hostels h
       JOIN Users u ON u.id = h.landlord_id
       WHERE h.id = $1`,
      [id]
    );

    if (hostel.rows.length === 0) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // get rooms for this hostel
    const rooms = await pool.query(
      `SELECT r.*, 
        ARRAY_AGG(ri.image_url) FILTER (WHERE ri.image_url IS NOT NULL) AS images
       FROM Rooms r
       LEFT JOIN Room_images ri ON ri.room_id = r.id
       WHERE r.hostel_id = $1
       GROUP BY r.id`,
      [id]
    );

    // get reviews
    const reviews = await pool.query(
      `SELECT rv.*, u.fullname AS student_name
       FROM Reviews rv
       JOIN Users u ON u.id = rv.student_id
       WHERE rv.hostel_id = $1
       ORDER BY rv.created_at DESC`,
      [id]
    );

    res.json({
      hostel: hostel.rows[0],
      rooms: rooms.rows,
      reviews: reviews.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST create hostel (landlord or admin)
export const createHostel = async (req, res) => {
  try {
    const {
      hostel_name,
      hostel_address,
      university,
      description,
      latitude,
      longitude,
      track,
    } = req.body;

    // landlord_id comes from the logged in user
    const landlord_id = req.user.id;

    const newHostel = await pool.query(
      `INSERT INTO Hostels
        (landlord_id, hostel_name, hostel_address, university,
         description, latitude, longitude, status, is_verified, track)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',FALSE,$8)
       RETURNING *`,
      [landlord_id, hostel_name, hostel_address, university,
       description, latitude, longitude, track || 'A']
    );

    res.status(201).json({
      message: 'Hostel submitted for approval',
      hostel: newHostel.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH approve or reject hostel (admin only)
export const updateHostelStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // 'approved', 'rejected', 'hidden'

    const updated = await pool.query(
      `UPDATE Hostels SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    const hostel = updated.rows[0];

    // fetch landlord details for emails
    const landlordRes = await pool.query(
      'SELECT email, fullname FROM Users WHERE id = $1',
      [hostel.landlord_id]
    );

    if (landlordRes.rows.length > 0) {
      const landlord = landlordRes.rows[0];

      if (status === 'approved') {
        sendListingApprovedEmail(landlord.email, landlord.fullname, {
          hostelName: hostel.hostel_name,
          hostelId:   hostel.id,
        }).catch(console.error);

        // notify wishlist users that this hostel is now live
        const wishlistUsers = await pool.query(
          `SELECT u.email, u.fullname
           FROM Wishlists w
           JOIN Users u ON u.id = w.student_id
           WHERE w.hostel_id = $1`,
          [hostel.id]
        );
        for (const user of wishlistUsers.rows) {
          sendWishlistAlertEmail(user.email, user.fullname, {
            hostelName: hostel.hostel_name,
            hostelId:   hostel.id,
            university: hostel.university,
          }).catch(console.error);
        }
      }

      if (status === 'rejected') {
        sendListingRejectedEmail(landlord.email, landlord.fullname, {
          hostelName: hostel.hostel_name,
          reason:     reason || '',
        }).catch(console.error);
      }
    }

    res.json({
      message: `Hostel ${status}`,
      hostel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH toggle verified badge (admin only)
export const toggleVerified = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await pool.query(
      `UPDATE Hostels 
       SET is_verified = NOT is_verified 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    res.json({
      message: `Verified status updated`,
      hostel: updated.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE hostel (admin only)
export const deleteHostel = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Hostels WHERE id = $1', [id]);
    res.json({ message: 'Hostel deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};