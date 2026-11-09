-- TapVinci student/professional split.
-- Run once in Supabase -> SQL Editor. Safe to re-run: every statement is idempotent.
--
-- Adds the new role + student fields directly to public.profiles so the
-- student edit form and the public student profile can read a single row.
-- The legacy public.student_profiles table is kept in sync for the existing
-- record_student_tap RPC.

-- 1. New columns on profiles.
alter table public.profiles
  add column if not exists role text,
  add column if not exists school text,
  add column if not exists course text,
  add column if not exists year_level text,
  add column if not exists taps integer,
  add column if not exists streak integer;

-- 2. Backfill role from the legacy tier column (when it exists).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'tier'
  ) then
    execute $backfill$
      update public.profiles
      set role = case
        when lower(coalesce(tier, '')) = 'student' then 'student'
        else 'professional'
      end
      where role is null or btrim(role) = ''
    $backfill$;
  else
    update public.profiles
    set role = 'professional'
    where role is null or btrim(role) = '';
  end if;
end $$;

-- 3. Sensible defaults for the new counters.
update public.profiles set taps = 0 where taps is null;
update public.profiles set streak = 1 where streak is null or streak < 1;

alter table public.profiles alter column role set default 'professional';
alter table public.profiles alter column taps set default 0;
alter table public.profiles alter column streak set default 1;

comment on column public.profiles.role is
  'student = student card layout; professional = full business dashboard.';
comment on column public.profiles.taps is
  'Total student card taps. Mirrors legacy student_profiles.tap_count.';
comment on column public.profiles.streak is
  'Current student tap streak in days. Mirrors legacy student_profiles.streak_count.';

-- 4. Keep values inside the supported set without breaking legacy rows.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role is null or role in ('student', 'professional', 'admin')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_taps_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_taps_check
      check (taps is null or taps >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_streak_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_streak_check
      check (streak is null or streak >= 1) not valid;
  end if;
end $$;

-- 5. Copy existing student_profiles data into the new profiles columns.
--    Only fills gaps, so re-running never overwrites newer profile values.
do $$
begin
  if to_regclass('public.student_profiles') is not null then
    execute $migrate$
      update public.profiles p
      set
        school = coalesce(p.school, sp.school),
        course = coalesce(p.course, sp.course),
        year_level = coalesce(p.year_level, sp.year_level),
        spotify_url = coalesce(p.spotify_url, sp.spotify_url),
        taps = coalesce(nullif(p.taps, 0), sp.tap_count, 0),
        streak = coalesce(nullif(p.streak, 1), sp.streak_count, 1)
      from public.student_profiles sp
      where sp.id = p.id
        and p.role = 'student'
    $migrate$;
  end if;
exception
  when undefined_column then
    raise notice 'student_profiles has a different shape; skipped legacy backfill.';
end $$;

-- 6. Keep profiles.taps/streak updated when the existing tap RPC writes to
--    student_profiles. This is what makes the new columns stay accurate.
do $$
begin
  if to_regclass('public.student_profiles') is not null then
    execute $fn$
      create or replace function public.sync_student_counts_to_profile()
      returns trigger
      language plpgsql
      as $body$
      begin
        update public.profiles
        set
          taps = coalesce(new.tap_count, taps),
          streak = coalesce(new.streak_count, streak)
        where id = new.id;
        return new;
      end;
      $body$;
    $fn$;

    execute 'drop trigger if exists sync_student_counts on public.student_profiles';
    execute 'create trigger sync_student_counts
             after insert or update of tap_count, streak_count
             on public.student_profiles
             for each row execute function public.sync_student_counts_to_profile()';
  end if;
exception
  when undefined_column then
    raise notice 'student_profiles has a different shape; skipped count sync trigger.';
end $$;

-- 7. Make PostgREST see the new columns immediately.
notify pgrst, 'reload schema';

-- 8. Verify.
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('role', 'school', 'course', 'year_level', 'taps', 'streak')
order by column_name;
