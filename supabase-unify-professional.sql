-- TapVinci — unify Student + Professional into one Professional experience.
-- Run once in Supabase -> SQL Editor, AFTER supabase-student-role.sql,
-- supabase-profile-visibility.sql and supabase-spotify.sql.
-- Safe to re-run: every statement is idempotent.
--
-- What this does:
--   1. Makes sure every column the unified editor/profile needs exists.
--   2. Backfills education + Spotify data from the legacy student_profiles row.
--   3. Converts every student role to professional.
--   4. Adds the new show_bio / show_about / show_spotify / show_stats flags.
--   5. Installs one generic tap counter used by every public profile.

-- ---------------------------------------------------------------------------
-- 1. Columns used by the unified editor and public profile
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text default 'professional',
  add column if not exists school text,
  add column if not exists course text,
  add column if not exists year_level text,
  add column if not exists spotify_url text,
  add column if not exists taps integer default 0,
  add column if not exists streak integer default 1,
  add column if not exists last_tap_date date,
  add column if not exists show_school boolean not null default true,
  add column if not exists show_year_level boolean not null default true,
  add column if not exists show_course boolean not null default true,
  add column if not exists show_bio boolean not null default true,
  add column if not exists show_about boolean not null default true,
  add column if not exists show_spotify boolean not null default true,
  add column if not exists show_stats boolean not null default true;

-- ---------------------------------------------------------------------------
-- 2. Backfill education / Spotify / counters from the legacy student row
--    (profiles wins when it already has a value)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.student_profiles') is not null then
    execute $backfill$
      update public.profiles p
      set
        school     = coalesce(nullif(btrim(p.school), ''), sp.school),
        course     = coalesce(nullif(btrim(p.course), ''), sp.course),
        year_level = coalesce(nullif(btrim(p.year_level), ''), sp.year_level),
        spotify_url = coalesce(nullif(btrim(p.spotify_url), ''), sp.spotify_url),
        taps   = coalesce(nullif(p.taps, 0), sp.tap_count, 0),
        streak = coalesce(nullif(p.streak, 1), sp.streak_count, 1),
        show_school     = coalesce(p.show_school, sp.show_school, true),
        show_year_level = coalesce(p.show_year_level, sp.show_year_level, true),
        show_course     = coalesce(p.show_course, sp.show_course, true)
      from public.student_profiles sp
      where sp.id = p.id
    $backfill$;
  end if;
exception
  when undefined_column then
    raise notice 'student_profiles has a different shape; skipped legacy backfill.';
end $$;

-- ---------------------------------------------------------------------------
-- 3. Every account is a Professional now
-- ---------------------------------------------------------------------------
update public.profiles
set role = 'professional'
where role is null
   or btrim(role) = ''
   or lower(btrim(role)) not in ('professional', 'admin');

-- Keep the legacy `tier` column in sync when it still exists.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'tier'
  ) then
    execute $tier$
      update public.profiles
      set tier = 'professional'
      where lower(coalesce(tier, '')) = 'student'
    $tier$;
  end if;
end $$;

alter table public.profiles alter column role set default 'professional';
alter table public.profiles alter column taps set default 0;
alter table public.profiles alter column streak set default 1;

comment on column public.profiles.role is
  'Kept for compatibility. Every account is professional; admin is the only exception.';
comment on column public.profiles.taps is
  'Total card taps for this profile. Shown in the unified Stats section.';
comment on column public.profiles.streak is
  'Current daily tap streak. Shown in the unified Stats section.';

-- Replace the old three-role constraint (student/professional/admin).
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role is null or lower(role) in ('professional', 'admin')) not valid;

-- ---------------------------------------------------------------------------
-- 4. One generic tap counter for every public profile
-- ---------------------------------------------------------------------------
create or replace function public.record_profile_tap(p_username text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set
    taps = coalesce(taps, 0) + 1,
    streak = case
      when last_tap_date = current_date then coalesce(streak, 1)
      when last_tap_date = current_date - 1 then coalesce(streak, 1) + 1
      else 1
    end,
    last_tap_date = current_date
  where lower(username) = lower(btrim(p_username));
$$;

revoke all on function public.record_profile_tap(text) from public;
grant execute on function public.record_profile_tap(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Optional: drop the role column entirely. The app no longer reads it.
--    Uncomment only if you do not want to keep the compatibility default.
-- ---------------------------------------------------------------------------
-- alter table public.profiles drop constraint if exists profiles_role_check;
-- alter table public.profiles drop column if exists role;

-- ---------------------------------------------------------------------------
-- 6. Make PostgREST see the changes immediately + verify
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

select role, count(*) as profiles
from public.profiles
group by role
order by role;
