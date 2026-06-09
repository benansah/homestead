-- Feature 1: Universities reference table
CREATE TABLE IF NOT EXISTS Universities (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200) NOT NULL UNIQUE,
  location   VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO Universities (name) VALUES
  ('University of Ghana'),
  ('KNUST'),
  ('UCC'),
  ('University of Education'),
  ('Ashesi University')
ON CONFLICT DO NOTHING;

-- Feature 2: Room capacity columns
ALTER TABLE Rooms ADD COLUMN IF NOT EXISTS tour_url TEXT;
ALTER TABLE Rooms ADD COLUMN IF NOT EXISTS max_occupants INT NOT NULL DEFAULT 1;

-- Feature 5: Email marketing opt-in
ALTER TABLE Users ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN NOT NULL DEFAULT TRUE;
