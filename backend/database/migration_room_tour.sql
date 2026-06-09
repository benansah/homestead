-- Add 360° tour image URL to Rooms table
ALTER TABLE Rooms ADD COLUMN IF NOT EXISTS tour_url TEXT;
