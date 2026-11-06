-- TapVinci plan + payment method metadata for pending orders.
-- Run this once in the Supabase SQL editor before deploying the new payment flow.

alter table public.profiles
  add column if not exists plan_tier text,
  add column if not exists plan_amount numeric(10, 2),
  add column if not exists payment_method text;

-- Keep the new fields limited to the plans/methods the checkout actually supports.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_plan_tier_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_plan_tier_check
      check (plan_tier is null or plan_tier in ('digital', 'card'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_payment_method_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_payment_method_check
      check (payment_method is null or payment_method in ('gcash', 'maya'));
  end if;
end $$;
