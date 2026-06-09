import pool from '../../database/db.js';
import {
  sendListingApprovedEmail,
  sendListingRejectedEmail,
  sendWishlistAlertEmail,
  sendNewMatchEmail,
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
      `SELECT h.*, u.fullname AS landlord_name, u.phone AS landlord_phone, u.last_active AS landlord_last_active
       FROM Hostels h
       JOIN Users u ON u.id = h.landlord_id
       WHERE h.id = $1`,
      [id]
    );

    if (hostel.rows.length === 0) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // Increment view counter (fire-and-forget)
    pool.query('UPDATE Hostels SET view_count = view_count + 1 WHERE id = $1', [id]).catch(() => {});

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

    // similar hostels at the same university
    const similar = await pool.query(
      `SELECT h.id, h.hostel_name, h.hostel_address, h.university, h.is_verified,
         h.latitude, h.longitude, h.status, h.track, h.landlord_id, h.created_at,
         MIN(r.price) AS min_price, MAX(r.price) AS max_price,
         COUNT(DISTINCT r.id) AS total_rooms,
         COUNT(DISTINCT r.id) FILTER (WHERE r.is_available = true) AS available_rooms,
         ROUND(AVG(rv.rating)::numeric, 1) AS avg_rating,
         COUNT(DISTINCT rv.id) AS total_reviews,
         ARRAY_AGG(DISTINCT ri.image_url) FILTER (WHERE ri.image_url IS NOT NULL) AS images
       FROM Hostels h
       LEFT JOIN Rooms r ON r.hostel_id = h.id
       LEFT JOIN Room_images ri ON ri.room_id = r.id
       LEFT JOIN Reviews rv ON rv.hostel_id = h.id
       WHERE h.university = $1 AND h.id != $2 AND h.status = 'approved'
       GROUP BY h.id
       ORDER BY avg_rating DESC NULLS LAST
       LIMIT 4`,
      [hostel.rows[0].university, id]
    );

    res.json({
      hostel: hostel.rows[0],
      rooms: rooms.rows,
      reviews: reviews.rows,
      similar: similar.rows,
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

    // admin can specify a landlord_id; otherwise use the logged-in user
    const landlord_id = (req.user.role === 'admin' && req.body.landlord_id)
      ? req.body.landlord_id
      : req.user.id;

    // admin-created listings go straight to approved + verified
    const status      = req.user.role === 'admin' ? 'approved' : 'pending';
    const is_verified = req.user.role === 'admin';

    const newHostel = await pool.query(
      `INSERT INTO Hostels
        (landlord_id, hostel_name, hostel_address, university,
         description, latitude, longitude, status, is_verified, track)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [landlord_id, hostel_name, hostel_address, university,
       description, latitude, longitude, status, is_verified, track || 'A']
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

        // notify wishlist users that opted in to marketing emails
        const wishlistUsers = await pool.query(
          `SELECT u.email, u.fullname, u.email_marketing
           FROM Wishlists w
           JOIN Users u ON u.id = w.student_id
           WHERE w.hostel_id = $1`,
          [hostel.id]
        );
        for (const user of wishlistUsers.rows) {
          if (user.email_marketing === false) continue;
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

      if (status === 'approved') {
        // notify students with matching saved searches
        const savedSearchRes = await pool.query(
          `SELECT ss.*, u.email, u.fullname
           FROM Saved_searches ss
           JOIN Users u ON u.id = ss.student_id
           WHERE (ss.university IS NULL OR ss.university ILIKE $1)`,
          [`%${hostel.university}%`]
        );
        for (const ss of savedSearchRes.rows) {
          sendNewMatchEmail(ss.email, ss.fullname, {
            hostelName: hostel.hostel_name,
            hostelId:   hostel.id,
            university: hostel.university,
          }).catch(console.error);
        }
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

// PUT update hostel (landlord or admin)
export const updateHostel = async (req, res) => {
  try {
    const { id } = req.params;
    const hostelRes = await pool.query('SELECT landlord_id FROM Hostels WHERE id = $1', [id]);
    if (hostelRes.rows.length === 0) return res.status(404).json({ message: 'Hostel not found' });
    if (req.user.role !== 'admin' && hostelRes.rows[0].landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    const allowed = ['hostel_name', 'hostel_address', 'university', 'description', 'latitude', 'longitude', 'track'];
    const fields = []; const values = []; let idx = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) { fields.push(`${key} = $${idx++}`); values.push(req.body[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    values.push(id);
    const result = await pool.query(
      `UPDATE Hostels SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values
    );
    res.json({ message: 'Hostel updated', hostel: result.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE hostel (landlord owns it, or admin)
export const deleteHostel = async (req, res) => {
  try {
    const { id } = req.params;
    const hostelRes = await pool.query('SELECT landlord_id FROM Hostels WHERE id = $1', [id]);
    if (hostelRes.rows.length === 0) return res.status(404).json({ message: 'Hostel not found' });
    if (req.user.role !== 'admin' && hostelRes.rows[0].landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    await pool.query('DELETE FROM Hostels WHERE id = $1', [id]);
    res.json({ message: 'Hostel deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /hostels/:id/flag — authenticated user reports a listing
export const flagHostel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    await pool.query(
      'INSERT INTO Listing_flags (hostel_id, reporter_id, reason) VALUES ($1, $2, $3)',
      [id, req.user.id, reason]
    );
    res.json({ message: 'Listing reported. Our team will review it.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /hostels/flagged — admin: see flagged listings with counts
export const getFlaggedHostels = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.id, h.hostel_name, h.university, h.status,
         COUNT(f.id) AS flag_count,
         ARRAY_AGG(f.reason ORDER BY f.created_at DESC) AS reasons
       FROM Hostels h
       JOIN Listing_flags f ON f.hostel_id = h.id
       GROUP BY h.id
       ORDER BY flag_count DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /hostels/:id/flags — admin: dismiss all flags for a hostel
export const dismissFlags = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Listing_flags WHERE hostel_id = $1', [id]);
    res.json({ message: 'Flags dismissed' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};