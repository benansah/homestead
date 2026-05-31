import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database...');
    await client.query('BEGIN');

    // ── 1. Clear existing data (order matters — children first) ──
    await client.query(`
      DELETE FROM Notifications;
      DELETE FROM Referrals;
      DELETE FROM Availability;
      DELETE FROM Wishlists;
      DELETE FROM Reviews;
      DELETE FROM Bookings;
      DELETE FROM Room_images;
      DELETE FROM Rooms;
      DELETE FROM Hostels;
      DELETE FROM Users;
    `);
    console.log('✅ Cleared old data');

    // ── 2. Create Users ──────────────────────────────────────────
    const password = await bcrypt.hash('password123', 10);

    const usersResult = await client.query(`
      INSERT INTO Users (fullname, email, password_hash, phone, university, role)
      VALUES
        ('Admin User',       'admin@hostelgh.com',    '${password}', '0201111111', NULL,                  'admin'),
        ('Kwame Mensah',     'kwame@ug.edu.gh',       '${password}', '0241234567', 'University of Ghana', 'student'),
        ('Abena Asante',     'abena@knust.edu.gh',    '${password}', '0551234567', 'KNUST',               'student'),
        ('Kofi Boateng',     'kofi@ucc.edu.gh',       '${password}', '0271234567', 'UCC',                 'student'),
        ('Mr. Agyemang',     'agyemang@gmail.com',    '${password}', '0241111111', NULL,                  'landlord'),
        ('Mrs. Darkoa',      'darkoa@gmail.com',      '${password}', '0551111111', NULL,                  'landlord'),
        ('Mr. Asiedu',       'asiedu@gmail.com',      '${password}', '0271111111', NULL,                  'landlord')
      RETURNING id, fullname, role;
    `);

    const users     = usersResult.rows;
    const students  = users.filter(u => u.role === 'student');
    const landlords = users.filter(u => u.role === 'landlord');
    console.log(`✅ Created ${users.length} users`);

    // ── 3. Create Hostels ────────────────────────────────────────
    const hostelsResult = await client.query(`
      INSERT INTO Hostels
        (landlord_id, hostel_name, hostel_address, university,
         description, latitude, longitude, status, is_verified, track)
      VALUES
        (${landlords[0].id}, 'Nana Ama Hostel',
         'Legon Road, Accra', 'University of Ghana',
         'Clean, quiet hostel 5 mins walk from UG main gate. Self-contained rooms available.',
         5.6502, -0.1869, 'approved', TRUE, 'A'),

        (${landlords[1].id}, 'Kotoko Lodge',
         'Ayeduase, Kumasi', 'KNUST',
         'Affordable rooms close to KNUST. Shared and self-contained options.',
         6.6745, -1.5716, 'approved', TRUE, 'B'),

        (${landlords[2].id}, 'Cape View Hostel',
         'University Road, Cape Coast', 'UCC',
         'Spacious rooms with good ventilation. 10 mins from UCC campus.',
         5.1054, -1.2466, 'approved', FALSE, 'B')
      RETURNING id, hostel_name;
    `);

    const hostels = hostelsResult.rows;
    console.log(`✅ Created ${hostels.length} hostels`);

    // ── 4. Create Rooms ──────────────────────────────────────────
    const roomsResult = await client.query(`
      INSERT INTO Rooms
        (hostel_id, room_type, price, gender_policy, quantity, is_available)
      VALUES
        (${hostels[0].id}, 'Self-contained Single', 2500.00, 'Both',   4, TRUE),
        (${hostels[0].id}, 'Self-contained Double', 1800.00, 'Female', 3, TRUE),
        (${hostels[0].id}, 'Shared Room',            900.00, 'Male',   6, TRUE),
        (${hostels[1].id}, 'Self-contained Single', 2000.00, 'Both',   5, TRUE),
        (${hostels[1].id}, 'Shared Room',            750.00, 'Both',   8, FALSE),
        (${hostels[2].id}, 'Self-contained Double', 1600.00, 'Female', 4, TRUE),
        (${hostels[2].id}, 'Shared Room',            700.00, 'Male',   6, TRUE)
      RETURNING id, room_type;
    `);

    const rooms = roomsResult.rows;
    console.log(`✅ Created ${rooms.length} rooms`);

    // ── 5. Room images ───────────────────────────────────────────
    await client.query(`
      INSERT INTO Room_images (room_id, image_url, uploaded_by)
      VALUES
        (${rooms[0].id}, 'https://res.cloudinary.com/demo/image/upload/sample1.jpg', ${landlords[0].id}),
        (${rooms[0].id}, 'https://res.cloudinary.com/demo/image/upload/sample2.jpg', ${landlords[0].id}),
        (${rooms[3].id}, 'https://res.cloudinary.com/demo/image/upload/sample3.jpg', ${landlords[1].id}),
        (${rooms[5].id}, 'https://res.cloudinary.com/demo/image/upload/sample4.jpg', ${landlords[2].id})
    `);
    console.log('✅ Created room images');

    // ── 6. Bookings ──────────────────────────────────────────────
    await client.query(`
      INSERT INTO Bookings
        (student_id, room_id, booking_type, booking_status, payment_ref, viewing_fee)
      VALUES
        (${students[0].id}, ${rooms[0].id}, 'Viewing', 'confirmed',        'PAY_REF_001', 50.00),
        (${students[1].id}, ${rooms[3].id}, 'Viewing', 'pending',           NULL,          50.00),
        (${students[2].id}, ${rooms[5].id}, 'Viewing', 'contact_released', 'PAY_REF_002', 50.00)
    `);
    console.log('✅ Created bookings');

    // ── 7. Reviews ───────────────────────────────────────────────
    await client.query(`
      INSERT INTO Reviews (student_id, hostel_id, rating, comment)
      VALUES
        (${students[0].id}, ${hostels[0].id}, 4.5, 'Great location, very clean. Landlord was responsive and helpful.'),
        (${students[2].id}, ${hostels[2].id}, 3.5, 'Decent rooms but water supply can be inconsistent.')
    `);
    console.log('✅ Created reviews');

    // ── 8. Wishlists ─────────────────────────────────────────────
    await client.query(`
      INSERT INTO Wishlists (student_id, hostel_id)
      VALUES
        (${students[0].id}, ${hostels[1].id}),
        (${students[1].id}, ${hostels[0].id}),
        (${students[1].id}, ${hostels[2].id})
    `);
    console.log('✅ Created wishlists');

    // ── 9. Availability ──────────────────────────────────────────
    await client.query(`
      INSERT INTO Availability (room_id, is_available, last_confirmed_at)
      VALUES
        (${rooms[0].id}, TRUE,  NOW()),
        (${rooms[1].id}, TRUE,  NOW()),
        (${rooms[3].id}, TRUE,  NOW()),
        (${rooms[4].id}, FALSE, NOW() - INTERVAL '7 days'),
        (${rooms[5].id}, TRUE,  NOW())
    `);
    console.log('✅ Created availability records');

    // ── 10. Referrals ────────────────────────────────────────────
    await client.query(`
      INSERT INTO Referrals
        (referrer_id, referee_id, code, status, reward_amount)
      VALUES
        (${students[0].id}, ${students[1].id}, 'KWAME2024', 'completed', 20.00),
        (${students[1].id}, ${students[2].id}, 'ABENA2024', 'pending',    0.00)
    `);
    console.log('✅ Created referrals');

    // ── 11. Notifications ────────────────────────────────────────
    await client.query(`
      INSERT INTO Notifications (user_id, not_message, not_type, is_read)
      VALUES
        (${students[0].id}, 'Your booking at Nana Ama Hostel has been confirmed!',       'booking',      FALSE),
        (${students[1].id}, 'A room you saved at Nana Ama Hostel is still available.',   'availability', FALSE),
        (${students[0].id}, 'Your referral reward of GHS 20 has been credited.',         'referral',     TRUE),
        (${landlords[0].id},'Your hostel listing has been approved by admin.',            'system',       FALSE)
    `);
    console.log('✅ Created notifications');

    await client.query('COMMIT');
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nTest login credentials (all passwords: password123)');
    console.log('  Admin:    admin@hostelgh.com');
    console.log('  Student:  kwame@ug.edu.gh');
    console.log('  Landlord: agyemang@gmail.com');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();