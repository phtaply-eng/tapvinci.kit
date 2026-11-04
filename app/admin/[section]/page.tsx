'use client'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

// One page for every secondary admin section: /admin/cards, /review-stands, /demos, /feedbacks, /analytics, /cms, /pricing, /account.
// (Overview lives in app/admin/overview/page.tsx, Orders & Business Profiles in app/admin/page.tsx.)
// Everything here is read from your existing Supabase tables; nothing is invented. Sections that need data you do not collect yet say so.

const AUTH_KEY = 'tapvinci_admin_ok'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tapvinci.vercel.app').replace(/\/+$/, '')
const DEMO = (process.env.NEXT_PUBLIC_DEMO_USERNAME || 'shua').toLowerCase()
const PKG = { card: { label: 'Card + Digital', price: 799 }, digital: { label: 'Digital Only', price: 299 } } as const
const THEMES: Record<string, string> = { gold: 'Black Gold', purple: 'Midnight Purple', blue: 'Ocean Blue', green: 'Forest Green', pink: 'Sunset Pink', orange: 'Sunrise Orange' }

type Row = { username: string; name?: string | null; business?: string | null; email?: string | null; phone?: string | null; created_at?: string | null; is_active?: boolean | null; gcash_qr_url?: string | null; maya_qr_url?: string | null; theme?: any; [k: string]: any }
type Review = { id: string; name: string; rating: number; comment: string; created_at?: string | null; approved?: boolean | null }
type SP = { profiles: Row[]; reviews: Review[]; loading: boolean; reload: () => void; toast: (m: string) => void }

const nameOf = (p: Row) => (p.name || p.business || p.username).toString()
const pkgOf = (p: Row) => (p.package === 'digital' ? 'digital' : 'card') as keyof typeof PKG
const payOf = (p: Row) => (p.payment_status === 'pending' || p.payment_status === 'failed' ? (p.payment_status as string) : 'paid')
const themeOf = (p: Row) => { const id = ((typeof p.theme === 'object' && p.theme ? p.theme.pack : p.theme) || 'gold').toString(); return THEMES[id] || id }
const money = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dateOf = (v?: string | null) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null }
const dateText = (v?: string | null) => { const d = dateOf(v); return d ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-' }
const qrSrc = (url: string, size: number) => `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${size > 300 ? 10 : 0}&format=png&data=${encodeURIComponent(url)}`
const esc = (v: unknown) => (v ?? '').toString().replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

async function downloadQr(url: string, filename: string, toast: (m: string) => void) {
  try {
    const res = await fetch(qrSrc(url, 800))
    if (!res.ok) throw new Error('QR request failed')
    const href = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = href; a.download = filename
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(href)
    toast('QR downloaded')
  } catch {
    window.open(qrSrc(url, 800), '_blank', 'noopener') // fallback: right-click to save
    toast('Opened QR in a new tab - right-click to save')
  }
}
function printStand(title: string, sub: string, url: string) {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;text-align:center;margin:0;padding:48px 24px;color:#111}
h1{font-size:30px;margin:0 0 6px}p{color:#555;margin:6px 0}img{width:340px;height:340px;margin:28px auto 10px;display:block}.g{color:#9a7b1e}small{color:#888}</style></head>
<body><h1>${esc(title)}</h1><p>${esc(sub)}</p><img src="${qrSrc(url, 600)}" alt="QR code"><small>${esc(url)}</small><p class="g"><b>Tap</b>Vinci &bull; Philippines</p></body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 700)
  return true
}
const copy = (text: string, toast: SP['toast']) => navigator.clipboard.writeText(text).then(() => toast('Copied!'), () => toast('Copy failed'))

function Card({ title, sub, children, right }: { title: string; sub?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="bg-[#121214] border border-[#1E1E1E] rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div><h2 className="ac-title text-lg font-bold">{title}</h2>{sub && <p className="text-[11px] text-[#A1A1A1] mt-0.5">{sub}</p>}</div>
        {right}
      </div>
      {children}
    </section>
  )
}
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="ac-stat">
      <p className="text-[10px] uppercase tracking-[1.5px] text-[#A1A1A1] font-bold">{label}</p>
      <p className="ac-title text-[28px] font-bold text-white mt-2 leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[#A1A1A1] mt-2">{sub}</p>}
    </div>
  )
}
const Grid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{children}</div>
const Empty = ({ children }: { children: ReactNode }) => <p className="rounded-xl border border-dashed border-[#2A2A2A] p-6 text-center text-sm text-[#A1A1A1]">{children}</p>
const Note = ({ children }: { children: ReactNode }) => <p className="rounded-xl bg-[#0A0A0A] border border-[#D4AF37]/25 px-4 py-3 text-[12px] text-[#A1A1A1] mb-6"><i className="fa-solid fa-circle-info text-[#D4AF37] mr-2" aria-hidden="true" />{children}</p>
const Bar = ({ pct }: { pct: number }) => <div className="h-2 rounded-full bg-[#1E1E20] overflow-hidden"><div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>
const active = (profiles: Row[]) => profiles.filter((p) => p.is_active !== false)

