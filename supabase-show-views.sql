-- Public visibility toggle for the footer view counter.
-- Run in the Supabase SQL editor once; safe to re-run.

alter table public.profiles
  add column if not exists show_views boolean not null default true;

-- Existing rows get the default (visible). To hide a specific profile:
-- update public.profiles set show_views = false where username = 'shuarmav';
