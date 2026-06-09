import pool from '../../database/db.js';

export const createSavedSearch = async (req, res) => {
  try {
    const { label, university, min_price, max_price, gender_policy } = req.body;
    const result = await pool.query(
      `INSERT INTO Saved_searches (student_id, label, university, min_price, max_price, gender_policy)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, label || university || 'My search', university, min_price, max_price, gender_policy]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMySavedSearches = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM Saved_searches WHERE student_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteSavedSearch = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'DELETE FROM Saved_searches WHERE id = $1 AND student_id = $2',
      [id, req.user.id]
    );
    res.json({ message: 'Saved search deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};
