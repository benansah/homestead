import pool from '../../database/db.js';

// GET — get all notifications for logged in user
export const getMyNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;

    const notifications = await pool.query(
      `SELECT * FROM Notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    const unread = notifications.rows.filter(n => !n.is_read).length;

    res.json({
      unread_count: unread,
      notifications: notifications.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH — mark a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await pool.query(
      `UPDATE Notifications 
       SET is_read = TRUE 
       WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH — mark ALL notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;

    await pool.query(
      `UPDATE Notifications SET is_read = TRUE WHERE user_id = $1`,
      [user_id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE — delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await pool.query(
      `DELETE FROM Notifications WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST — admin sends a notification to all users (broadcast)
export const broadcastNotification = async (req, res) => {
  try {
    const { message, not_type, role } = req.body;
    // role = 'student', 'landlord', or null (all users)

    let userQuery = 'SELECT id FROM Users';
    const values = [];

    if (role) {
      userQuery += ' WHERE role = $1';
      values.push(role);
    }

    const users = await pool.query(userQuery, values);

    for (const user of users.rows) {
      await pool.query(
        `INSERT INTO Notifications (user_id, not_message, not_type, is_read)
         VALUES ($1, $2, $3, FALSE)`,
        [user.id, message, not_type || 'system']
      );
    }

    res.json({
      message: `Notification sent to ${users.rows.length} users`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};