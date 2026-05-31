import pool from '../../database/db.js';

export const createReview = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { hostel_id, rating, comment, image_url } = req.body;

    // check student has a completed booking at this hostel
    const booking = await pool.query(
      `SELECT b.* FROM Bookings b
       JOIN Rooms r ON r.id = b.room_id
       JOIN Hostels h ON h.id = r.hostel_id
       WHERE b.student_id = $1 AND h.id = $2
       AND b.booking_status IN ('contact_released', 'completed')
       LIMIT 1`,
      [student_id, hostel_id]
    );

    if (booking.rows.length === 0) {
      return res.status(403).json({
        message: 'You can only review hostels you have visited',
      });
    }

    // check not already reviewed
    const existing = await pool.query(
      'SELECT id FROM Reviews WHERE student_id = $1 AND hostel_id = $2',
      [student_id, hostel_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this hostel' });
    }

    const review = await pool.query(
      `INSERT INTO Reviews (student_id, hostel_id, rating, comment, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_id, hostel_id, rating, comment, image_url || null]
    );

    res.status(201).json({
      message: 'Review submitted',
      review: review.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM Reviews WHERE id = $1', [id]);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};