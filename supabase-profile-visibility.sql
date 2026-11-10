-- TapVinci — public profile visibility toggles
-- Run once in Supabase -> SQL Editor. Safe to re-run.
--
-- `profiles` is the source of truth for everything the public card renders.
-- The student flags live on `profiles` too (so the dashboard, live preview and
-- public page all read the same row) and are mirrored to the legacy
-- `student_profiles` table for the existing tap RPC / older code paths.
--
-- Existing rows get `true` automatically from the column default.

alter table public.profiles
  add column if not exists show_phone      boolean not null default true,
  add column if not exists show_email      boolean not null default true,
  add column if not exists show_address    boolean not null default true,
  add column if not exists show_school     boolean not null default true,
  add column if not exists show_year_level boolean not null default true,
  add column if not exists show_course     boolean not null default true;

alter table public.student_profiles
  add column if not exists show_school     boolean not null default true,
  add column if not exists show_year_level boolean not null default true,
  add column if not exists show_course     boolean not null default true;

-- Make the new columns visible to PostgREST immediately.
notify pgrst, 'reload schema';

-- Verification: every column below should exist with default = true.
select table_name, column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'profiles' and column_name in
      ('show_phone', 'show_email', 'show_address', 'show_school', 'show_year_level', 'show_course'))
    or
    (table_name = 'student_profiles' and column_name in
      ('show_school', 'show_year_level', 'show_course'))
  )
order by table_name, column_name;
