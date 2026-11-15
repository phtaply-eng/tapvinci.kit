-- TapVinci — track which pre-sale cards were written to a physical NFC chip
-- Run once in Supabase -> SQL Editor. Safe to re-run.
--
-- The admin console's "Pre-Sale Inventory (Unclaimed)" table reads and updates
-- this flag through app/admin/actions.ts (toggleNfcProgrammedAction).
-- Existing cards default to false ("Not Programmed").

alter table public.cards
  add column if not exists is_nfc_programmed boolean not null default false;

-- Make the new column visible to PostgREST immediately.
notify pgrst, 'reload schema';

-- Verification: should return one row with default = false.
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'cards'
  and column_name = 'is_nfc_programmed';
