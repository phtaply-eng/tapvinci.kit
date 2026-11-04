import { createClient } from '@supabase/supabase-js'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(url, anon)
// Optional column on profiles: marks demo/test accounts so admin excludes them from sales stats.
// SQL: alter table profiles add column if not exists is_demo boolean default false;
export type DemoFlag = { is_demo?: boolean }
