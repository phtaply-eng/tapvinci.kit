-- TapVinci checkout/payment columns for pending orders.
-- Run this once in the Supabase SQL editor, then reload the dashboard.
-- Safe to re-run: every statement is idempotent.

-- 1. Columns written by PaymentModal / the admin orders screen.
alter table public.profiles
  add column if not exists plan_tier text,
  add column if not exists plan_amount numeric(10, 2),
  add column if not exists payment_method text,
  add column if not exists receipt_url text,
  add column if not exists package text,
  add column if not exists paid_at timestamptz,
  add column if not exists fulfillment text default 'pending',
  add column if not exists fulfilled_at timestamptz,
  add column if not exists deactivated_at timestamptz,
  add column if not exists is_active boolean default true,
  add column if not exists is_demo boolean default false,
  add column if not exists gcash_qr_url text,
  add column if not exists maya_qr_url text,
  add column if not exists gcash_name text,
  add column if not exists gcash_number text,
  add column if not exists maya_name text,
  add column if not exists maya_number text;

-- payment_status is added in two steps so pre-existing profiles are NOT
-- retroactively marked as "pending" (the admin treats missing as paid).
alter table public.profiles add column if not exists payment_status text;
alter table public.profiles alter column payment_status set default 'pending';

-- 2. The upsert uses onConflict: 'username', so username must be unique.
-- profiles.username is the primary key in the starter schema; this covers
-- databases where it is not.
do $$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_attribute a
      on a.attrelid = i.indrelid
     and a.attnum = any (i.indkey)
    where i.indrelid = 'public.profiles'::regclass
      and i.indisunique
      and a.attname = 'username'
  ) then
    create unique index profiles_username_key on public.profiles (username);
  end if;
end $$;

-- 3. Keep the payment fields limited to supported values.
--    NOT VALID skips legacy rows but still enforces the rule on new inserts.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_plan_tier_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_plan_tier_check
      check (plan_tier is null or plan_tier in ('digital', 'card')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_payment_method_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_payment_method_check
      check (payment_method is null or payment_method in ('gcash', 'maya')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_payment_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_payment_status_check
      check (payment_status is null or payment_status in ('pending', 'paid', 'failed')) not valid;
  end if;
end $$;

-- 4. Checkout inserts brand-new profiles from the public dashboard. Match the
--    open policies from the starter schema so the insert/update is allowed.
alter table public.profiles enable row level security;

drop policy if exists "Public read" on public.profiles;
create policy "Public read" on public.profiles for select using (true);

drop policy if exists "Allow insert/update" on public.profiles;
create policy "Allow insert/update" on public.profiles for all using (true) with check (true);

-- 5. Force PostgREST to pick up the new columns immediately.
notify pgrst, 'reload schema';

-- 6. Verify.
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in (
    'plan_tier', 'plan_amount', 'payment_method', 'payment_status',
    'receipt_url', 'package', 'is_active', 'is_demo'
  )
order by column_name;
