-- TapVinci Phase 2 - claim_student_card insert fix
-- Run once in Supabase -> SQL Editor. Safe to re-run.
--
-- The RPC inserts into public.profiles with only:
--   id, owner_id, tier = 'student', username
--
-- The live profiles table has plan_tier but no tier column, so that insert
-- fails. This script adds the missing column + safe defaults and reports any
-- other NOT NULL columns that would still break the claim insert.

-- 1) tier column used by claim_student_card.
alter table public.profiles add column if not exists tier text;
update public.profiles set tier = 'professional' where tier is null;
alter table public.profiles alter column tier set default 'professional';

comment on column public.profiles.tier is
  'student = claimed through claim_student_card; professional = regular account';

-- 2) claim_student_card inserts a row without name; give it a safe default.
alter table public.profiles add column if not exists name text;
alter table public.profiles alter column name set default 'Student';

-- 3) Make the new columns visible to PostgREST immediately.
notify pgrst, 'reload schema';

-- 4) Diagnostics: NOT NULL columns without defaults that are not part of the
--    claim insert. Any row marked ACTION NEEDED will still make the RPC fail.
select
  c.table_name,
  c.column_name,
  c.data_type,
  c.column_default,
  case
    when c.table_name = 'profiles'
      and c.column_name in ('id', 'owner_id', 'tier', 'username', 'name')
      then 'set by claim RPC'
    else 'ACTION NEEDED: add a default or allow NULL'
  end as claim_insert_check
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in ('profiles', 'student_profiles')
  and c.is_nullable = 'NO'
  and c.column_default is null
  and c.is_identity = 'NO'
  and c.is_generated = 'NEVER'
order by c.table_name, c.ordinal_position;

-- 5) Verify the columns the claim RPC depends on.
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('id', 'owner_id', 'username', 'tier', 'name')
order by column_name;
