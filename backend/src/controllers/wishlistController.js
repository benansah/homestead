import pool from '../../database/db.js';

export const getWishlist = async (req, res) => {
  try {
    const student_id = req.user.id;
    const result = await pool.query(
      `SELECT h.*,
        MIN(r.price) AS min_price,
        ROUND(AVG(rv.rating)::numeric, 1) AS avg_rating,
        COUNT(DISTINCT r.id) FILTER (WHERE r.is_available = TRUE) AS available_rooms,
        ARRAY_AGG(DISTINCT ri.image_url)
          FILTER (WHERE ri.image_url IS NOT NULL) AS images
       FROM Wishlists w
       JOIN Hostels h ON h.id = w.hostel_id
       LEFT JOIN Rooms r ON r.hostel_id = h.id
       LEFT JOIN Reviews rv ON rv.hostel_id = h.id
       LEFT JOIN Room_images ri ON ri.room_id = r.id
       WHERE w.student_id = $1
       GROUP BY h.id`,
      [student_id]
    );
    res.json({ hostels: result.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { hostel_id } = req.body;

    await pool.query(
      `INSERT INTO Wishlists (student_id, hostel_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, hostel_id) DO NOTHING`,
      [student_id, hostel_id]
    );
    res.json({ message: 'Added to wishlist' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { hostel_id } = req.params;

    await pool.query(
      'DELETE FROM Wishlists WHERE student_id = $1 AND hostel_id = $2',
      [student_id, hostel_id]
    );
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};