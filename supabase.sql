-- TapVinci - Complete Supabase Setup (run once: SQL Editor > New query > Paste > Run)
-- NOTE: camelCase columns are double-quoted on purpose. Unquoted, Postgres would
-- lowercase them (mapslink, phototfocus...) and the app's upserts would fail.

-- 1. Table
create table if not exists profiles (
  username text primary key,
  name text,
  avatar_url text,
  hero_image text,
  title text,
  bio text,
  about text,
  phone text,
  email text,
  address text,
  socials jsonb default '{}'::jsonb,
  socials_visible jsonb default '{}'::jsonb,
  gallery jsonb default '[]'::jsonb,
  "mapsLink" text,
  "galleryTitle" text,
  "gallerySubtitle" text,
  accent_color text default '#D4AF37',
  theme text default 'gold',
  "photoFocus" text default 'center 30%',
  created_at timestamptz default now()
);

-- 2. Safe upgrades for an older table
alter table profiles add column if not exists socials_visible jsonb default '{}'::jsonb;
alter table profiles add column if not exists gallery jsonb default '[]'::jsonb;
alter table profiles add column if not exists hero_image text;
alter table profiles add column if not exists "mapsLink" text;
alter table profiles add column if not exists "galleryTitle" text;
alter table profiles add column if not exists "gallerySubtitle" text;
alter table profiles add column if not exists accent_color text default '#D4AF37';
alter table profiles add column if not exists theme text default 'gold';
alter table profiles add column if not exists "photoFocus" text default 'center 30%';

-- 3. Row Level Security
alter table profiles enable row level security;

drop policy if exists "Public read" on profiles;
create policy "Public read" on profiles for select using (true);

drop policy if exists "Allow insert/update" on profiles;
create policy "Allow insert/update" on profiles for all using (true) with check (true);

-- 4. Storage bucket (public)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

-- 5. Storage policies
drop policy if exists "Public read images" on storage.objects;
create policy "Public read images" on storage.objects
  for select using (bucket_id = 'images');

drop policy if exists "Allow upload" on storage.objects;
create policy "Allow upload" on storage.objects
  for insert with check (bucket_id = 'images');

drop policy if exists "Allow update/delete" on storage.objects;
create policy "Allow update/delete" on storage.objects
  for all using (bucket_id = 'images') with check (bucket_id = 'images');

-- 6. First profile
insert into profiles (username, name, title, bio, about, phone, email, address, accent_color, theme, hero_image, socials, socials_visible)
values (
  'shua',
  'Shua Vallinas',
  'Web Developer | TapVinci Owner | Tour Coordinator | Culinary Enthusiast',
  'Creating digital experiences for businesses and exploring my passion for cooking. Based in Quezon City, Philippines.',
  'Hi, I''m Shua, the founder of TapVinci, a digital business card service that helps professionals share their contact details through NFC cards and personalized profile pages. 
  
  Outside of web development, I work in tour coordination, managing the details that help trips run smoothly.',
  '+63 908 327 4971',
  'shuarmaj@gmail.com',
  'Quezon City, Philippines',
  '#D4AF37',
  'gold',
  'demoprofile.jpg',
  '{"facebook":"https://facebook.com/shua.vallinas","instagram":"https://instagram.com/shuashushu","tiktok":"https://www.tiktok.com/@shuashushu5","messenger":"https://m.me/shua.vallinas"}'::jsonb,
  '{"facebook":true,"instagram":true,"tiktok":true,"messenger":true,"linkedin":true,"youtube":true,"whatsapp":true,"website":true,"google_maps":true}'::jsonb
)
on conflict (username) do nothing;

-- 7. Verify
select username, theme, accent_color, socials_visible from profiles;

-- 8. Reviews table for TapVinci review system - APPENDED - DO NOT DELETE ABOVE
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >=1 AND rating <=5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved BOOLEAN DEFAULT TRUE
);

-- RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reviews" ON reviews;
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (approved = true);

DROP POLICY IF EXISTS "Allow insert reviews" ON reviews;
CREATE POLICY "Allow insert reviews" ON reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete reviews" ON reviews;
CREATE POLICY "Allow delete reviews" ON reviews FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow update reviews" ON reviews;
CREATE POLICY "Allow update reviews" ON reviews FOR UPDATE USING (true) WITH CHECK (true);
