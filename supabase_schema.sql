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
CREATE POLICY "Allow anon insert" ON ride_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON delivery_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON event_quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON partner_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON contact_messages FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read (for admin dashboard)
CREATE POLICY "Allow auth select" ON ride_bookings FOR SELECT USING (true);
CREATE POLICY "Allow auth select" ON delivery_orders FOR SELECT USING (true);
CREATE POLICY "Allow auth select" ON event_quotes FOR SELECT USING (true);
CREATE POLICY "Allow auth select" ON partner_registrations FOR SELECT USING (true);
CREATE POLICY "Allow auth select" ON contact_messages FOR SELECT USING (true);

-- Allow authenticated users to update status
CREATE POLICY "Allow auth update" ON ride_bookings FOR UPDATE USING (true);
CREATE POLICY "Allow auth update" ON delivery_orders FOR UPDATE USING (true);
CREATE POLICY "Allow auth update" ON event_quotes FOR UPDATE USING (true);
CREATE POLICY "Allow auth update" ON partner_registrations FOR UPDATE USING (true);
CREATE POLICY "Allow auth update" ON contact_messages FOR UPDATE USING (true);
