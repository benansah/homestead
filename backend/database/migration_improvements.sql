-- hostelGH improvement sprint migration
-- Run: psql "postgresql://postgres:admin@localhost:6000/hostel_finder" -f backend/database/migration_improvements.sql

-- Analytics: track hostel page views
ALTER TABLE Hostels ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

-- Trust: show when landlord was last active
ALTER TABLE Users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;

-- Student ping before paying GHS 50
CREATE TABLE IF NOT EXISTS Availability_pings (
  id         SERIAL PRIMARY KEY,
  room_id    INT REFERENCES Rooms(id) ON DELETE CASCADE,
  student_id INT REFERENCES Users(id) ON DELETE SET NULL,
  message    TEXT,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Listing flags (students report bad listings)
CREATE TABLE IF NOT EXISTS Listing_flags (
  id          SERIAL PRIMARY KEY,
  hostel_id   INT REFERENCES Hostels(id) ON DELETE CASCADE,
  reporter_id INT REFERENCES Users(id) ON DELETE SET NULL,
  reason      VARCHAR(300) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Saved searches for email alerts when matching hostel approved
CREATE TABLE IF NOT EXISTS Saved_searches (
  id             SERIAL PRIMARY KEY,
  student_id     INT REFERENCES Users(id) ON DELETE CASCADE,
  label          VARCHAR(200),
  university     VARCHAR(200),
  min_price      NUMERIC(10,2),
  max_price      NUMERIC(10,2),
  gender_policy  VARCHAR(50),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Email queue for reliable delivery with retry
CREATE TABLE IF NOT EXISTS Email_queue (
  id           SERIAL PRIMARY KEY,
  to_email     VARCHAR(200) NOT NULL,
  subject      VARCHAR(500) NOT NULL,
  html         TEXT NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts     INT NOT NULL DEFAULT 0,
  last_attempt TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW()
);
