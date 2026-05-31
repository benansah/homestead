CREATE TABLE Users (
  id            SERIAL PRIMARY KEY,
  fullname      VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  phone         VARCHAR(20)  NOT NULL UNIQUE,
  university    VARCHAR(200),
  role          VARCHAR(20)  NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student', 'landlord', 'admin')),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE Hostels (
  id              SERIAL PRIMARY KEY,
  landlord_id     INT          NOT NULL REFERENCES Users(id),
  hostel_name     VARCHAR(100) NOT NULL,
  hostel_address  VARCHAR(200) NOT NULL,
  university      VARCHAR(200) NOT NULL,
  description     TEXT,
  latitude        FLOAT        NOT NULL,
  longitude       FLOAT        NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
  track           VARCHAR(5)   NOT NULL
                    CHECK (track IN ('A', 'B')),
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE Rooms (
  id             SERIAL PRIMARY KEY,
  hostel_id      INT          NOT NULL REFERENCES Hostels(id),
  room_type      VARCHAR(50)  NOT NULL,
  price          NUMERIC(10,2) NOT NULL,
  gender_policy  VARCHAR(10)  NOT NULL
                   CHECK (gender_policy IN ('Male', 'Female', 'Both')),
  quantity       INT          NOT NULL DEFAULT 1,
  is_available   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE Room_images (
  id          SERIAL PRIMARY KEY,
  room_id     INT  NOT NULL REFERENCES Rooms(id),
  image_url   TEXT NOT NULL,
  uploaded_by INT  NOT NULL REFERENCES Users(id)
);

CREATE TABLE Bookings (
  id              SERIAL PRIMARY KEY,
  student_id      INT          NOT NULL REFERENCES Users(id),
  room_id         INT          NOT NULL REFERENCES Rooms(id),
  booking_type    VARCHAR(20)  NOT NULL
                    CHECK (booking_type IN ('Viewing', 'Reservation')),
  booking_status  VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (booking_status IN ('pending', 'confirmed', 'contact_released',
                                              'cancelled', 'completed', 'no_show')),
  payment_ref     VARCHAR(100),
  viewing_fee     NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  booked_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE Reviews (
  id          SERIAL PRIMARY KEY,
  student_id  INT     NOT NULL REFERENCES Users(id),
  hostel_id   INT     NOT NULL REFERENCES Hostels(id),
  rating      NUMERIC(2,1) NOT NULL
                CHECK (rating >= 1.0 AND rating <= 5.0),
  comment     TEXT,
  image_url   TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE Wishlists (
  id          SERIAL PRIMARY KEY,
  student_id  INT       NOT NULL REFERENCES Users(id),
  hostel_id   INT       NOT NULL REFERENCES Hostels(id),
  saved_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, hostel_id)
);

CREATE TABLE Availability (
  id                SERIAL PRIMARY KEY,
  room_id           INT       NOT NULL REFERENCES Rooms(id),
  is_available      BOOLEAN   NOT NULL DEFAULT TRUE,
  last_confirmed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE Referrals (
  id             SERIAL PRIMARY KEY,
  referrer_id    INT          NOT NULL REFERENCES Users(id),
  referee_id     INT          NOT NULL REFERENCES Users(id),
  code           VARCHAR(20)  NOT NULL UNIQUE,
  status         VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount  NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE Notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INT       NOT NULL REFERENCES Users(id),
  not_message TEXT      NOT NULL,
  not_type    VARCHAR(50) NOT NULL
                CHECK (not_type IN ('booking', 'availability', 'payment',
                                    'review', 'referral', 'system', 'roommate')),
  is_read     BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE Roommate_profiles (
  id                 SERIAL PRIMARY KEY,
  user_id            INT          NOT NULL UNIQUE REFERENCES Users(id) ON DELETE CASCADE,
  gender             VARCHAR(10)  NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  sleep_schedule     VARCHAR(20)  NOT NULL CHECK (sleep_schedule IN ('early_bird', 'night_owl', 'flexible')),
  study_habits       VARCHAR(20)  NOT NULL CHECK (study_habits IN ('quiet', 'noise_ok', 'flexible')),
  cleanliness        VARCHAR(20)  NOT NULL CHECK (cleanliness IN ('very_tidy', 'moderate', 'relaxed')),
  guests             VARCHAR(20)  NOT NULL CHECK (guests IN ('frequent', 'occasional', 'never')),
  gender_preference  VARCHAR(10)  NOT NULL CHECK (gender_preference IN ('same', 'any')),
  bio                TEXT,
  is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE Group_bookings (
  id              SERIAL PRIMARY KEY,
  room_id         INT NOT NULL REFERENCES Rooms(id),
  lead_student_id INT NOT NULL REFERENCES Users(id),
  max_members     INT NOT NULL DEFAULT 2 CHECK (max_members BETWEEN 2 AND 8),
  status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'full', 'cancelled')),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Alter Bookings to link group members
ALTER TABLE Bookings ADD COLUMN IF NOT EXISTS group_booking_id INT REFERENCES Group_bookings(id) ON DELETE SET NULL;

CREATE TABLE Roommate_requests (
  id           SERIAL PRIMARY KEY,
  sender_id    INT          NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  receiver_id  INT          NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
  hostel_id    INT          REFERENCES Hostels(id) ON DELETE SET NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (sender_id, receiver_id)
);