-- TapVinci admin payment bypass.
-- Run this after supabase-plan-tier.sql (which creates payment_status / paid_at).
-- Safe to re-run: every statement is idempotent.

-- 1. Admin flag used by the dashboard to skip the payment modal.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- These normally already exist; included so the script is safe on older databases.
alter table public.profiles
  add column if not exists is_active boolean default true;

alter table public.profiles
  add column if not exists payment_status text;

alter table public.profiles
  add column if not exists paid_at timestamptz;

-- 2. Mark the creator's own accounts as admin + fully activated.
--    The existing payment_status check constraint only allows
--    pending / paid / failed, so "paid" is used here. See the optional block
--    below if you really want the literal value "verified".
update public.profiles
set
  is_admin = true,
  is_active = true,
  payment_status = 'paid',
  paid_at = coalesce(paid_at, now())
where lower(username) in ('shua', 'shuashushu', 'tapvinci')
   or lower(email) in (
     'shuavmav@gmail.com',
     'hello@tapvinci@gmail.com',
     'hello@tapvinci.com',
     'phtaply@gmail.com'
   );

-- 3. Optional: allow and use the literal "verified" status.
--    The dashboard/admin screens already treat anything that is not
--    pending/failed as paid, so this is cosmetic unless you build for it.
-- alter table public.profiles drop constraint if exists profiles_payment_status_check;
-- alter table public.profiles add constraint profiles_payment_status_check
--   check (payment_status is null or payment_status in ('pending', 'paid', 'failed', 'verified')) not valid;
-- update public.profiles set payment_status = 'verified' where is_admin = true;

-- 4. Fast lookups for the admin flag.
create index if not exists profiles_is_admin_idx
  on public.profiles (is_admin)
  where is_admin;

-- 5. Force PostgREST to pick up the new column immediately.
notify pgrst, 'reload schema';

-- 6. Verify which accounts are now admins.
select username, email, is_admin, is_active, payment_status, paid_at
from public.profiles
where is_admin = true
order by username;
