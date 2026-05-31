import pool from '../../database/db.js';

// GET — main search with all filters + proximity
export const searchHostels = async (req, res) => {
  try {
    const {
      university,
      min_price,
      max_price,
      gender_policy,
      room_type,
      is_verified,
      lat,        // student's latitude
      lng,        // student's longitude
      radius_km,  // default 5km
    } = req.query;

    let query = `
      SELECT 
        h.*,
        MIN(r.price) AS min_price,
        MAX(r.price) AS max_price,
        COUNT(DISTINCT r.id) AS total_rooms,
        COUNT(DISTINCT r.id) FILTER (WHERE r.is_available = TRUE) AS available_rooms,
        ROUND(AVG(rv.rating)::numeric, 1) AS avg_rating,
        COUNT(DISTINCT rv.id) AS total_reviews,
        ARRAY_AGG(DISTINCT ri.image_url) 
          FILTER (WHERE ri.image_url IS NOT NULL) AS images
    `;

    // add distance calculation if coordinates provided
    if (lat && lng) {
      query += `,
        ROUND((
          6371 * acos(
            cos(radians($${1})) * cos(radians(h.latitude)) *
            cos(radians(h.longitude) - radians($${2})) +
            sin(radians($${1})) * sin(radians(h.latitude))
          )
        )::numeric, 2) AS distance_km
      `;
    }

    query += `
      FROM Hostels h
      LEFT JOIN Rooms r ON r.hostel_id = h.id
      LEFT JOIN Reviews rv ON rv.hostel_id = h.id
      LEFT JOIN Room_images ri ON ri.room_id = r.id
      WHERE h.status = 'approved'
    `;

    const values = [];
    let i = 1;

    if (lat && lng) {
      values.push(parseFloat(lat));  // $1
      values.push(parseFloat(lng));  // $2
      i = 3;
    }

    if (university) {
      query += ` AND h.university ILIKE $${i++}`;
      values.push(`%${university}%`);
    }
    if (is_verified === 'true') {
      query += ` AND h.is_verified = TRUE`;
    }
    if (gender_policy) {
      query += ` AND r.gender_policy = $${i++}`;
      values.push(gender_policy);
    }
    if (room_type) {
      query += ` AND r.room_type ILIKE $${i++}`;
      values.push(`%${room_type}%`);
    }
    if (min_price) {
      query += ` AND r.price >= $${i++}`;
      values.push(parseFloat(min_price));
    }
    if (max_price) {
      query += ` AND r.price <= $${i++}`;
      values.push(parseFloat(max_price));
    }

    query += ` GROUP BY h.id`;

    // filter by radius after grouping
    if (lat && lng) {
      const km = parseFloat(radius_km) || 5;
      query += `
        HAVING (
          6371 * acos(
            cos(radians(${values[0]})) * cos(radians(h.latitude)) *
            cos(radians(h.longitude) - radians(${values[1]})) +
            sin(radians(${values[0]})) * sin(radians(h.latitude))
          )
        ) <= ${km}
      `;
      query += ` ORDER BY distance_km ASC`;
    } else {
      query += ` ORDER BY h.is_verified DESC, avg_rating DESC NULLS LAST`;
    }

    const result = await pool.query(query, values);

    res.json({
      count: result.rows.length,
      hostels: result.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET — nearby hostels to a specific university
export const getNearbyHostels = async (req, res) => {
  try {
    const { university } = req.params;

    // university GPS coordinates map
    const universityCoords = {
      'University of Ghana':     { lat: 5.6502,  lng: -0.1869 },
      'KNUST':                   { lat: 6.6745,  lng: -1.5716 },
      'UCC':                     { lat: 5.1054,  lng: -1.2466 },
      'University of Education': { lat: 5.7500,  lng: -0.2167 },
      'Ashesi University':       { lat: 5.7592,  lng: -0.2196 },
    };

    const coords = universityCoords[university];
    if (!coords) {
      return res.status(404).json({ message: 'University not found in our database' });
    }

    const result = await pool.query(
      `SELECT h.*,
        MIN(r.price) AS min_price,
        ROUND(AVG(rv.rating)::numeric, 1) AS avg_rating,
        ROUND((
          6371 * acos(
            cos(radians($1)) * cos(radians(h.latitude)) *
            cos(radians(h.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(h.latitude))
          )
        )::numeric, 2) AS distance_km
       FROM Hostels h
       LEFT JOIN Rooms r ON r.hostel_id = h.id
       LEFT JOIN Reviews rv ON rv.hostel_id = h.id
       WHERE h.status = 'approved'
       GROUP BY h.id
       HAVING (
          6371 * acos(
            cos(radians($1)) * cos(radians(h.latitude)) *
            cos(radians(h.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(h.latitude))
          )
        ) <= 5
       ORDER BY distance_km ASC`,
      [coords.lat, coords.lng]
    );

    res.json({
      university,
      coords,
      count: result.rows.length,
      hostels: result.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET — compare up to 3 hostels side by side
export const compareHostels = async (req, res) => {
  try {
    const { ids } = req.query;
    // ids = "1,2,3"

    if (!ids) {
      return res.status(400).json({ message: 'Provide hostel ids to compare e.g. ?ids=1,2,3' });
    }

    const idList = ids.split(',').slice(0, 3); // max 3

    const result = await pool.query(
      `SELECT 
        h.*,
        MIN(r.price) AS min_price,
        MAX(r.price) AS max_price,
        COUNT(DISTINCT r.id) AS total_rooms,
        COUNT(DISTINCT r.id) FILTER (WHERE r.is_available = TRUE) AS available_rooms,
        ROUND(AVG(rv.rating)::numeric, 1) AS avg_rating,
        COUNT(DISTINCT rv.id) AS total_reviews,
        ARRAY_AGG(DISTINCT r.room_type) AS room_types,
        ARRAY_AGG(DISTINCT r.gender_policy) AS gender_policies,
        ARRAY_AGG(DISTINCT ri.image_url)
          FILTER (WHERE ri.image_url IS NOT NULL) AS images
       FROM Hostels h
       LEFT JOIN Rooms r ON r.hostel_id = h.id
       LEFT JOIN Reviews rv ON rv.hostel_id = h.id
       LEFT JOIN Room_images ri ON ri.room_id = r.id
       WHERE h.id = ANY($1::int[])
       GROUP BY h.id`,
      [idList]
    );

    res.json({
      count: result.rows.length,
      hostels: result.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET — preference quiz match
export const matchHostels = async (req, res) => {
  try {
    const {
      university,
      max_price,
      gender_policy,
      room_type,      // 'Self-contained' or 'Shared'
      max_distance_km,
    } = req.query;

    const result = await pool.query(
      `SELECT DISTINCT h.*,
        MIN(r.price) AS min_price,
        ROUND(AVG(rv.rating)::numeric, 1) AS avg_rating
       FROM Hostels h
       JOIN Rooms r ON r.hostel_id = h.id
       LEFT JOIN Reviews rv ON rv.hostel_id = h.id
       WHERE h.status = 'approved'
         AND h.university ILIKE $1
         AND r.price <= $2
         AND r.gender_policy = $3
         AND r.room_type ILIKE $4
         AND r.is_available = TRUE
       GROUP BY h.id
       ORDER BY avg_rating DESC NULLS LAST
       LIMIT 5`,
      [
        `%${university}%`,
        parseFloat(max_price) || 9999,
        gender_policy || 'Both',
        `%${room_type || ''}%`,
      ]
    );

    res.json({
      message: `Found ${result.rows.length} hostels matching your preferences`,
      hostels: result.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};