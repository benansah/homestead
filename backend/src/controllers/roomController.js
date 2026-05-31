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
    const { room_type, price, gender_policy, quantity } = req.body;

    const newRoom = await pool.query(
      `INSERT INTO Rooms
        (hostel_id, room_type, price, gender_policy, quantity, is_available)
       VALUES ($1,$2,$3,$4,$5,TRUE)
       RETURNING *`,
      [hostel_id, room_type, price, gender_policy, quantity || 1]
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
          (hostel_id, room_type, price, gender_policy, quantity, is_available)
         VALUES ($1,$2,$3,$4,$5,TRUE)
         RETURNING *`,
        [hostel_id, room.room_type, room.price, room.gender_policy, room.quantity || 1]
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

// DELETE room
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Rooms WHERE id = $1', [id]);
    res.json({ message: 'Room deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};