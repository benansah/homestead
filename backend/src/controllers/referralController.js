import pool from '../../database/db.js';
import crypto from 'crypto';

// GET my referral code + stats
export const getMyReferrals = async (req, res) => {
  try {
    const user_id = req.user.id;

    // get or create referral code for this user
    let referral = await pool.query(
      'SELECT * FROM Referrals WHERE referrer_id = $1 LIMIT 1',
      [user_id]
    );

    // generate code if none exists
    if (referral.rows.length === 0) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      referral = await pool.query(
        `INSERT INTO Referrals (referrer_id, referee_id, code, status, reward_amount)
         VALUES ($1, $1, $2, 'pending', 0)
         RETURNING *`,
        [user_id, code]
      );
    }

    // count completed referrals
    const stats = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'pending')   AS pending,
        COALESCE(SUM(reward_amount) FILTER (WHERE status = 'completed'), 0) AS total_earned
       FROM Referrals
       WHERE referrer_id = $1 AND referee_id != $1`,
      [user_id]
    );

    res.json({
      code:         referral.rows[0].code,
      completed:    Number(stats.rows[0].completed),
      pending:      Number(stats.rows[0].pending),
      total_earned: Number(stats.rows[0].total_earned),
      share_link:   `${process.env.FRONTEND_URL}/register?ref=${referral.rows[0].code}`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST apply a referral code on register
export const applyReferralCode = async (req, res) => {
  try {
    const { code, referee_id } = req.body;

    // find the referrer's code
    const referral = await pool.query(
      `SELECT * FROM Referrals WHERE code = $1 AND referrer_id != $2 LIMIT 1`,
      [code, referee_id]
    );

    if (referral.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    const referrer_id = referral.rows[0].referrer_id;

    // create pending referral record
    await pool.query(
      `INSERT INTO Referrals (referrer_id, referee_id, code, status, reward_amount)
       VALUES ($1, $2, $3, 'pending', 0)
       ON CONFLICT DO NOTHING`,
      [referrer_id, referee_id, code]
    );

    res.json({ message: 'Referral code applied' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST complete referral when referee makes first booking
export const completeReferral = async (referree_id) => {
  try {
    const REWARD = 20; // GHS 20 reward
    await pool.query(
      `UPDATE Referrals
       SET status = 'completed', reward_amount = $1
       WHERE referee_id = $2 AND status = 'pending'`,
      [REWARD, referree_id]
    );
  } catch (error) {
    console.log('Referral completion error:', error);
  }
};