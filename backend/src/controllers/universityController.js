import pool from '../../database/db.js';

export const getAllUniversities = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.location, u.created_at,
        COUNT(DISTINCT h.id)::int AS hostel_count
      FROM Universities u
      LEFT JOIN Hostels h ON h.university = u.name AND h.status = 'approved'
      GROUP BY u.id
      ORDER BY u.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createUniversity = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'University name is required' });
    }
    const result = await pool.query(
      'INSERT INTO Universities (name, location) VALUES ($1, $2) RETURNING *',
      [name.trim(), location?.trim() || null]
    );
    res.status(201).json({ message: 'University added', university: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'University already exists' });
    }
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'University name is required' });
    const result = await pool.query(
      'UPDATE Universities SET name = $1, location = $2 WHERE id = $3 RETURNING *',
      [name.trim(), location?.trim() || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'University not found' });
    res.json({ message: 'University updated', university: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'University already exists' });
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUniversity = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Universities WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'University not found' });
    }
    res.json({ message: 'University deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};
