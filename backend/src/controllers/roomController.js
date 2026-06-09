import pool from '../../database/db.js';

// GET all rooms for a hostel
export const getRoomsByHostel = async (req, res) => {
  try {
    const { hostel_id } = req.params;

    const rooms = await pool.query(
      `SELECT r.*,
        ARRAY_AGG(ri.image_url) FILTER (WHERE ri.image_url IS NOT NULL) AS images
       FROM Rooms r
       LEFT JOIN Room_images ri ON ri.room_id = r.id
       WHERE r.hostel_id = $1
       GROUP BY r.id`,
      [hostel_id]
    );

    res.json(rooms.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST create single room
export const createRoom = async (req, res) => {
  try {
    const { hostel_id } = req.params;
    const { room_type, price, gender_policy, quantity, max_occupants } = req.body;

    const newRoom = await pool.query(
      `INSERT INTO Rooms
        (hostel_id, room_type, price, gender_policy, quantity, max_occupants, is_available)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)
       RETURNING *`,
      [hostel_id, room_type, price, gender_policy, quantity || 1, max_occupants || 1]
    );

    res.status(201).json({
      message: 'Room created',
      room: newRoom.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST bulk create rooms (multiple rooms at once)
export const createRoomsBulk = async (req, res) => {
  try {
    const { hostel_id } = req.params;
    const { rooms } = req.body;
    // rooms = [{ room_type, price, gender_policy, quantity }, ...]

    const created = [];
    for (const room of rooms) {
      const result = await pool.query(
        `INSERT INTO Rooms
          (hostel_id, room_type, price, gender_policy, quantity, max_occupants, is_available)
         VALUES ($1,$2,$3,$4,$5,$6,TRUE)
         RETURNING *`,
        [hostel_id, room.room_type, room.price, room.gender_policy, room.quantity || 1, room.max_occupants || 1]
      );
      created.push(result.rows[0]);
    }

    res.status(201).json({
      message: `${created.length} rooms created`,
      rooms: created,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH update room availability
export const updateRoomAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    const updated = await pool.query(
      `UPDATE Rooms SET is_available = $1 WHERE id = $2 RETURNING *`,
      [is_available, id]
    );

    res.json({
      message: 'Room availability updated',
      room: updated.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET single room by id (with hostel info + images)
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*,
        ARRAY_AGG(DISTINCT ri.image_url) FILTER (WHERE ri.image_url IS NOT NULL) AS images,
        h.hostel_name, h.hostel_address, h.university, h.landlord_id, h.is_verified,
        u.fullname AS landlord_name
       FROM Rooms r
       JOIN Hostels h ON h.id = r.hostel_id
       JOIN Users u ON u.id = h.landlord_id
       LEFT JOIN Room_images ri ON ri.room_id = r.id
       WHERE r.id = $1
       GROUP BY r.id, h.hostel_name, h.hostel_address, h.university, h.landlord_id, h.is_verified, u.fullname`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Room not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH update room fields (tour_url, availability, price, etc.)
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['tour_url', 'room_type', 'price', 'gender_policy', 'quantity', 'max_occupants', 'is_available'];
    const fields = []; const values = []; let idx = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) { fields.push(`${key} = $${idx++}`); values.push(req.body[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    values.push(id);
    const result = await pool.query(
      `UPDATE Rooms SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Room updated', room: result.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST add an image URL to a room's gallery
export const addRoomImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url } = req.body;
    if (!image_url) return res.status(400).json({ message: 'image_url is required' });
    await pool.query(
      `INSERT INTO Room_images (room_id, image_url, uploaded_by) VALUES ($1, $2, $3)`,
      [id, image_url, req.user.id]
    );
    res.status(201).json({ message: 'Image added' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST upload 360° tour image (multipart) and set tour_url on the room
export const setTourImage = async (req, res) => {
  try {
    const { id } = req.params;
    const url = req.file?.path;
    if (!url) return res.status(400).json({ message: 'No file uploaded' });
    await pool.query(`UPDATE Rooms SET tour_url = $1 WHERE id = $2`, [url, id]);
    res.json({ message: '360° tour set', tour_url: url });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE room (landlord owns the hostel, or admin)
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await pool.query(
      'SELECT h.landlord_id FROM Rooms r JOIN Hostels h ON h.id = r.hostel_id WHERE r.id = $1',
      [id]
    );
    if (check.rows.length === 0) return res.status(404).json({ message: 'Room not found' });
    if (req.user.role !== 'admin' && check.rows[0].landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }
    await pool.query('DELETE FROM Rooms WHERE id = $1', [id]);
    res.json({ message: 'Room deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH bulk update availability for all rooms in a hostel
export const bulkUpdateAvailability = async (req, res) => {
  try {
    const { hostel_id, is_available } = req.body;
    if (!hostel_id || is_available === undefined) {
      return res.status(400).json({ message: 'hostel_id and is_available are required' });
    }

    const hostelRes = await pool.query('SELECT landlord_id FROM Hostels WHERE id = $1', [hostel_id]);
    if (hostelRes.rows.length === 0) return res.status(404).json({ message: 'Hostel not found' });
    if (req.user.role !== 'admin' && hostelRes.rows[0].landlord_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    const result = await pool.query(
      'UPDATE Rooms SET is_available = $1 WHERE hostel_id = $2 RETURNING id',
      [is_available, hostel_id]
    );
    res.json({ message: `Updated ${result.rowCount} rooms`, updated: result.rowCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};