-- Run this on your existing database to add group booking support

CREATE TABLE IF NOT EXISTS Group_bookings (
  id              SERIAL PRIMARY KEY,
  room_id         INT NOT NULL REFERENCES Rooms(id),
  lead_student_id INT NOT NULL REFERENCES Users(id),
  max_members     INT NOT NULL DEFAULT 2 CHECK (max_members BETWEEN 2 AND 8),
  status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'full', 'cancelled')),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE Bookings ADD COLUMN IF NOT EXISTS group_booking_id INT REFERENCES Group_bookings(id) ON DELETE SET NULL;
