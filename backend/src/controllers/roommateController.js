import pool from '../../database/db.js';

// Score two profiles' compatibility (0–100)
function compatibilityScore(a, b) {
  let score = 0;
  const total = 4;

  // sleep_schedule: flexible matches anything
  if (a.sleep_schedule === b.sleep_schedule) score += 1;
  else if (a.sleep_schedule === 'flexible' || b.sleep_schedule === 'flexible') score += 1;

  // study_habits: flexible matches anything
  if (a.study_habits === b.study_habits) score += 1;
  else if (a.study_habits === 'flexible' || b.study_habits === 'flexible') score += 1;

  // cleanliness: exact=1, adjacent=0.5, far=0
  const cleanRank = { very_tidy: 2, moderate: 1, relaxed: 0 };
  const diff = Math.abs(cleanRank[a.cleanliness] - cleanRank[b.cleanliness]);
  if (diff === 0) score += 1;
  else if (diff === 1) score += 0.5;

  // guests: exact=1, adjacent=0.5, far=0
  const guestRank = { frequent: 2, occasional: 1, never: 0 };
  const gdiff = Math.abs(guestRank[a.guests] - guestRank[b.guests]);
  if (gdiff === 0) score += 1;
  else if (gdiff === 1) score += 0.5;

  return Math.round((score / total) * 100);
}

