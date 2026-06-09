import pool from '../../database/db.js';

// POST upload room images
export const uploadRoomImages = async (req, res) => {
  try {
    const { room_id } = req.params;
    const uploaded_by = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const inserted = [];
    for (const file of req.files) {
      const result = await pool.query(
        `INSERT INTO Room_images (room_id, image_url, uploaded_by)
         VALUES ($1, $2, $3) RETURNING *`,
        [room_id, file.path, uploaded_by]
      );
      inserted.push(result.rows[0]);
    }

    res.status(201).json({
      message: `${inserted.length} image(s) uploaded`,
      images: inserted,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Upload failed' });
  }
};

// DELETE a room image
export const deleteRoomImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await pool.query(
      'SELECT * FROM Room_images WHERE id = $1',
      [id]
    );
    if (image.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // delete from cloudinary
    const urlParts  = image.rows[0].image_url.split('/');
    const publicId  = `Homestead/${urlParts[urlParts.length - 1].split('.')[0]}`;
    const { default: cloudinary } = await import('../services/cloudinary.js');
    await cloudinary.uploader.destroy(publicId);

    // delete from db
    await pool.query('DELETE FROM Room_images WHERE id = $1', [id]);

    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Delete failed' });
  }
};