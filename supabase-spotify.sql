-- TapVinci premium Spotify player.
-- Run this once in the Supabase SQL editor, then reload the dashboard.
-- Safe to re-run: the statement is idempotent.

alter table public.profiles
  add column if not exists spotify_url text;

comment on column public.profiles.spotify_url is
  'Spotify track/album/playlist URL shown under the Connect button.';

-- Force PostgREST to pick up the new column immediately.
notify pgrst, 'reload schema';

-- Verify.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'spotify_url';