// POST /api/roommates/profile — create or update profile
export const createOrUpdateProfile = async (req, res) => {
  const { id: user_id } = req.user;
  const { gender, sleep_schedule, study_habits, cleanliness, guests, gender_preference, bio } = req.body;

  if (!gender || !sleep_schedule || !study_habits || !cleanliness || !guests || !gender_preference) {
    return res.status(400).json({ message: 'All preference fields are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO Roommate_profiles
         (user_id, gender, sleep_schedule, study_habits, cleanliness, guests, gender_preference, bio, is_active, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         gender=$2, sleep_schedule=$3, study_habits=$4, cleanliness=$5,
         guests=$6, gender_preference=$7, bio=$8, is_active=TRUE, updated_at=NOW()
       RETURNING *`,
      [user_id, gender, sleep_schedule, study_habits, cleanliness, guests, gender_preference, bio || null]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save profile' });
  }
};

// GET /api/roommates/profile — get own profile
export const getMyProfile = async (req, res) => {
  const { id: user_id } = req.user;
  try {
    const result = await pool.query(
      'SELECT * FROM Roommate_profiles WHERE user_id=$1',
      [user_id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'No profile found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// GET /api/roommates/matches?hostel_id=X — ranked matches
export const getMatches = async (req, res) => {
  const { id: user_id } = req.user;
  const { hostel_id } = req.query;

  try {
    // Get own profile first
    const ownResult = await pool.query(
      'SELECT * FROM Roommate_profiles WHERE user_id=$1 AND is_active=TRUE',
      [user_id]
    );
    if (!ownResult.rows.length) {
      return res.status(400).json({ message: 'Set up your roommate profile first' });
    }
    const own = ownResult.rows[0];

    // Build candidate query — exclude self, inactive profiles, and existing request pairs
    let candidateQuery = `
      SELECT rp.*, u.fullname, u.university
      FROM Roommate_profiles rp
      JOIN Users u ON u.id = rp.user_id
      WHERE rp.user_id != $1
        AND rp.is_active = TRUE
        AND u.role = 'student'
        AND NOT EXISTS (
          SELECT 1 FROM Roommate_requests rr
          WHERE (rr.sender_id=$1 AND rr.receiver_id=rp.user_id)
             OR (rr.sender_id=rp.user_id AND rr.receiver_id=$1)
        )
    `;
    const params = [user_id];

    // Apply gender filter — if I want 'same', only show same gender
    if (own.gender_preference === 'same') {
      params.push(own.gender);
      candidateQuery += ` AND rp.gender=$${params.length}`;
    }
    // Also filter out people who want 'same' but are a different gender
    candidateQuery += ` AND (rp.gender_preference='any' OR rp.gender=$${params.length === 1 ? 1 : params.length})`;

    // Hostel-level: if hostel_id provided, prioritise students with confirmed bookings there
    if (hostel_id) {
      params.push(hostel_id);
      candidateQuery += `
        AND EXISTS (
          SELECT 1 FROM Bookings b
          JOIN Rooms r ON r.id=b.room_id
          WHERE b.student_id=rp.user_id
            AND r.hostel_id=$${params.length}
            AND b.booking_status IN ('confirmed','contact_released','completed')
        )
      `;
    }

    const candidates = await pool.query(candidateQuery, params);

    // Score and sort
    const scored = candidates.rows.map(candidate => ({
      user_id: candidate.user_id,
      fullname: candidate.fullname,
      university: candidate.university,
      gender: candidate.gender,
      sleep_schedule: candidate.sleep_schedule,
      study_habits: candidate.study_habits,
      cleanliness: candidate.cleanliness,
      guests: candidate.guests,
      gender_preference: candidate.gender_preference,
      bio: candidate.bio,
      compatibility_score: compatibilityScore(own, candidate),
    })).sort((a, b) => b.compatibility_score - a.compatibility_score);

    // If hostel-level returned nothing, fall back to platform-wide (remove hostel filter)
    if (hostel_id && scored.length === 0) {
      return getMatches({ ...req, query: {} }, res);
    }

    res.json({
      total: scored.length,
      scope: hostel_id ? 'hostel' : 'platform',
      matches: scored,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch matches' });
  }
};

// POST /api/roommates/request — send match request
export const sendRequest = async (req, res) => {
  const { id: sender_id } = req.user;
  const { receiver_id, hostel_id } = req.body;

  if (!receiver_id) return res.status(400).json({ message: 'receiver_id is required' });
  if (receiver_id === sender_id) return res.status(400).json({ message: 'Cannot request yourself' });

  try {
    // Check receiver exists and has an active profile
    const profile = await pool.query(
      'SELECT id FROM Roommate_profiles WHERE user_id=$1 AND is_active=TRUE',
      [receiver_id]
    );
    if (!profile.rows.length) {
      return res.status(404).json({ message: 'This student does not have an active roommate profile' });
    }

    const result = await pool.query(
      `INSERT INTO Roommate_requests (sender_id, receiver_id, hostel_id)
       VALUES ($1,$2,$3)
       ON CONFLICT (sender_id, receiver_id) DO NOTHING
       RETURNING *`,
      [sender_id, receiver_id, hostel_id || null]
    );

    if (!result.rows.length) {
      return res.status(409).json({ message: 'Request already sent' });
    }

    // Notify receiver
    const senderRes = await pool.query('SELECT fullname FROM Users WHERE id=$1', [sender_id]);
    const senderName = senderRes.rows[0]?.fullname || 'A student';
    await pool.query(
      `INSERT INTO Notifications (user_id, not_message, not_type)
       VALUES ($1,$2,'roommate')`,
      [receiver_id, `${senderName} wants to be your roommate! Check your roommate requests.`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send request' });
  }
};

// GET /api/roommates/requests — incoming + outgoing
export const getRequests = async (req, res) => {
  const { id: user_id } = req.user;
  try {
    const incoming = await pool.query(
      `SELECT rr.*, u.fullname AS sender_name, u.phone AS sender_phone,
              u.university AS sender_university,
              rp.gender, rp.sleep_schedule, rp.study_habits,
              rp.cleanliness, rp.guests, rp.bio,
              h.hostel_name
       FROM Roommate_requests rr
       JOIN Users u ON u.id=rr.sender_id
       LEFT JOIN Roommate_profiles rp ON rp.user_id=rr.sender_id
       LEFT JOIN Hostels h ON h.id=rr.hostel_id
       WHERE rr.receiver_id=$1
       ORDER BY rr.created_at DESC`,
      [user_id]
    );

    const outgoing = await pool.query(
      `SELECT rr.*, u.fullname AS receiver_name, u.phone AS receiver_phone,
              u.university AS receiver_university,
              rp.gender, rp.sleep_schedule, rp.study_habits,
              rp.cleanliness, rp.guests, rp.bio,
              h.hostel_name
       FROM Roommate_requests rr
       JOIN Users u ON u.id=rr.receiver_id
       LEFT JOIN Roommate_profiles rp ON rp.user_id=rr.receiver_id
       LEFT JOIN Hostels h ON h.id=rr.hostel_id
       WHERE rr.sender_id=$1
       ORDER BY rr.created_at DESC`,
      [user_id]
    );

    res.json({ incoming: incoming.rows, outgoing: outgoing.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

// PATCH /api/roommates/request/:id — accept or reject
export const respondToRequest = async (req, res) => {
  const { id: user_id } = req.user;
  const { id: request_id } = req.params;
  const { action } = req.body; // 'accepted' | 'rejected'

  if (!['accepted', 'rejected'].includes(action)) {
    return res.status(400).json({ message: 'action must be accepted or rejected' });
  }

  try {
    const reqResult = await pool.query(
      'SELECT * FROM Roommate_requests WHERE id=$1 AND receiver_id=$2 AND status=$3',
      [request_id, user_id, 'pending']
    );
    if (!reqResult.rows.length) {
      return res.status(404).json({ message: 'Request not found or already responded' });
    }
    const request = reqResult.rows[0];

    await pool.query(
      'UPDATE Roommate_requests SET status=$1, updated_at=NOW() WHERE id=$2',
      [action, request_id]
    );

    if (action === 'accepted') {
      // Fetch both users' details
      const [receiverRes, senderRes] = await Promise.all([
        pool.query('SELECT fullname, phone FROM Users WHERE id=$1', [user_id]),
        pool.query('SELECT fullname, phone FROM Users WHERE id=$1', [request.sender_id]),
      ]);
      const receiver = receiverRes.rows[0];
      const sender = senderRes.rows[0];

      // Notify sender with receiver's contact
      await pool.query(
        `INSERT INTO Notifications (user_id, not_message, not_type) VALUES ($1,$2,'roommate')`,
        [request.sender_id,
         `${receiver.fullname} accepted your roommate request! Contact them: ${receiver.phone}`]
      );
      // Notify receiver with sender's contact
      await pool.query(
        `INSERT INTO Notifications (user_id, not_message, not_type) VALUES ($1,$2,'roommate')`,
        [user_id,
         `You and ${sender.fullname} are now roommate matches! Contact them: ${sender.phone}`]
      );
    }

    res.json({ message: `Request ${action}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to respond to request' });
  }
};

// DELETE /api/roommates/profile — deactivate (hide from matches)
export const deactivateProfile = async (req, res) => {
  const { id: user_id } = req.user;
  try {
    await pool.query(
      'UPDATE Roommate_profiles SET is_active=FALSE, updated_at=NOW() WHERE user_id=$1',
      [user_id]
    );
    res.json({ message: 'Profile deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to deactivate profile' });
  }
};
