-- GaonRide Database Tables
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/xlimxbfxgncfjlawhozl/sql/new

CREATE TABLE IF NOT EXISTS ride_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pickup TEXT NOT NULL,
  drop_location TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_date TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  sender_name TEXT,
  pickup_address TEXT,
  delivery_address TEXT NOT NULL,
  parcel_type TEXT,
  grocery_list TEXT,
  preferred_time TEXT,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT,
  expected_guests TEXT,
  services TEXT[],
  special_requests TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  village TEXT NOT NULL,
  district TEXT NOT NULL,
  vehicle_types TEXT[],
  aadhaar TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ride_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for public forms)
DROP POLICY IF EXISTS "Allow anon insert" ON ride_bookings;
DROP POLICY IF EXISTS "Allow anon insert" ON delivery_orders;
DROP POLICY IF EXISTS "Allow anon insert" ON event_quotes;
DROP POLICY IF EXISTS "Allow anon insert" ON partner_registrations;
DROP POLICY IF EXISTS "Allow anon insert" ON contact_messages;
CREATE POLICY "Allow anon insert" ON ride_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON delivery_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON event_quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON partner_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON contact_messages FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read (for admin dashboard)
DROP POLICY IF EXISTS "Allow auth select" ON ride_bookings;
DROP POLICY IF EXISTS "Allow auth select" ON delivery_orders;
DROP POLICY IF EXISTS "Allow auth select" ON event_quotes;
DROP POLICY IF EXISTS "Allow auth select" ON partner_registrations;
DROP POLICY IF EXISTS "Allow auth select" ON contact_messages;
CREATE POLICY "Allow auth select" ON ride_bookings FOR SELECT USING (true);
CREATE POLICY "Allow auth select" ON delivery_orders FOR SELECT USING (true);
CREATE POLICY "Allow auth select" ON event_quotes FOR SELECT USING (true);
CREATE POLICY "Allow auth select" ON partner_registrations FOR SELECT USING (true);
CREATE POLICY "Allow auth select" ON contact_messages FOR SELECT USING (true);

-- Allow authenticated users to update status
DROP POLICY IF EXISTS "Allow auth update" ON ride_bookings;
DROP POLICY IF EXISTS "Allow auth update" ON delivery_orders;
DROP POLICY IF EXISTS "Allow auth update" ON event_quotes;
DROP POLICY IF EXISTS "Allow auth update" ON partner_registrations;
DROP POLICY IF EXISTS "Allow auth update" ON contact_messages;
CREATE POLICY "Allow auth update" ON ride_bookings FOR UPDATE USING (true);
CREATE POLICY "Allow auth update" ON delivery_orders FOR UPDATE USING (true);
CREATE POLICY "Allow auth update" ON event_quotes FOR UPDATE USING (true);
CREATE POLICY "Allow auth update" ON partner_registrations FOR UPDATE USING (true);
CREATE POLICY "Allow auth update" ON contact_messages FOR UPDATE USING (true);

-- Allow authenticated users to delete (for admin dashboard)
DROP POLICY IF EXISTS "Allow auth delete" ON ride_bookings;
DROP POLICY IF EXISTS "Allow auth delete" ON delivery_orders;
DROP POLICY IF EXISTS "Allow auth delete" ON event_quotes;
DROP POLICY IF EXISTS "Allow auth delete" ON partner_registrations;
DROP POLICY IF EXISTS "Allow auth delete" ON contact_messages;
CREATE POLICY "Allow auth delete" ON ride_bookings FOR DELETE USING (true);
CREATE POLICY "Allow auth delete" ON delivery_orders FOR DELETE USING (true);
CREATE POLICY "Allow auth delete" ON event_quotes FOR DELETE USING (true);
CREATE POLICY "Allow auth delete" ON partner_registrations FOR DELETE USING (true);
CREATE POLICY "Allow auth delete" ON contact_messages FOR DELETE USING (true);

-- =========================================================
-- PARTNER MATCHING + LIVE LOCATION (NEW)
-- =========================================================
ALTER TABLE partner_registrations
  ADD COLUMN IF NOT EXISTS partner_roles TEXT[] DEFAULT ARRAY['driver']::TEXT[],
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS available_after TIMESTAMPTZ DEFAULT now();

ALTER TABLE ride_bookings
  ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS user_live_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS user_live_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS user_live_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_partner_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_partner_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_partner_phone TEXT,
  ADD COLUMN IF NOT EXISTS assigned_distance_km DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

ALTER TABLE delivery_orders
  ADD COLUMN IF NOT EXISTS request_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS request_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS user_live_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS user_live_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS user_live_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_date TEXT,
  ADD COLUMN IF NOT EXISTS assigned_partner_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_partner_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_partner_phone TEXT,
  ADD COLUMN IF NOT EXISTS assigned_distance_km DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

ALTER TABLE event_quotes
  ADD COLUMN IF NOT EXISTS venue_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS venue_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS user_live_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS user_live_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS user_live_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_partner_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_partner_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_partner_phone TEXT,
  ADD COLUMN IF NOT EXISTS assigned_distance_km DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS partner_live_locations (
  partner_id UUID PRIMARY KEY REFERENCES partner_registrations(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE partner_live_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon upsert partner location" ON partner_live_locations;
DROP POLICY IF EXISTS "Allow anon update partner location" ON partner_live_locations;
DROP POLICY IF EXISTS "Allow auth select partner location" ON partner_live_locations;
CREATE POLICY "Allow anon upsert partner location" ON partner_live_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update partner location" ON partner_live_locations FOR UPDATE USING (true);
CREATE POLICY "Allow auth select partner location" ON partner_live_locations FOR SELECT USING (true);
