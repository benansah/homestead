import pool from '../../database/db.js';

export const getResidenceAreas = async (req, res) => {
  try {
    const { university_name } = req.query;

    let query = `
      SELECT id, university_name, name, created_at
      FROM Residence_areas
    `;
    const values = [];

    if (university_name) {
      query += ` WHERE university_name ILIKE $1`;
      values.push(`%${university_name}%`);
    }

    query += ` ORDER BY university_name ASC, name ASC`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createResidenceArea = async (req, res) => {
  try {
    const { university_name, name } = req.body;

    if (!university_name?.trim() || !name?.trim()) {
      return res.status(400).json({ message: 'University and area name are required' });
    }

    const result = await pool.query(
      `INSERT INTO Residence_areas (university_name, name)
       VALUES ($1, $2)
       RETURNING *`,
      [university_name.trim(), name.trim()]
    );

    res.status(201).json({ message: 'Residence area added', residenceArea: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'This residence area already exists for that university' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateResidenceArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { university_name, name } = req.body;

    if (!university_name?.trim() || !name?.trim()) {
      return res.status(400).json({ message: 'University and area name are required' });
    }

    const result = await pool.query(
      `UPDATE Residence_areas
       SET university_name = $1, name = $2
       WHERE id = $3
       RETURNING *`,
      [university_name.trim(), name.trim(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Residence area not found' });
    }

    res.json({ message: 'Residence area updated', residenceArea: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'This residence area already exists for that university' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteResidenceArea = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Residence_areas WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Residence area not found' });
    }

    res.json({ message: 'Residence area deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