// ---------------- NFC Cards & URLs ----------------
function CardsSection({ profiles, loading, toast }: SP) {
  const [q, setQ] = useState('')
  const rows = useMemo(() => active(profiles).filter((p) => [p.username, nameOf(p)].some((v) => v.toLowerCase().includes(q.trim().toLowerCase()))), [profiles, q])
  const cards = active(profiles).filter((p) => pkgOf(p) === 'card').length
  return (
    <>
      <Grid>
        <Stat label="Live URLs" value={String(active(profiles).length)} sub="Active client profiles" />
        <Stat label="NFC Cards" value={String(cards)} sub="Card + Digital orders" />
        <Stat label="Digital Only" value={String(active(profiles).length - cards)} sub="No card to write" />
        <Stat label="Payment QR Ready" value={String(active(profiles).filter((p) => p.gcash_qr_url || p.maya_qr_url).length)} sub="GCash / Maya uploaded" />
      </Grid>
      <Note>To program a card: open any NFC writer app (for example NFC Tools), choose Write → URL, paste the link below, and hold the card to the phone. The QR is the same link, for the back of the card.</Note>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username or name..." aria-label="Search URLs" className="w-full max-w-md h-11 bg-[#121214] border border-[#1E1E1E] focus:border-[#D4AF37] outline-none rounded-xl px-4 text-sm mb-4" />
      <div className="bg-[#121214] border border-[#1E1E1E] rounded-2xl overflow-hidden"><div className="overflow-x-auto">
        <table className="admin-table ac-orders">
          <thead><tr><th>Client</th><th>NFC URL</th><th>Package</th><th>QR</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center text-gray-500 !py-8">Loading...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={5} className="text-center text-gray-500 !py-8">No URLs match.</td></tr>
              : rows.map((p) => {
                const url = `${SITE_URL}/${p.username}`
                return (
                  <tr key={p.username} className="ac-row">
                    <td><p className="font-bold">{nameOf(p)}</p><p className="text-[11px] text-[#A1A1A1]">{p.email || '-'}</p></td>
                    <td><Link href={`/${p.username}`} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] font-semibold hover:underline">/{p.username}</Link><p className="text-[10px] text-[#6B7280] break-all max-w-[240px]">{url}</p></td>
                    <td className="text-[12px] whitespace-nowrap">{PKG[pkgOf(p)].label}</td>
                    <td><img src={qrSrc(url, 96)} alt={`QR for ${p.username}`} width={48} height={48} className="rounded bg-white p-0.5" /></td>
                    <td><div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => copy(url, toast)} title="Copy URL" aria-label="Copy URL" className="ac-icon"><i className="fa-regular fa-copy" /></button>
                      <button onClick={() => window.open(url, '_blank', 'noopener')} title="Open" aria-label="Open" className="ac-icon ac-icon-open"><i className="fa-solid fa-arrow-up-right-from-square" /></button>
                      <button onClick={() => downloadQr(url, `${p.username}-tapvinci-qr.png`, toast)} title="Download QR" aria-label="Download QR" className="ac-icon ac-icon-gold"><i className="fa-solid fa-download" /></button>
                    </div></td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div></div>
    </>
  )
}

// ---------------- Review Stands & QRs ----------------
function ReviewStandsSection({ toast }: SP) {
  const [url, setUrl] = useState(`${SITE_URL}/reviews`)
  const [title, setTitle] = useState('Loved your TapVinci card?')
  const ok = /^https?:\/\//i.test(url.trim())
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Review stand QR" sub="Customers scan this and land on the page you choose">
        <label className="block text-[10px] uppercase tracking-[1.5px] text-[#A1A1A1] font-bold">Link the QR opens
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full mt-1 h-11 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#D4AF37] outline-none rounded-xl px-3 text-sm normal-case tracking-normal text-white" />
        </label>
        <p className="text-[11px] text-[#6B7280] mt-1 mb-4">Default is your TapVinci reviews page. Paste a Google review link here to send people there instead.</p>
        <label className="block text-[10px] uppercase tracking-[1.5px] text-[#A1A1A1] font-bold">Stand headline
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className="w-full mt-1 h-11 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#D4AF37] outline-none rounded-xl px-3 text-sm normal-case tracking-normal text-white" />
        </label>
        <div className="grid grid-cols-3 gap-2 mt-5">
          <button disabled={!ok} onClick={() => copy(url.trim(), toast)} className="ac-mini !h-10 disabled:opacity-40">Copy link</button>
          <button disabled={!ok} onClick={() => downloadQr(url.trim(), 'tapvinci-review-qr.png', toast)} className="ac-mini ac-mini-gold !h-10 disabled:opacity-40">Download QR</button>
          <button disabled={!ok} onClick={() => { if (!printStand(title || 'Leave a review', 'Scan to leave a quick review', url.trim())) toast('Allow pop-ups to print') }} className="ac-mini ac-mini-gold !h-10 disabled:opacity-40">Print stand</button>
        </div>
        {!ok && <p className="text-[11px] text-red-300 mt-2">Enter a full link starting with https://</p>}
      </Card>
      <Card title="Preview" sub="What the printed stand shows">
        <div className="mx-auto max-w-[300px] rounded-2xl bg-white text-black p-6 text-center">
          <p className="font-bold text-lg leading-tight">{title || 'Leave a review'}</p>
          <p className="text-[12px] text-neutral-500 mt-1">Scan to leave a quick review</p>
          {ok ? <img src={qrSrc(url.trim(), 480)} alt="Review QR code" width={220} height={220} className="mx-auto mt-4" /> : <div className="h-[220px] flex items-center justify-center text-sm text-neutral-400">Enter a link</div>}
          <p className="text-[11px] mt-3 text-[#9a7b1e]"><b>Tap</b>Vinci • Philippines</p>
        </div>
      </Card>
    </div>
  )
}

// ---------------- Live Test Demos ----------------
function DemosSection({ profiles, loading, toast }: SP) {
  const demo = profiles.find((p) => p.username === DEMO)
  const list = active(profiles)
  return (
    <>
      <Note>Scan a QR with your phone (or tap a card) to test exactly what a client's customer sees. The public demo is the profile set in NEXT_PUBLIC_DEMO_USERNAME (now: <b className="text-white">{DEMO}</b>).</Note>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Public demo" sub="Opened by View Demo on the homepage">
          {demo ? (
            <div className="text-center">
              <img src={qrSrc(`${SITE_URL}/${demo.username}`, 360)} alt="Demo QR" width={160} height={160} className="mx-auto rounded-xl bg-white p-1.5" />
              <p className="font-bold mt-3">{nameOf(demo)}</p>
              <p className="text-[11px] text-[#6B7280] break-all">{SITE_URL}/{demo.username}</p>
              <div className="flex gap-2 justify-center mt-3">
                <a href={`/${demo.username}`} target="_blank" rel="noopener noreferrer" className="ac-mini ac-mini-gold !inline-flex items-center">Open demo →</a>
                <button onClick={() => copy(`${SITE_URL}/${demo.username}`, toast)} className="ac-mini">Copy</button>
              </div>
            </div>
          ) : <Empty>{loading ? 'Loading...' : `No profile named "${DEMO}" yet. Create it in the dashboard, or change NEXT_PUBLIC_DEMO_USERNAME.`}</Empty>}
        </Card>
        <div className="lg:col-span-2"><Card title="Test any client profile" sub={`${list.length} live profiles`}>
          {list.length === 0 ? <Empty>No profiles yet.</Empty> : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {list.map((p) => (
                <li key={p.username} className="flex items-center gap-3 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] p-2.5">
                  <img src={qrSrc(`${SITE_URL}/${p.username}`, 120)} alt="" width={44} height={44} className="rounded bg-white p-0.5 shrink-0" />
                  <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold truncate">{nameOf(p)}</p><p className="text-[11px] text-[#A1A1A1] truncate">/{p.username} • {themeOf(p)}</p></div>
                  <a href={`/${p.username}`} target="_blank" rel="noopener noreferrer" className="ac-icon ac-icon-open shrink-0" aria-label={`Open ${p.username}`}><i className="fa-solid fa-arrow-up-right-from-square" /></a>
                </li>
              ))}
            </ul>
          )}
        </Card></div>
      </div>
    </>
  )
}

// ---------------- User Feedbacks ----------------
function FeedbacksSection({ reviews, loading, reload, toast }: SP) {
  const [q, setQ] = useState('')
  const [star, setStar] = useState(0)
  const avg = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0
  const rows = useMemo(() => reviews.filter((r) => (!star || r.rating === star) && [r.name, r.comment].some((v) => (v || '').toLowerCase().includes(q.trim().toLowerCase()))), [reviews, q, star])
  const del = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) return toast('Delete failed: ' + error.message)
    toast('Review deleted'); reload()
  }
  const hide = async (r: Review) => {
    const { data, error } = await supabase.from('reviews').update({ approved: r.approved === false }).eq('id', r.id).select()
    if (error) return toast('Failed: ' + error.message)
    if (!data || data.length === 0) return toast('Nothing was updated - check the Supabase update policy')
    toast(r.approved === false ? 'Review is public again' : 'Review hidden from the public page'); reload()
  }
  return (
    <>
      <Grid>
        <Stat label="Total Reviews" value={String(reviews.length)} />
        <Stat label="Average Rating" value={reviews.length ? `${avg} ★` : '-'} />
        <Stat label="Five Stars" value={String(reviews.filter((r) => r.rating === 5).length)} />
        <Stat label="Hidden" value={String(reviews.filter((r) => r.approved === false).length)} sub="Not shown on /reviews" />
      </Grid>
      <div className="flex flex-wrap gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or comment..." aria-label="Search reviews" className="flex-1 min-w-[220px] h-11 bg-[#121214] border border-[#1E1E1E] focus:border-[#D4AF37] outline-none rounded-xl px-4 text-sm" />
        <select value={star} onChange={(e) => setStar(Number(e.target.value))} aria-label="Filter by rating" className="ac-select h-11 px-3 rounded-xl">
          <option value={0}>All ratings</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>
        <a href="/reviews" target="_blank" rel="noopener noreferrer" className="ac-pill !h-11">View public page →</a>
      </div>
      <div className="bg-[#121214] border border-[#1E1E1E] rounded-2xl overflow-hidden"><div className="overflow-x-auto">
        <table className="admin-table ac-orders">
          <thead><tr><th>Name</th><th>Rating</th><th>Comment</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center text-gray-500 !py-8">Loading...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={5} className="text-center text-gray-500 !py-8">{reviews.length ? 'No reviews match.' : 'No reviews yet. Share the Review Stand QR to collect the first one.'}</td></tr>
              : rows.map((r) => (
                <tr key={r.id} className="ac-row">
                  <td className="font-bold">{r.name}{r.approved === false && <span className="ml-2 text-[9px] font-semibold bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.5 rounded align-middle">HIDDEN</span>}</td>
                  <td className="whitespace-nowrap"><span className="text-[#D4AF37]">{'★'.repeat(r.rating)}</span><span className="text-[#2A2A2A]">{'★'.repeat(Math.max(0, 5 - r.rating))}</span></td>
                  <td className="text-gray-300 max-w-md"><p className="line-clamp-2" title={r.comment}>{r.comment}</p></td>
                  <td className="text-[#A1A1A1] whitespace-nowrap">{dateText(r.created_at)}</td>
                  <td><div className="flex gap-1.5">
                    <button onClick={() => hide(r)} className="ac-mini">{r.approved === false ? 'Show' : 'Hide'}</button>
                    <button onClick={() => del(r.id)} className="ac-mini ac-mini-red">Delete</button>
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div></div>
    </>
  )
}

// ---------------- Scan Analytics ----------------
function AnalyticsSection({ profiles }: SP) {
  const act = active(profiles)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const t = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { label: t.toLocaleDateString('en-US', { month: 'short' }), n: act.filter((p) => { const d = dateOf(p.created_at); return !!d && d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() }).length }
  })
  const max = Math.max(1, ...months.map((m) => m.n))
  const themes = Object.entries(act.reduce<Record<string, number>>((acc, p) => { const t = themeOf(p); acc[t] = (acc[t] || 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1])
  const pct = (n: number) => (act.length ? Math.round((n / act.length) * 100) : 0)
  return (
    <>
      <Note><b className="text-white">Tap and QR-scan counts are not collected yet</b>, so none are shown (no made-up numbers). Below is what your data can already tell you. Real scan counts need a small tracking table plus one line on the public profile page - ask and I will add it.</Note>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="New clients - last 6 months">
          <div className="flex items-end gap-3 h-40" role="img" aria-label="New clients by month">
            {months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[10px] text-[#A1A1A1]">{m.n || ''}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-[#D4AF37]/40 to-[#FFC21C]" style={{ height: `${Math.max(m.n ? 6 : 2, (m.n / max) * 100)}%`, opacity: m.n ? 1 : 0.25 }} />
                <span className="text-[10px] uppercase tracking-[1px] text-[#A1A1A1]">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Themes in use" sub={`${act.length} live profiles`}>
          {themes.length === 0 ? <Empty>No profiles yet.</Empty> : <div className="space-y-3">{themes.map(([t, n]) => (
            <div key={t}><div className="flex justify-between text-[12px] mb-1"><span>{t}</span><b>{n}</b></div><Bar pct={pct(n)} /></div>
          ))}</div>}
        </Card>
        <Card title="Profile completeness">
          <div className="space-y-3">
            {[['Has payment QR', act.filter((p) => p.gcash_qr_url || p.maya_qr_url).length], ['Has email', act.filter((p) => p.email).length], ['Has phone', act.filter((p) => p.phone).length], ['Has profile photo', act.filter((p) => p.hero_image || p.avatar_url).length]].map(([l, n]) => (
              <div key={l as string}><div className="flex justify-between text-[12px] mb-1"><span>{l}</span><b>{pct(n as number)}%</b></div><Bar pct={pct(n as number)} /></div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

// ---------------- Content CMS ----------------
function CmsSection({ profiles, loading }: SP) {
  return (
    <>
      <Note>Client page content (name, bio, about, photos, gallery, socials, theme, payment QR) is edited per client in the dashboard editor. Homepage and pricing wording lives in the site code.</Note>
      <Card title="Edit client page content" sub={`${profiles.length} profiles`}>
        {loading ? <Empty>Loading...</Empty> : profiles.length === 0 ? <Empty>No profiles yet.</Empty> : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {profiles.map((p) => (
              <li key={p.username} className="flex items-center gap-3 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] px-3 py-2.5">
                <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold truncate">{nameOf(p)}{p.is_active === false && <span className="ml-2 text-[9px] text-[#f59e0b]">HIDDEN</span>}</p><p className="text-[11px] text-[#A1A1A1] truncate">/{p.username} • {p.bio ? 'Has bio' : 'No bio yet'} • {Array.isArray(p.gallery) ? p.gallery.length : 0} photos</p></div>
                <Link href={`/dashboard?edit=${encodeURIComponent(p.username)}`} className="ac-mini ac-mini-gold !inline-flex items-center">Edit content →</Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

// ---------------- Packages & Pricing ----------------
function PricingSection({ profiles }: SP) {
  const act = active(profiles).filter((p) => payOf(p) === 'paid')
  const rows = (Object.keys(PKG) as (keyof typeof PKG)[]).map((k) => { const n = act.filter((p) => pkgOf(p) === k).length; return { k, ...PKG[k], n, revenue: n * PKG[k].price } })
  const total = rows.reduce((s, r) => s + r.revenue, 0)
  return (
    <>
      <Note>Prices are read-only here. They are set in the site code (the PRICES / PKG values in the admin pages and components/Pricing.tsx), so the public page and this console always agree.</Note>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {rows.map((r) => (
          <Card key={r.k} title={r.label} sub={r.k === 'card' ? 'Black or white NFC card + landing page' : 'Landing page only'}>
            <p className="ac-title text-[34px] font-bold">{money(r.price)} <span className="text-[12px] font-normal text-[#A1A1A1]">one-time</span></p>
            <div className="grid grid-cols-2 gap-3 mt-4 text-[12px]"><div><p className="text-[#A1A1A1] uppercase tracking-[1.2px] text-[10px] font-bold">Paid orders</p><p className="text-white font-bold text-lg">{r.n}</p></div><div><p className="text-[#A1A1A1] uppercase tracking-[1.2px] text-[10px] font-bold">Revenue</p><p className="text-white font-bold text-lg">{money(r.revenue)}</p></div></div>
            <div className="mt-3"><Bar pct={total ? (r.revenue / total) * 100 : 0} /><p className="text-[10px] text-[#A1A1A1] mt-1">{total ? Math.round((r.revenue / total) * 100) : 0}% of revenue</p></div>
          </Card>
        ))}
      </div>
      <Card title="After year one" sub="Shown on the public pricing section"><p className="text-[13px] text-[#A1A1A1]">After 1 year: <b className="text-white">₱299/year</b> to keep a profile live, or <b className="text-white">₱1,299 lifetime</b>. Optional lifetime upgrade, no lock-in.</p></Card>
    </>
  )
}

// ---------------- Admin Account ----------------
function AccountSection({ toast }: SP) {
  const pwSet = !!process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  const items: [string, boolean, string][] = [
    ['Admin password configured', pwSet, pwSet ? 'NEXT_PUBLIC_ADMIN_PASSWORD is set' : 'Set NEXT_PUBLIC_ADMIN_PASSWORD in .env.local and Vercel'],
    ['Site URL', !!process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_SITE_URL ? SITE_URL : `Using default ${SITE_URL} - set NEXT_PUBLIC_SITE_URL to change`],
    ['Demo profile', true, `View Demo opens /${DEMO}`],
  ]
  const logout = () => { try { sessionStorage.removeItem(AUTH_KEY) } catch {} ; window.dispatchEvent(new Event('tv-admin-auth')); toast('Logged out') }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Account & settings" sub="Read from your environment variables">
        <ul className="space-y-2">{items.map(([l, ok, d]) => (
          <li key={l} className="flex items-start gap-3 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] px-3 py-2.5">
            <span className={ok ? 'text-[#00D632]' : 'text-[#FFC21C]'}><i className={`fa-solid ${ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} aria-hidden="true" /></span>
            <div><p className="text-[13px] font-semibold">{l}</p><p className="text-[11px] text-[#A1A1A1] break-all">{d}</p></div>
          </li>))}</ul>
        <button onClick={logout} className="ac-mini ac-mini-red !h-10 mt-4">Safe Logout</button>
      </Card>
      <Card title="Security notice">
        <p className="text-[13px] text-[#A1A1A1] leading-relaxed">The admin password is a simple gate stored in the browser bundle (NEXT_PUBLIC_*). It keeps casual visitors out but is <b className="text-white">not real security</b>, and your Supabase policies are open. Before storing sensitive customer data, move the admin to Supabase Auth with row-level security that only allows your admin account.</p>
      </Card>
    </div>
  )
}

const SECTIONS: Record<string, { title: string; sub: string; View: (p: SP) => JSX.Element }> = {
  cards: { title: 'NFC Cards & URLs', sub: 'Every client link, ready to write to a card or print as a QR', View: CardsSection },
  'review-stands': { title: 'Review Stands & QRs', sub: 'Printable QR stands that send customers to leave a review', View: ReviewStandsSection },
  demos: { title: 'Live Test Demos', sub: 'Open or scan any profile to test what customers see', View: DemosSection },
  feedbacks: { title: 'User Feedbacks', sub: 'Read, hide or delete customer reviews', View: FeedbacksSection },
  analytics: { title: 'Scan Analytics', sub: 'Growth and profile insights from your current data', View: AnalyticsSection },
  cms: { title: 'Content CMS', sub: 'Jump straight into editing any client page', View: CmsSection },
  pricing: { title: 'Packages & Pricing', sub: 'Package prices with orders and revenue per package', View: PricingSection },
  account: { title: 'Admin Account', sub: 'Access, environment status and security', View: AccountSection },
}

export default function AdminSection({ params }: { params: { section: string } }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [profiles, setProfiles] = useState<Row[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const toast = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2200) }, [])
  useEffect(() => {
    const sync = () => { try { setAuthed(sessionStorage.getItem(AUTH_KEY) === '1') } catch { setAuthed(false) } }
    sync()
    window.addEventListener('tv-admin-auth', sync)
    return () => window.removeEventListener('tv-admin-auth', sync)
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    let { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (err) { const retry = await supabase.from('profiles').select('*'); data = retry.data; err = retry.error }
    if (err) setError(err.message)
    setProfiles((data as Row[]) || [])
    const rv = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
    if (!rv.error) setReviews((rv.data as Review[]) || [])
    setLoading(false)
  }, [])
  useEffect(() => { if (authed) load() }, [authed, load])

  if (authed === null) return <div className="min-h-screen bg-[#050505]" />
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#121214] border border-[#2A2A2A] rounded-3xl p-6 text-center space-y-4">
          <h1 className="text-xl font-bold">TapVinci Admin</h1><p className="text-xs text-gray-500">Please log in first.</p>
          <Link href="/admin" className="block h-11 leading-[44px] rounded-xl bg-[#E8C766] hover:bg-[#D4AF37] text-black font-bold text-sm">Go to admin login</Link>
        </div>
      </div>
    )
  }
  const sec = SECTIONS[params.section]
  if (!sec) {
    return <div className="min-h-screen bg-[#050505] text-white p-8"><h1 className="ac-title text-2xl font-bold">Section not found</h1><Link href="/admin/overview" className="text-[#D4AF37] underline text-sm">Back to Overview</Link></div>
  }
  const View = sec.View
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div><h1 className="ac-title text-2xl md:text-[28px] font-bold">{sec.title}</h1><p className="text-[12px] text-[#A1A1A1] mt-1">{sec.sub}</p></div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="ac-pill">Orders &amp; Sales</Link>
            <button onClick={load} className="ac-pill">{loading ? 'Refreshing...' : 'Refresh'}</button>
          </div>
        </div>
        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3" role="alert">Could not load profiles: {error}</div>}
        <View profiles={profiles} reviews={reviews} loading={loading} reload={load} toast={toast} />
      </div>
      {msg && <div className="success-toast" role="status">{msg}</div>}
    </div>
  )
}
