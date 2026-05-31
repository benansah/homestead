import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import pool from '../../database/db.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/email.js';

export const registerUser = async (req, res) => {
  try {
    const {
      fullname,
      email,
      password,
      phone,
      university,
      role
    } = req.body;

    // check existing user
    const existingUser = await pool.query(
      'SELECT * FROM Users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // insert user
    const newUser = await pool.query(
      `INSERT INTO Users
      (fullname, email, password_hash, phone, university, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        fullname,
        email,
        hashedPassword,
        phone,
        university,
        role || 'student'
      ]
    );

    const created = newUser.rows[0];
    sendWelcomeEmail(created.email, created.fullname).catch(console.error);

    res.status(201).json({
      message: 'User registered',
      user: created,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      'SELECT * FROM Users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!validPassword) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: user.rows[0].id,
        role: user.rows[0].role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    res.json({
      token,
      user: user.rows[0]
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const result = await pool.query('SELECT id, fullname FROM Users WHERE email = $1', [email]);
    // Always respond 200 — don't reveal whether email exists
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate old tokens for this user
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1', [user.id]);
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, user.fullname, resetUrl);

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const result = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    const { id: tokenId, user_id } = result.rows[0];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query('UPDATE Users SET password_hash = $1 WHERE id = $2', [hashedPassword, user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenId]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential, role = 'student' } = req.body;
    if (!credential) return res.status(400).json({ message: 'No credential provided' });

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO Users (fullname, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, email, '', role]
      );
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await pool.query(
      'SELECT id, fullname, email, role FROM Users'
    );

    res.json(users.rows);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
};