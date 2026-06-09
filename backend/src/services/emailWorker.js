import nodemailer from 'nodemailer';
import pool from '../../database/db.js';

const createTransport = () =>
  nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const FROM = () => process.env.EMAIL_FROM || 'Homestead <noreply@homestead.com>';

export const processEmailQueue = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  let rows;
  try {
    const result = await pool.query(
      `SELECT id, to_email, subject, html FROM Email_queue
       WHERE status = 'pending' AND attempts < 3
       ORDER BY created_at ASC
       LIMIT 10`
    );
    rows = result.rows;
  } catch {
    return;
  }

  for (const row of rows) {
    try {
      await pool.query(
        `UPDATE Email_queue SET attempts = attempts + 1, last_attempt = NOW() WHERE id = $1`,
        [row.id]
      );
      await createTransport().sendMail({
        from: FROM(),
        to: row.to_email,
        subject: row.subject,
        html: row.html,
      });
      await pool.query(
        `UPDATE Email_queue SET status = 'sent' WHERE id = $1`,
        [row.id]
      );
    } catch (err) {
      console.error(`Email queue: failed to send to ${row.to_email}:`, err.message);
      const attemptsRes = await pool.query(
        `SELECT attempts FROM Email_queue WHERE id = $1`, [row.id]
      );
      if (attemptsRes.rows[0]?.attempts >= 3) {
        await pool.query(
          `UPDATE Email_queue SET status = 'failed' WHERE id = $1`, [row.id]
        );
      }
    }
  }
};
