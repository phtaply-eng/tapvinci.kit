# TapVinci — Black Gold NFC Starter Kit

Premium NFC digital business cards — black #050505 for every theme, gold #D4AF37 default.

## Setup (2 min)

1. **Supabase**
   - Create project at supabase.com
   - SQL Editor → New query → Paste `supabase.sql` → Run
   - This creates `profiles` table + `images` bucket + open RLS policies + first profile `shua`

2. **Env**
   ```
   cp .env.example .env.local
   ```
   Add your 2 values from Supabase → Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (use **Publishable** key starting `sb_publishable_...`, NOT Project ID)

3. **Run**
   ```
   npm install
   npm run dev
   ```
   - Dashboard: http://localhost:3000/dashboard
   - Profile: http://localhost:3000/shua
   - Phone test: `npm run dev -- -H 0.0.0.0 -p 3000` then http://192.168.1.3:3000/shua

## Features (Claude fixes included)

- **Black #050505 for ALL themes** — only accent changes (Gold, Purple, Blue, Green, Rose, Orange)
- **/ [username] route** — lowercases username, 404 if no match, `force-dynamic` so edits show instantly (stale fix)
- **Dashboard** — drag & drop hero + gallery upload to Supabase Storage `images` bucket, eye Hide/Show for every social + Google Maps, theme packs, sticky live preview
- **Quick Actions** — Row1: Call/Text/Email (3 cols), Row2: Google Maps / Save Contact / Share My Card **one line scrollable sideways** on mobile
- **Google Maps button** — white with 4-color border (Google branding)
- **Gallery** — 94% width, 1:1 square, tap to zoom lightbox with pinch zoom, double-tap, swipe, wheel, +/- keys, arrow keys
- **Light/Dark toggle** — sun/moon top-right, saves to localStorage
- **Responsive** — 380px, 381-640, 641-768, 769-1024, 1025-1440, 1441px+
- **vCard** — Save Contact includes title + address + card URL
- **SQL safety** — `mapsLink`, `galleryTitle`, `gallerySubtitle`, `photoFocus` are double-quoted so Postgres keeps camelCase
- **VS Code warnings** — `.vscode/settings.json` + `css_custom_data.json` removes @tailwind unknown at-rule warnings

## Deploy

```
npm run build
npx vercel
```

## Security Warning

RLS is open public for insert/update and `/dashboard` has no login (as specified). Anyone with the dashboard URL can edit. Add Supabase Auth and tighten policies before giving cards to paying clients.

## Delete cache

`rd /s /q .next` (CMD) or `Remove-Item -Recurse -Force .next` (Powershell) — safe to delete, Next recreates it.

Do NOT zip `node_modules` or `.next` — select only app, components, lib, .vscode, .env.example, package.json, configs, README, supabase.sql → Zip will be ~20KB not 200MB.
