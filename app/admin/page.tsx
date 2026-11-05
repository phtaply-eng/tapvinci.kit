'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

// ---------------------------------------------------------------------------
// TapVinci Admin - internal list of every client profile.
//
// ACCESS: a simple password gate. The password comes from NEXT_PUBLIC_ADMIN_PASSWORD.
// NOTE: NEXT_PUBLIC_* values are bundled into browser JavaScript, so this keeps casual
// visitors out but is NOT real security. Do not rely on it for sensitive data.
// ---------------------------------------------------------------------------

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tapvinci.vercel.app').replace(/\/+$/, '')
const AUTH_KEY = 'tapvinci_admin_ok'

const THEME_NAMES: Record<string, string> = {
  gold: 'Black Gold',
  purple: 'Midnight Purple',
  blue: 'Ocean Blue',
  green: 'Forest Green',
  pink: 'Sunset Pink',
  orange: 'Sunrise Orange',
}

type Row = {
  username: string
  name?: string | null
  business?: string | null
  phone?: string | null
  email?: string | null
  theme?: string | { pack?: string } | null
  created_at?: string | null
  gcash_qr_url?: string | null
  maya_qr_url?: string | null
  is_active?: boolean | null
  [key: string]: any
}

type ReviewRow = {
  id: string
  name: string
  rating: number
  comment: string
  created_at?: string | null
  approved?: boolean | null
}

type SortKey = 'username' | 'name' | 'phone' | 'email' | 'theme' | 'created_at'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'theme', label: 'Theme' },
]

const PROFILE_BUCKET = 'profile-images'

type EditForm = { name: string; title: string; bio: string; about: string; phone: string; email: string; facebook: string; instagram: string; website: string }
const EMPTY_EDIT: EditForm = { name: '', title: '', bio: '', about: '', phone: '', email: '', facebook: '', instagram: '', website: '' }
const EDIT_FIELDS: { key: keyof EditForm; label: string; rows?: number }[] = [
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'bio', label: 'Bio', rows: 3 },
  { key: 'about', label: 'About Me', rows: 4 },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'facebook', label: 'Facebook Link' },
  { key: 'instagram', label: 'Instagram Link' },
  { key: 'website', label: 'Website' },
]

// socials may be plain strings ("https://...") or objects ({ url, visible }) - handle both
function socialUrl(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && typeof (v as { url?: unknown }).url === 'string') return (v as { url: string }).url
  return ''
}
function withSocial(socials: Record<string, unknown>, key: string, url: string): unknown {
  const cur = socials[key]
  return cur && typeof cur === 'object' ? { ...(cur as object), url } : url
}

// "https://x.supabase.co/storage/v1/object/public/<bucket>/<path>?v=1" -> { bucket, path }
function parseStorageUrl(u: unknown): { bucket: string; path: string } | null {
  if (typeof u !== 'string') return null
  const m = /\/storage\/v1\/object\/public\/([^/]+)\/([^?]+)/.exec(u)
  if (!m) return null
  try { return { bucket: m[1], path: decodeURIComponent(m[2]) } } catch { return null }
}

// every file under a folder, including sub-folders (Supabase list() is one level only)
async function listAllFiles(bucket: string, prefix: string, depth = 0): Promise<string[]> {
  const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 })
  const out: string[] = []
  for (const item of data || []) {
    if (item.id === null && depth < 4) out.push(...(await listAllFiles(bucket, `${prefix}/${item.name}`, depth + 1)))
    else if (item.id !== null) out.push(`${prefix}/${item.name}`)
  }
  return out
}

function displayName(p: Row) {
  return (p.name || p.business || '').toString()
}

function themeLabel(p: Row) {
  const raw = typeof p.theme === 'object' && p.theme ? p.theme.pack : p.theme
  const id = (raw || 'gold').toString()
  return THEME_NAMES[id] || id
}

function parseDate(v?: string | null) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(v?: string | null) {
  const d = parseDate(v)
  return d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'
}

function csvCell(v: unknown) {
  const s = (v ?? '').toString().replace(/"/g, '""')
  return `"${s}"`
}

// ---------------------------------------------------------------------------
// Orders & Sales: every client profile = one order. Package / payment / fulfillment live on the
// profiles row (run supabase-orders.sql once). Rows without those columns fall back to the defaults below.
// ---------------------------------------------------------------------------
const ORDER_PREFIX = 'TV' // order numbers look like TV-USERNAME-123456 (change here if you want another prefix)
const PACKAGES = {
  card: { label: 'Card + Digital', price: 899, note: 'Includes NFC card' },
  digital: { label: 'Digital Only', price: 399, note: 'Landing page only' },
} as const
type PackageId = keyof typeof PACKAGES
const PAY_OPTIONS = ['paid', 'pending', 'failed'] as const
type PayStatus = (typeof PAY_OPTIONS)[number]
const FUL_OPTIONS = ['pending', 'printing', 'shipped', 'completed'] as const
type FulStatus = (typeof FUL_OPTIONS)[number]
const FUL_NEXT: Record<FulStatus, FulStatus | null> = { pending: 'printing', printing: 'shipped', shipped: 'completed', completed: null }
const MISSING_COLS = /package|payment_status|paid_at|fulfillment|fulfilled_at|is_active|deactivated_at/

const pkgOf = (p: Row): PackageId => (p.package === 'digital' ? 'digital' : 'card')
const payOf = (p: Row): PayStatus => (p.payment_status === 'pending' || p.payment_status === 'failed' ? p.payment_status : 'paid')
const fulOf = (p: Row): FulStatus => (FUL_OPTIONS as readonly string[]).includes(p.fulfillment as string) ? (p.fulfillment as FulStatus) : 'pending'
const amountOf = (p: Row) => PACKAGES[pkgOf(p)].price

// Demo / test accounts: still live and editable, but never counted in sales stats.
// Works with no migration (username list). If the profiles table also has an `is_demo` boolean, that counts too.
const DEMO_USERNAMES = ['shua', 'tapvinci', 'robert']
// never permanently deletable from admin (they power /shua demo and the /tapvinci template) - deactivate instead
const PROTECTED_USERNAMES = ['shua', 'tapvinci']
const DEMO_EMAILS = ['tapvinci@yahoo.com', 'shuarmav@gmail.com'] // keep in sync with app/admin/overview/page.tsx
const isDemo = (p: Row) =>
  p.is_demo === true ||
  DEMO_USERNAMES.includes((p.username || '').toString().toLowerCase()) ||
  DEMO_EMAILS.includes((p.email || '').toString().trim().toLowerCase())
type DemoFilter = 'all' | 'real' | 'demo'
const DEMO_BADGE_STYLE = { background: 'rgba(255,194,28,0.2)', color: '#FFC21C' } as const
const DEMO_PAY_STYLE = { background: '#1E1E1E', color: '#A1A1A1', borderColor: '#2A2A2A' } as const

function orderNo(p: Row) {
  // stable (same every render): derived from username + creation time
  let h = 0
  const s = `${p.username}|${p.created_at || ''}`
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return `${ORDER_PREFIX}-${p.username.toUpperCase()}-${String(h % 1000000).padStart(6, '0')}`
}

function money(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateTime(v?: string | null) {
  const d = parseDate(v)
  if (!d) return '-'
  const day = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${day} ${time}`
}

function escapeHtml(v: unknown) {
  return (v ?? '').toString().replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

// printable invoice in a new tab: use the browser's Print -> Save as PDF
function openInvoice(p: Row) {
  const pkg = PACKAGES[pkgOf(p)]
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(orderNo(p))}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:680px;margin:40px auto;padding:0 24px}h1{font-size:22px;margin:0}small{color:#666}
table{width:100%;border-collapse:collapse;margin-top:28px}td,th{padding:10px 8px;border-bottom:1px solid #ddd;text-align:left;font-size:14px}th{font-size:11px;text-transform:uppercase;color:#666}
.r{text-align:right}.tot{font-size:18px;font-weight:700}.gold{color:#9a7b1e}@media print{button{display:none}}</style></head><body>
<h1>Tap<span class="gold">Vinci</span> <small>INVOICE</small></h1><p><small>${escapeHtml(SITE_URL)} &bull; Philippines</small></p>
<p><b>Order #</b> ${escapeHtml(orderNo(p))}<br><b>Date</b> ${escapeHtml(formatDateTime(p.created_at))}<br><b>Payment</b> ${escapeHtml(payOf(p).toUpperCase())} &bull; GCash/Maya QR Ph</p>
<p><b>Bill to</b><br>${escapeHtml(displayName(p) || p.username)}<br>${escapeHtml(p.email || '')}<br>${escapeHtml(p.phone || '')}</p>
<table><tr><th>Item</th><th>Link</th><th class="r">Amount</th></tr>
<tr><td>${escapeHtml(pkg.label)}<br><small>${escapeHtml(pkg.note)}</small></td><td>${escapeHtml(SITE_URL + '/' + p.username)}</td><td class="r">${escapeHtml(money(pkg.price))}</td></tr>
<tr><td colspan="2" class="r tot">Total</td><td class="r tot">${escapeHtml(money(pkg.price))}</td></tr></table>
<p><small>Thank you for choosing TapVinci.</small></p><button onclick="window.print()">Print / Save as PDF</button></body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
  return true
}

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [profiles, setProfiles] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [toast, setToast] = useState('')

  // Reviews - APPENDED FOR REVIEW SYSTEM
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsSearch, setReviewsSearch] = useState('')

  // QR generator modal
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Row | null>(null)
  const [qrUrl, setQrUrl] = useState('')

  // Edit / Delete
  const [editingProfile, setEditingProfile] = useState<Row | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Row | null>(null)
  const [deleteText, setDeleteText] = useState('')
  const [busyAction, setBusyAction] = useState(false)

  // Orders & Sales view (the Business Profiles view below is the original client table + reviews)
  const [view, setView] = useState<'orders' | 'profiles'>('orders')
  const [oDraft, setODraft] = useState('')
  const [oQuery, setOQuery] = useState('')
  const [payFilter, setPayFilter] = useState<'all' | 'paid' | 'pending' | 'completed' | 'deleted'>('all')
  const [demoFilter, setDemoFilter] = useState<DemoFilter>('all')
  const [fulFilter, setFulFilter] = useState<'all' | FulStatus>('all')
  const [oSort, setOSort] = useState<'date' | 'amount'>('date')
  const [oAsc, setOAsc] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [genOpen, setGenOpen] = useState(false)

  // restore a previous login for this browser tab
  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTH_KEY) === '1') setIsAuthed(true)
    } catch {}
    setChecked(true)
  }, [])

  // sidebar (admin/layout.tsx) switches the view with the URL hash and logs out through an event
  useEffect(() => {
    const onHash = () => setView(window.location.hash === '#profiles' ? 'profiles' : 'orders')
    const onAuth = () => {
      try { if (sessionStorage.getItem(AUTH_KEY) !== '1') { setIsAuthed(false); setProfiles([]) } } catch {}
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    window.addEventListener('tv-admin-auth', onAuth)
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('tv-admin-auth', onAuth) }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    // exact query from the brief: newest first
    let { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) {
      // older tables may not have created_at: retry without ordering
      const retry = await supabase.from('profiles').select('*')
      data = retry.data
      error = retry.error
    }
    if (error) setLoadError(error.message)
    setProfiles((data as Row[]) || [])
    setLoading(false)
  }, [])

  const fetchReviews = async () => {
    setReviewsLoading(true)
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
    if (!error) setReviews((data as ReviewRow[]) || [])
    setReviewsLoading(false)
  }

  useEffect(() => {
    if (isAuthed) {
      fetchProfiles()
      fetchReviews()
    }
  }, [isAuthed, fetchProfiles])

  const checkPassword = () => {
    if (!ADMIN_PASSWORD) {
      setAuthError('Admin password is not set. Add NEXT_PUBLIC_ADMIN_PASSWORD in .env.local / Vercel, then redeploy.')
      return
    }
    if (password === ADMIN_PASSWORD) {
      setIsAuthed(true)
      setAuthError('')
      setPassword('')
      try { sessionStorage.setItem(AUTH_KEY, '1') } catch {}
      window.dispatchEvent(new Event('tv-admin-auth'))
    } else {
      setAuthError('Wrong password.')
    }
  }

  const logout = () => {
    setIsAuthed(false)
    setProfiles([])
    try { sessionStorage.removeItem(AUTH_KEY) } catch {}
    window.dispatchEvent(new Event('tv-admin-auth'))
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = profiles.filter((p) => {
      if (!q) return true
      return [p.username, displayName(p), p.email, p.phone].some((v) => (v || '').toString().toLowerCase().includes(q))
    })
    const dir = sortAsc ? 1 : -1
    return [...list].sort((a, b) => {
      if (sortKey === 'created_at') {
        return ((parseDate(a.created_at)?.getTime() || 0) - (parseDate(b.created_at)?.getTime() || 0)) * dir
      }
      const av = (sortKey === 'name' ? displayName(a) : sortKey === 'theme' ? themeLabel(a) : (a[sortKey] || '')).toString().toLowerCase()
      const bv = (sortKey === 'name' ? displayName(b) : sortKey === 'theme' ? themeLabel(b) : (b[sortKey] || '')).toString().toLowerCase()
      return av.localeCompare(bv) * dir
    })
  }, [profiles, search, sortKey, sortAsc])

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = profiles.filter((p) => {
      const d = parseDate(p.created_at)
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    const withQR = profiles.filter((p) => p.gcash_qr_url || p.maya_qr_url).length
    return { total: profiles.length, thisMonth, withQR }
  }, [profiles])

  // Reviews stats and filter - APPENDED FOR REVIEW SYSTEM
  const reviewsStats = useMemo(() => {
    const total = reviews.length
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0
    return { total, avg: Math.round(avg * 10) / 10, fiveStar: reviews.filter(r => r.rating === 5).length }
  }, [reviews])

  const filteredReviews = useMemo(() => {
    const q = reviewsSearch.trim().toLowerCase()
    if (!q) return reviews
    return reviews.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.comment.toLowerCase().includes(q) ||
      r.rating.toString().includes(q)
    )
  }, [reviews, reviewsSearch])

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) return showToast('Delete failed: ' + error.message)
    showToast('Review deleted')
    fetchReviews()
  }

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(key !== 'created_at')
    }
  }

  const copyLink = async (username: string) => {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/${username}`)
      showToast('Link copied!')
    } catch {
      showToast('Copy failed')
    }
  }

  function handleGenerateQR(profile: Row) {
    setSelectedProfile(profile)
    setQrUrl(`${SITE_URL}/${encodeURIComponent(profile.username)}`)
    setShowQRModal(true)
  }

  const closeQR = () => setShowQRModal(false)

  // Esc closes the QR modal
  useEffect(() => {
    if (!showQRModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowQRModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showQRModal])

  async function downloadQR() {
    if (!selectedProfile) return
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=10&format=png&data=${encodeURIComponent(qrUrl)}`
    try {
      const res = await fetch(apiUrl)
      if (!res.ok) throw new Error('QR request failed')
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${selectedProfile.username}-tapvinci-qr.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
      showToast('QR downloaded')
    } catch {
      // fallback: open the image so it can be saved manually
      window.open(apiUrl, '_blank', 'noopener')
      showToast('Opened QR in a new tab - right-click to save')
    }
  }

  // ---------- Edit ----------
  function handleEdit(profile: Row) {
    const soc = (profile.socials && typeof profile.socials === 'object' ? profile.socials : {}) as Record<string, unknown>
    setEditForm({
      name: displayName(profile),
      title: profile.title || '',
      bio: profile.bio || '',
      about: profile.about || '',
      phone: profile.phone || '',
      email: profile.email || '',
      facebook: socialUrl(soc.facebook),
      instagram: socialUrl(soc.instagram),
      website: socialUrl(soc.website),
    })
    setEditingProfile(profile)
  }

  async function handleSaveEdit() {
    if (!editingProfile) return
    setSavingEdit(true)
    const f = editForm
    const base = (editingProfile.socials && typeof editingProfile.socials === 'object' ? editingProfile.socials : {}) as Record<string, unknown>
    const socials = {
      ...base,
      facebook: withSocial(base, 'facebook', f.facebook.trim()),
      instagram: withSocial(base, 'instagram', f.instagram.trim()),
      website: withSocial(base, 'website', f.website.trim()),
    }
    // premium-schema tables call the name column "business"
    const nameKey = 'business' in editingProfile && !('name' in editingProfile) ? 'business' : 'name'
    const { data, error } = await supabase
      .from('profiles')
      .update({ [nameKey]: f.name.trim(), title: f.title.trim(), bio: f.bio, about: f.about, phone: f.phone.trim(), email: f.email.trim(), socials })
      .eq('username', editingProfile.username)
      .select()
    setSavingEdit(false)
    if (error) return showToast('Save failed: ' + error.message)
    if (!data || data.length === 0) return showToast('Nothing was updated - check the Supabase update policy')
    showToast('Updated!')
    setEditingProfile(null)
    fetchProfiles()
  }

  // ---------- Delete / Deactivate ----------
  function handleDeleteConfirm(profile: Row) {
    setDeleteText('')
    setDeleteConfirm(profile)
  }

  async function handleDelete(profile: Row) {
    if (PROTECTED_USERNAMES.includes((profile.username || '').toString().toLowerCase())) {
      return showToast(`${profile.username} is a protected demo account - use Deactivate instead`)
    }
    setBusyAction(true)
    const username = profile.username
    // 1) work out which stored files belong to this client
    const targets: Record<string, Set<string>> = {}
    const add = (bucket: string, path: string) => { (targets[bucket] ||= new Set()).add(path) }
    const urls: unknown[] = [profile.hero_image, profile.heroImage, profile.avatar_url, profile.avatar, profile.gcash_qr_url, profile.maya_qr_url]
    if (Array.isArray(profile.gallery)) profile.gallery.forEach((g: unknown) => urls.push(typeof g === 'string' ? g : (g as { src?: string })?.src))
    for (const u of urls) {
      const p = parseStorageUrl(u)
      // profile-images is organised per client: never touch another client's folder
      if (p && (p.bucket !== PROFILE_BUCKET || p.path.startsWith(`${username}/`))) add(p.bucket, p.path)
    }
    try { (await listAllFiles(PROFILE_BUCKET, username)).forEach((p) => add(PROFILE_BUCKET, p)) } catch {}

    // 2) delete the row first, so a failure never leaves a live profile without its photos
    const { data, error } = await supabase.from('profiles').delete().eq('username', username).select()
    if (error) { setBusyAction(false); return showToast('Delete failed: ' + error.message) }
    if (!data || data.length === 0) { setBusyAction(false); return showToast('Nothing was deleted - check the Supabase delete policy') }

    // 3) remove the files (best effort)
    let removed = 0
    for (const [bucket, paths] of Object.entries(targets)) {
      const { data: rm } = await supabase.storage.from(bucket).remove(Array.from(paths))
      removed += rm?.length || 0
    }
    setBusyAction(false)
    setDeleteConfirm(null)
    showToast(`Deleted ${username}${removed ? ` and ${removed} file${removed > 1 ? 's' : ''}` : ''}`)
    fetchProfiles()
  }

  async function handleSetActive(profile: Row, active: boolean) {
    setBusyAction(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: active, deactivated_at: active ? null : new Date().toISOString() })
      .eq('username', profile.username)
      .select()
    setBusyAction(false)
    if (error) return showToast(/is_active|deactivated_at/.test(error.message) ? 'Run supabase-admin.sql in Supabase first' : 'Failed: ' + error.message)
    if (!data || data.length === 0) return showToast('Nothing was updated - check the Supabase update policy')
    setDeleteConfirm(null)
    showToast(active ? 'Reactivated - profile is live again' : 'Deactivated - profile hidden, data kept')
    fetchProfiles()
  }

  // Esc closes the edit / delete modals
  useEffect(() => {
    if (!editingProfile && !deleteConfirm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setEditingProfile(null)
      setDeleteConfirm(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingProfile, deleteConfirm])

    // ---------- Orders & Sales ----------
  const activeProfiles = useMemo(() => profiles.filter((p) => p.is_active !== false), [profiles])

  // sales numbers only ever use real (non-demo) active clients
  const realClients = useMemo(() => activeProfiles.filter((p) => !isDemo(p)), [activeProfiles])
  const demoCount = useMemo(() => activeProfiles.filter(isDemo).length, [activeProfiles])

  const orderStats = useMemo(() => {
    const paid = realClients.filter((p) => payOf(p) === 'paid')
    // stage chips follow the Real / Demo filter so their counts match the table
    const scope = demoFilter === 'real' ? realClients : demoFilter === 'demo' ? activeProfiles.filter(isDemo) : activeProfiles
    const byFul: Record<FulStatus, number> = { pending: 0, printing: 0, shipped: 0, completed: 0 }
    scope.forEach((p) => { byFul[fulOf(p)] += 1 })
    return {
      revenue: paid.reduce((sum, p) => sum + amountOf(p), 0),
      completed: paid.length,
      sessions: realClients.length,
      pendingPay: realClients.filter((p) => payOf(p) === 'pending').length,
      deleted: profiles.length - activeProfiles.length,
      scopeCount: scope.length,
      byFul,
    }
  }, [profiles, activeProfiles, realClients, demoFilter])

  const orders = useMemo(() => {
    const q = oQuery.trim().toLowerCase()
    const list = profiles.filter((p) => {
      const inactive = p.is_active === false
      if (payFilter === 'deleted' ? !inactive : inactive) return false
      if (demoFilter === 'real' && isDemo(p)) return false
      if (demoFilter === 'demo' && !isDemo(p)) return false
      if (payFilter === 'paid' && payOf(p) !== 'paid') return false
      if (payFilter === 'pending' && payOf(p) !== 'pending') return false
      if (payFilter === 'completed' && fulOf(p) !== 'completed') return false
      if (fulFilter !== 'all' && fulOf(p) !== fulFilter) return false
      if (!q) return true
      return [orderNo(p), p.username, displayName(p), p.email, p.phone, `${SITE_URL}/${p.username}`].some((v) => (v || '').toString().toLowerCase().includes(q))
    })
    const dir = oAsc ? 1 : -1
    return list.sort((a, b) =>
      oSort === 'amount'
        ? (amountOf(a) - amountOf(b)) * dir
        : ((parseDate(a.created_at)?.getTime() || 0) - (parseDate(b.created_at)?.getTime() || 0)) * dir
    )
  }, [profiles, oQuery, payFilter, demoFilter, fulFilter, oSort, oAsc])

  const selectedList = useMemo(() => orders.filter((p) => selected.has(p.username)), [orders, selected])
  const allVisibleSelected = orders.length > 0 && selectedList.length === orders.length

  const toggleOrderSort = (key: 'date' | 'amount') => {
    if (key === oSort) setOAsc((v) => !v)
    else { setOSort(key); setOAsc(false) }
  }
  const toggleSelected = (username: string) =>
    setSelected((prev) => { const next = new Set(prev); if (next.has(username)) next.delete(username); else next.add(username); return next })

  // one place for every order write; rows keep their existing data, only the changed fields are sent
  async function updateOrder(profile: Row, patch: Record<string, unknown>, okMsg?: string) {
    const { data, error } = await supabase.from('profiles').update(patch).eq('username', profile.username).select()
    if (error) return showToast(MISSING_COLS.test(error.message) ? 'Run supabase-orders.sql in Supabase first' : 'Failed: ' + error.message)
    if (!data || data.length === 0) return showToast('Nothing was updated - check the Supabase update policy')
    setProfiles((list) => list.map((r) => (r.username === profile.username ? { ...r, ...(data[0] as Row) } : r)))
    if (okMsg) showToast(okMsg)
  }
  const setPayment = (p: Row, v: PayStatus) => updateOrder(p, { payment_status: v, paid_at: v === 'paid' ? new Date().toISOString() : null }, `Payment: ${v.toUpperCase()}`)
  const setFulfillment = (p: Row, v: FulStatus) => updateOrder(p, { fulfillment: v, fulfilled_at: new Date().toISOString() }, `Fulfillment: ${v.toUpperCase()}`)
  const setPackage = (p: Row, v: PackageId) => updateOrder(p, { package: v }, `Package: ${PACKAGES[v].label}`)

  // "Deleted History" = deactivated (profile hidden, all data kept). Restore brings it back.
  async function setSelectedActive(active: boolean) {
    if (selectedList.length === 0) return
    setBusyAction(true)
    const names = selectedList.map((p) => p.username)
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: active, deactivated_at: active ? null : new Date().toISOString() })
      .in('username', names)
      .select()
    setBusyAction(false)
    if (error) return showToast(MISSING_COLS.test(error.message) ? 'Run supabase-admin.sql in Supabase first' : 'Failed: ' + error.message)
    if (!data || data.length === 0) return showToast('Nothing was updated - check the Supabase update policy')
    setSelected(new Set())
    showToast(active ? `Restored ${data.length} order${data.length > 1 ? 's' : ''}` : `Moved ${data.length} to Deleted History (profiles hidden, data kept)`)
    fetchProfiles()
  }

  const sendLink = (p: Row) => {
    if (!p.email) return showToast('This client has no email')
    const url = `${SITE_URL}/${p.username}`
    const body = `Hi ${displayName(p) || p.username},\n\nYour TapVinci profile is live: ${url}\n\nOrder ${orderNo(p)}\n\nThank you!`
    window.location.href = `mailto:${encodeURIComponent(p.email)}?subject=${encodeURIComponent('Your TapVinci link')}&body=${encodeURIComponent(body)}`
  }

  const exportCsv = () => {
    const ordersView = view === 'orders'
    const rows = ordersView ? orders : filtered
    const header = ['username', 'name', 'phone', 'email', 'theme', 'created_at', 'link', ...(ordersView ? ['order_no', 'package', 'amount_php', 'payment_status', 'fulfillment'] : [])]
    const lines = rows.map((p) =>
      [p.username, displayName(p), p.phone, p.email, themeLabel(p), p.created_at, `${SITE_URL}/${p.username}`,
        ...(ordersView ? [orderNo(p), PACKAGES[pkgOf(p)].label, amountOf(p), payOf(p), fulOf(p)] : [])].map(csvCell).join(',')
    )
    const blob = new Blob([[header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tapvinci-${ordersView ? 'orders' : 'clients'}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showToast(`Exported ${rows.length} ${ordersView ? 'orders' : 'clients'}`)
  }

  // ---------- password gate ----------
  if (!checked) return <div className="min-h-screen bg-[#050505]" />

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); checkPassword() }}
          className="w-full max-w-sm bg-[#121214] border border-[#2A2A2A] rounded-3xl p-6 space-y-4"
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D4AF37] text-black flex items-center justify-center">
              <i className="fa-solid fa-lock"></i>
            </div>
            <h1 className="text-xl font-bold">TapVinci Admin</h1>
            <p className="text-xs text-gray-500 mt-1">Internal use only</p>
          </div>
          <input
            type="password"
            autoFocus
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 bg-[#1E1E20] border border-[#2A2A2A] focus:border-[#D4AF37] outline-none rounded-xl px-3 text-sm"
          />
          {authError && <p className="text-xs text-red-400" role="alert">{authError}</p>}
          <button type="submit" className="w-full h-11 rounded-xl bg-[#E8C766] hover:bg-[#D4AF37] text-black font-bold text-sm transition">
            Enter Admin
          </button>
        </form>
      </div>
    )
  }

  // ---------- admin panel ----------
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {view === 'orders' ? (
        <>
          {/* ===== ORDERS & SALES MANAGEMENT ===== */}
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="ac-title text-2xl md:text-[28px] font-bold">Orders &amp; Sales Management Dashboard</h1>
              <p className="text-[12px] text-[#A1A1A1] mt-1">Real-time tracking of online GCash/Maya QR Ph transactions, NFC card fulfillment, and revenue</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="ac-pill">Dashboard</Link>
              <button onClick={fetchProfiles} className="ac-pill">{loading ? 'Refreshing...' : 'Refresh'}</button>
              <button onClick={exportCsv} disabled={!orders.length} className="ac-pill disabled:opacity-40">Export CSV</button>
              <button onClick={logout} className="ac-pill">Log out</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sales Revenue', value: money(orderStats.revenue), sub: realClients.length === 0 ? 'No real sales yet - demo accounts excluded' : 'Verified paid orders (demo accounts excluded)', icon: 'fa-wallet', tone: '#D4AF37' },
              { label: 'Completed Purchases', value: String(orderStats.completed), sub: 'Active paid and provisioned sites', icon: 'fa-circle-check', tone: '#00D632' },
              { label: 'Total Checkout Sessions', value: String(orderStats.sessions), sub: 'Active orders & buy now sessions', icon: 'fa-cart-shopping', tone: '#007DFE' },
              { label: 'Pending QR Scans', value: String(orderStats.pendingPay), sub: 'Awaiting GCash/Maya confirmation', icon: 'fa-qrcode', tone: '#FFC21C' },
            ].map((c) => (
              <div key={c.label} className="ac-stat">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[1.5px] text-[#A1A1A1] font-bold">{c.label}</p>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] shrink-0" style={{ background: `${c.tone}1F`, color: c.tone }}><i className={`fa-solid ${c.icon}`} aria-hidden="true" /></span>
                </div>
                <p className="ac-title text-[28px] font-bold text-white mt-2 leading-none">{c.value}</p>
                <p className="text-[11px] text-[#A1A1A1] mt-2">{c.sub}</p>
              </div>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setOQuery(oDraft) }} className="flex flex-wrap gap-2 mb-3">
            <input
              value={oDraft}
              onChange={(e) => { setODraft(e.target.value); setOQuery(e.target.value) }}
              placeholder="Search Order #, Customer Name, Email, or Custom URL..."
              aria-label="Search orders"
              className="flex-1 min-w-[240px] h-11 bg-[#121214] border border-[#1E1E1E] focus:border-[#D4AF37] outline-none rounded-xl px-4 text-sm"
            />
            <button type="submit" className="h-11 px-5 rounded-xl bg-[#D4AF37] hover:bg-[#E8C766] text-black font-bold text-sm transition">Search</button>
            <select value={payFilter} onChange={(e) => setPayFilter(e.target.value as typeof payFilter)} aria-label="Filter orders" className="ac-select h-11 px-3 rounded-xl">
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="deleted">Deleted History ({orderStats.deleted})</option>
            </select>
            <select value={demoFilter} onChange={(e) => setDemoFilter(e.target.value as DemoFilter)} aria-label="Filter real or demo accounts" className="ac-select h-11 px-3 rounded-xl">
              <option value="all">All accounts</option>
              <option value="real">Real Clients</option>
              <option value="demo">Demo/Test ({demoCount})</option>
            </select>
            <div className="relative">
              <button type="button" onClick={() => setGenOpen((v) => !v)} aria-expanded={genOpen} className="h-11 px-5 rounded-xl bg-[#FFC21C] text-black font-bold text-sm shadow-[0_8px_28px_rgba(255,194,28,0.35)] hover:brightness-105 transition">
                <i className="fa-solid fa-plus mr-2" aria-hidden="true" />Generate Order <i className="fa-solid fa-chevron-down ml-2 text-[10px]" aria-hidden="true" />
              </button>
              {genOpen && (
                <div className="absolute right-0 top-12 z-20 w-60 rounded-xl border border-[#2A2A2A] bg-[#121214] p-1.5 shadow-2xl">
                  <Link href="/dashboard" onClick={() => setGenOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-[#1E1E20]">Single order<span className="block text-[10px] text-[#A1A1A1]">Create one client profile</span></Link>
                  <div className="rounded-lg px-3 py-2.5 text-sm text-[#6B7280] cursor-not-allowed" aria-disabled="true">Bulk orders <em className="not-italic text-[9px] ml-1 text-[#D4AF37]">SOON</em></div>
                </div>
              )}
            </div>
          </form>

          {/* fulfillment filter: click a stage to see only those orders */}
          <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Fulfillment filter">
            {(['all', ...FUL_OPTIONS] as const).map((f) => (
              <button key={f} onClick={() => setFulFilter(f)} className={`ac-chip ${fulFilter === f ? 'on' : ''}`}>
                {f === 'all' ? 'All stages' : f.toUpperCase()}<b>{f === 'all' ? orderStats.scopeCount : orderStats.byFul[f]}</b>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4 text-[12px]">
            <label className="inline-flex items-center gap-2 text-[#A1A1A1]">
              <input type="checkbox" checked={allVisibleSelected} onChange={() => setSelected(allVisibleSelected ? new Set() : new Set(orders.map((p) => p.username)))} className="accent-[#D4AF37]" />
              Select All Visible
            </label>
            <button onClick={() => setSelected(new Set(orders.map((p) => p.username)))} className="ac-mini">Select All</button>
            <button onClick={() => setSelected(new Set())} className="ac-mini">Deselect</button>
            <span className="text-[#A1A1A1]">({selectedList.length} selected)</span>
            {payFilter === 'deleted' ? (
              <button onClick={() => setSelectedActive(true)} disabled={!selectedList.length || busyAction} className="ac-mini ac-mini-gold disabled:opacity-40">Restore Selected</button>
            ) : (
              <button onClick={() => setSelectedActive(false)} disabled={!selectedList.length || busyAction} className="ac-mini ac-mini-red disabled:opacity-40">Move Selected to Deleted History</button>
            )}
            <span className="ml-auto text-[11px] text-[#6B7280]">Showing {orders.length} of {profiles.length}</span>
          </div>

          {loadError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3" role="alert">Could not load profiles: {loadError}</div>
          )}

          <div className="bg-[#121214] border border-[#1E1E1E] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="admin-table ac-orders">
                <thead>
                  <tr>
                    <th scope="col" className="admin-th-sort" onClick={() => toggleOrderSort('date')}>Order #{oSort === 'date' ? (oAsc ? ' ▲' : ' ▼') : ''}</th>
                    <th scope="col">Customer Info</th>
                    <th scope="col">Website Link / Bulk</th>
                    <th scope="col" className="admin-th-sort" onClick={() => toggleOrderSort('amount')}>Amount{oSort === 'amount' ? (oAsc ? ' ▲' : ' ▼') : ''}</th>
                    <th scope="col">Payment Status</th>
                    <th scope="col">Fulfillment</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center text-gray-500 !py-8">Loading...</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-gray-500 !py-8">{demoFilter === 'real' && payFilter !== 'deleted' && !oQuery.trim() && fulFilter === 'all'
                      ? 'No real orders yet. Demo accounts (shua, tapvinci) hidden from sales.'
                      : profiles.length ? 'No orders match this search / filter.' : 'No orders yet.'}</td></tr>
                  ) : (
                    orders.map((p) => {
                      const pay = payOf(p)
                      const ful = fulOf(p)
                      const pkg = PACKAGES[pkgOf(p)]
                      const next = FUL_NEXT[ful]
                      const url = `${SITE_URL}/${p.username}`
                      return (
                        <tr key={p.username} className="ac-row">
                          <td>
                            <div className="flex items-start gap-3">
                              <input type="checkbox" checked={selected.has(p.username)} onChange={() => toggleSelected(p.username)} aria-label={`Select ${p.username}`} className="mt-1 accent-[#D4AF37]" />
                              <div>
                                <p className="font-bold text-[#D4AF37] text-[12px] whitespace-nowrap">{orderNo(p)}{isDemo(p) && <span className="demo-badge ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full align-middle" style={DEMO_BADGE_STYLE}>DEMO</span>}{p.is_active === false && <span className="ml-2 text-[9px] font-semibold bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.5 rounded align-middle">DELETED</span>}</p>
                                <p className="text-[10px] text-[#A1A1A1] mt-0.5 whitespace-nowrap">{formatDateTime(p.created_at)} • Via GCash/Maya QR Ph</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="ac-pop-wrap" tabIndex={0}>
                              <p className="font-bold text-white">{displayName(p) || '-'}</p>
                              <p className="text-[11px] text-[#A1A1A1]">{p.email || '-'}</p>
                              <p className="text-[11px] text-[#A1A1A1]"><i className="fa-solid fa-phone mr-1 text-[9px]" aria-hidden="true" />{p.phone || '-'}</p>
                              <div className="ac-pop" role="tooltip">
                                <p className="text-[9px] uppercase tracking-[1.5px] text-[#D4AF37] font-bold mb-1.5">Onboarding checklist</p>
                                {[
                                  ['Profile Done', !!(displayName(p) && p.phone)],
                                  ['QR Uploaded', !!(p.gcash_qr_url || p.maya_qr_url)],
                                  ['Card Printed', pkgOf(p) === 'digital' ? null : ful === 'shipped' || ful === 'completed'],
                                ].map(([label, ok]) => (
                                  <p key={label as string} className="text-[11px] flex items-center gap-2">
                                    <span className={ok === null ? 'text-[#6B7280]' : ok ? 'text-[#00D632]' : 'text-[#FFC21C]'}>{ok === null ? '–' : ok ? '✓' : '?'}</span>
                                    <span className="text-white/80">{label as string}{ok === null ? ' (digital only)' : ''}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td>
                            <Link href={`/${p.username}`} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline text-[13px] font-semibold whitespace-nowrap">/{p.username} →</Link>
                            <p className="text-[10px] text-[#6B7280] mt-0.5 break-all max-w-[220px]">{url}</p>
                          </td>
                          <td>
                            <p className="font-bold text-white whitespace-nowrap">{money(pkg.price)}</p>
                            <select value={pkgOf(p)} onChange={(e) => setPackage(p, e.target.value as PackageId)} aria-label="Package" className="ac-select ac-select-sm mt-1">
                              {(Object.keys(PACKAGES) as PackageId[]).map((k) => <option key={k} value={k}>{PACKAGES[k].label}</option>)}
                            </select>
                            <p className="text-[10px] text-[#A1A1A1] mt-0.5">{pkg.note}</p>
                          </td>
                          <td>
                            <select value={pay} onChange={(e) => setPayment(p, e.target.value as PayStatus)} aria-label="Payment status" className={`ac-badge ac-pay-${pay}`} style={isDemo(p) ? DEMO_PAY_STYLE : undefined}>
                              {PAY_OPTIONS.map((o) => <option key={o} value={o}>{isDemo(p) && o === pay ? `DEMO (${o.toUpperCase()})` : o.toUpperCase()}</option>)}
                            </select>
                            <p className="text-[10px] text-[#A1A1A1] mt-1 whitespace-nowrap">{isDemo(p) ? 'Demo - not counted in sales' : pay === 'paid' ? formatDateTime(p.paid_at || p.created_at) : pay === 'pending' ? 'Awaiting confirmation' : 'Payment failed'}</p>
                          </td>
                          <td>
                            <select value={ful} onChange={(e) => setFulfillment(p, e.target.value as FulStatus)} aria-label="Fulfillment" className={`ac-badge ac-ful-${ful}`}>
                              {FUL_OPTIONS.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                            </select>
                            <p className="text-[10px] text-[#A1A1A1] mt-1 whitespace-nowrap">{p.fulfilled_at ? `Updated ${formatDateTime(p.fulfilled_at)}` : pkgOf(p) === 'digital' ? 'No card to print' : 'Not started'}</p>
                          </td>
                          <td>
                            <div className="flex gap-1.5 flex-wrap max-w-[250px]">
                              <button onClick={() => copyLink(p.username)} title="Copy link" aria-label="Copy link" className="ac-icon"><i className="fa-regular fa-copy" /></button>
                              <button onClick={() => window.open(`/${p.username}`, '_blank', 'noopener')} title="Open live profile" aria-label="Open live profile" className="ac-icon ac-icon-open"><i className="fa-solid fa-arrow-up-right-from-square" /></button>
                              <button onClick={() => handleEdit(p)} title="Edit client" aria-label="Edit client" className="ac-icon ac-icon-blue"><i className="fa-solid fa-pen" /></button>
                              <button onClick={() => handleDeleteConfirm(p)} title="Delete or deactivate client" aria-label="Delete client" className="ac-icon ac-icon-red"><i className="fa-solid fa-trash" /></button>
                              <button onClick={() => handleGenerateQR(p)} title="Generate QR" aria-label="Generate QR" className="ac-icon ac-icon-gold"><i className="fa-solid fa-qrcode" /></button>
                              <button onClick={() => { if (!openInvoice(p)) showToast('Allow pop-ups to open the invoice') }} title="Download PDF invoice" aria-label="Download PDF invoice" className="ac-icon"><i className="fa-solid fa-file-pdf" /></button>
                              <button onClick={() => sendLink(p)} title="Send link by email" aria-label="Send link by email" className="ac-icon"><i className="fa-solid fa-paper-plane" /></button>
                              {p.is_active === false ? (
                                <button onClick={() => handleSetActive(p, true)} className="ac-mini ac-mini-gold">Restore</button>
                              ) : next && (
                                <button onClick={() => setFulfillment(p, next)} className="ac-mini ac-mini-gold">Mark {next.toUpperCase()} →</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
        ) : (
        <>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">TapVinci Admin - All Clients</h1>
            <p className="text-sm text-gray-400 mt-1">{stats.total} total clients</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className="h-10 px-4 inline-flex items-center rounded-full bg-[#2A2A2A] text-sm hover:bg-[#333]">Dashboard</Link>
            <button onClick={fetchProfiles} className="h-10 px-4 rounded-full bg-[#2A2A2A] text-sm hover:bg-[#333]">Refresh</button>
            <button onClick={exportCsv} disabled={!filtered.length} className="h-10 px-4 rounded-full bg-[#2A2A2A] text-sm hover:bg-[#333] disabled:opacity-40">Export CSV</button>
            <button onClick={logout} className="h-10 px-4 rounded-full border border-[#2A2A2A] text-sm text-gray-400 hover:text-white">Log out</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#121214] border border-[#2A2A2A] rounded-2xl p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">Total Clients</p>
            <p className="text-3xl font-bold text-[#D4AF37] mt-1">{stats.total}</p>
          </div>
          <div className="bg-[#121214] border border-[#2A2A2A] rounded-2xl p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">This Month</p>
            <p className="text-3xl font-bold mt-1">{stats.thisMonth}</p>
          </div>
          <div className="bg-[#121214] border border-[#2A2A2A] rounded-2xl p-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">With Payment QR</p>
            <p className="text-3xl font-bold mt-1">{stats.withQR}</p>
          </div>
        </div>

        <input
          placeholder="Search Username, Name, Email, Phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md h-11 bg-[#1E1E20] border border-[#2A2A2A] focus:border-[#D4AF37] outline-none rounded-xl px-3 text-sm mb-2"
        />
        <p className="text-[11px] text-gray-500 mb-4">Showing {filtered.length} of {profiles.length}. Click a column heading to sort.</p>

        {loadError && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3" role="alert">
            Could not load profiles: {loadError}
          </div>
        )}

        <div className="bg-[#121214] border border-[#2A2A2A] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="admin-th-sort" onClick={() => toggleSort(c.key)} scope="col">
                      {c.label}{sortKey === c.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                  <th scope="col">View Profile</th>
                  <th className="admin-th-sort" onClick={() => toggleSort('created_at')} scope="col">
                    Date{sortKey === 'created_at' ? (sortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center text-gray-500 !py-8">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-gray-500 !py-8">{profiles.length ? 'No clients match your search.' : 'No clients yet.'}</td></tr>
                ) : (
                  filtered.map((profile) => (
                    <tr key={profile.username}>
                      <td className="font-bold text-[#D4AF37]">{profile.username}{profile.is_active === false && <span className="ml-2 text-[9px] font-semibold bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.5 rounded align-middle">INACTIVE</span>}</td>
                      <td>{displayName(profile) || '-'}</td>
                      <td className="text-gray-400">{profile.phone || '-'}</td>
                      <td className="text-gray-400">{profile.email || '-'}</td>
                      <td><span className="text-[11px] bg-[#2A2A2A] px-2 py-1 rounded-full whitespace-nowrap">{themeLabel(profile)}</span></td>
                      <td>
                        <Link href={`/${profile.username}`} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline text-xs whitespace-nowrap">
                          View → /{profile.username}
                        </Link>
                      </td>
                      <td className="text-gray-500 whitespace-nowrap">{formatDate(profile.created_at)}</td>
                      <td>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => copyLink(profile.username)} className="text-[11px] bg-[#2A2A2A] hover:bg-[#333] px-2.5 py-1.5 rounded whitespace-nowrap">Copy Link</button>
                          <button onClick={() => window.open(`/${profile.username}`, '_blank', 'noopener')} className="text-[11px] bg-[#E8C766] hover:bg-[#D4AF37] text-black font-semibold px-2.5 py-1.5 rounded">Open</button>
                          <button onClick={() => handleEdit(profile)} title="Edit client" className="text-[11px] bg-[#1E1E20] border border-[#2563eb]/50 text-[#60a5fa] hover:bg-[#2563eb]/20 font-semibold px-2.5 py-1.5 rounded transition">Edit</button>
                          <button onClick={() => handleDeleteConfirm(profile)} title="Delete or deactivate client" className="text-[11px] bg-[#1E1E20] border border-[#ef4444]/50 text-[#f87171] hover:bg-[#ef4444]/20 font-semibold px-2.5 py-1.5 rounded transition">Delete</button>
                          <button onClick={() => handleGenerateQR(profile)} title="Generate QR" className="text-[11px] bg-[#121214] border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-semibold px-2.5 py-1.5 rounded transition">
                            <i className="fa-solid fa-qrcode mr-1"></i>QR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== REVIEWS SECTION - APPENDED FOR REVIEW SYSTEM - APPLE LUXURY ===== */}
        <div className="mt-12">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold">TapVinci Reviews</h2>
              <p className="text-sm text-gray-400 mt-1">
                {reviewsStats.total} total • {reviewsStats.avg} avg rating • {reviewsStats.fiveStar} five-star • <span className="text-[#D4AF37]">Premium social proof</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchReviews} className="h-10 px-4 rounded-full bg-[#2A2A2A] text-sm hover:bg-[#333]">Refresh Reviews</button>
              <a href="/reviews" target="_blank" className="h-10 px-4 inline-flex items-center rounded-full bg-[#E8C766] text-black font-bold text-sm">View Reviews Page →</a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#121214] border border-[#2A2A2A] rounded-2xl p-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-widest">Total Reviews</p>
              <p className="text-3xl font-bold text-[#D4AF37] mt-1">{reviewsStats.total}</p>
            </div>
            <div className="bg-[#121214] border border-[#2A2A2A] rounded-2xl p-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-widest">Average Rating</p>
              <p className="text-3xl font-bold mt-1">{reviewsStats.avg} <span className="text-[#D4AF37] text-xl">★</span></p>
            </div>
            <div className="bg-[#121214] border border-[#2A2A2A] rounded-2xl p-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-widest">Five Stars</p>
              <p className="text-3xl font-bold mt-1">{reviewsStats.fiveStar}</p>
            </div>
          </div>

          <input
            placeholder="Search reviews by name, comment, rating..."
            value={reviewsSearch}
            onChange={(e) => setReviewsSearch(e.target.value)}
            className="w-full max-w-md h-11 bg-[#1E1E20] border border-[#2A2A2A] focus:border-[#D4AF37] outline-none rounded-xl px-3 text-sm mb-2"
          />
          <p className="text-[11px] text-gray-500 mb-4">Showing {filteredReviews.length} of {reviews.length} reviews. Gold stars = premium.</p>

          <div className="bg-[#121214] border border-[#2A2A2A] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsLoading ? (
                    <tr><td colSpan={5} className="text-center text-gray-500 !py-8">Loading reviews...</td></tr>
                  ) : filteredReviews.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-gray-500 !py-8">{reviews.length ? 'No reviews match search.' : 'No reviews yet. Share /reviews to get first review.'}</td></tr>
                  ) : (
                    filteredReviews.map((r) => (
                      <tr key={r.id}>
                        <td className="font-bold text-white">{r.name}</td>
                        <td>
                          <span className="text-[#D4AF37]">
                            {'★'.repeat(r.rating)}<span className="text-[#2A2A2A]">{'★'.repeat(5 - r.rating)}</span>
                          </span>
                          <span className="ml-2 text-xs text-gray-400">({r.rating})</span>
                        </td>
                        <td className="text-gray-300 max-w-xs truncate" title={r.comment}>{r.comment}</td>
                        <td className="text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                        <td>
                          <button onClick={() => handleDeleteReview(r.id)} className="text-[11px] bg-[#1E1E20] border border-[#ef4444]/50 text-[#f87171] hover:bg-[#ef4444]/20 font-semibold px-2.5 py-1.5 rounded transition">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* ===== ADMIN EDIT MODAL ===== */}
      {editingProfile && (
        <div className="admin-edit-modal" onClick={() => setEditingProfile(null)} role="dialog" aria-modal="true" aria-label={`Edit ${editingProfile.username}`}>
          <div className="admin-edit-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Edit {editingProfile.username}</h3>
              <button onClick={() => setEditingProfile(null)} aria-label="Close" className="w-8 h-8 bg-[#1E1E20] rounded-full flex items-center justify-center text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              {EDIT_FIELDS.map((fld) => (
                <label key={fld.key} className="block text-[10px] uppercase tracking-widest text-gray-500">
                  {fld.label}
                  {fld.rows ? (
                    <textarea
                      rows={fld.rows}
                      value={editForm[fld.key]}
                      onChange={(e) => setEditForm((p) => ({ ...p, [fld.key]: e.target.value }))}
                      className="w-full mt-1 bg-[#1E1E20] border border-[#2A2A2A] focus:border-[#D4AF37] outline-none rounded-[10px] p-3 text-[13px] normal-case tracking-normal text-white"
                    />
                  ) : (
                    <input
                      value={editForm[fld.key]}
                      onChange={(e) => setEditForm((p) => ({ ...p, [fld.key]: e.target.value }))}
                      className="w-full mt-1 h-10 bg-[#1E1E20] border border-[#2A2A2A] focus:border-[#D4AF37] outline-none rounded-[10px] px-3 text-[13px] normal-case tracking-normal text-white"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setEditingProfile(null)} className="h-[44px] bg-[#1E1E20] border border-[#2A2A2A] rounded-[12px] text-white text-sm">Cancel</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="h-[44px] bg-[#E8C766] hover:bg-[#D4AF37] text-black rounded-[12px] font-bold text-sm disabled:opacity-50">{savingEdit ? 'Saving...' : 'Save Changes'}</button>
            </div>
            <p className="text-[10px] text-gray-500 mt-3 text-center">Need photos, gallery, theme or payment QR? <a href={`/dashboard?edit=${encodeURIComponent(editingProfile.username)}`} className="text-[#D4AF37] underline">Open full dashboard editor →</a></p>
          </div>
        </div>
      )}

      {/* ===== ADMIN DELETE / DEACTIVATE MODAL ===== */}
      {deleteConfirm && (
        <div className="admin-delete-modal" onClick={() => !busyAction && setDeleteConfirm(null)} role="dialog" aria-modal="true" aria-label={`Delete ${deleteConfirm.username}`}>
          <div className="admin-delete-card" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#ef4444]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#ef4444] font-bold">!</div>
            <h3 className="text-white font-bold text-[16px]">Delete {deleteConfirm.username}?</h3>
            <p className="text-gray-400 text-[12px] mt-2">Their live link /{deleteConfirm.username} will stop working and their uploaded photos will be removed. This cannot be undone.</p>
            <div className="bg-[#1E1E20] rounded-[12px] p-3 mt-4 text-left text-[11px]">
              <p className="text-white">{displayName(deleteConfirm) || deleteConfirm.username}</p>
              <p className="text-gray-400">{deleteConfirm.email || '-'} • {deleteConfirm.phone || '-'}</p>
              <p className="text-gray-500 text-[10px] mt-1">Created: {formatDate(deleteConfirm.created_at)}</p>
            </div>
            {PROTECTED_USERNAMES.includes((deleteConfirm.username || '').toString().toLowerCase()) && (
              <p className="text-[11px] text-[#FFC21C] mt-3">Protected demo account: permanent delete is blocked. Use Deactivate below if you need to hide it.</p>
            )}
            <label className="block text-left text-[10px] uppercase tracking-widest text-gray-500 mt-4">
              Type <span className="text-white font-bold normal-case tracking-normal">{deleteConfirm.username}</span> to confirm
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                autoComplete="off"
                className="w-full mt-1 h-10 bg-[#1E1E20] border border-[#2A2A2A] focus:border-[#ef4444] outline-none rounded-[10px] px-3 text-[13px] normal-case tracking-normal text-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setDeleteConfirm(null)} disabled={busyAction} className="h-[44px] bg-[#1E1E20] border border-[#2A2A2A] rounded-[12px] text-white text-sm">Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={busyAction || deleteText.trim().toLowerCase() !== deleteConfirm.username.toLowerCase()}
                className="h-[44px] bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-[12px] font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busyAction ? 'Working...' : 'Delete Permanently'}
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-[#1E1E20]">
              <p className="text-[10px] text-gray-500">{deleteConfirm.is_active === false ? 'This profile is currently deactivated.' : 'Alternative: hide the profile but keep all data.'}</p>
              {deleteConfirm.is_active === false ? (
                <button onClick={() => handleSetActive(deleteConfirm, true)} disabled={busyAction} className="mt-2 text-[11px] text-[#22c55e] underline">Reactivate (make live again) →</button>
              ) : (
                <button onClick={() => handleSetActive(deleteConfirm, false)} disabled={busyAction} className="mt-2 text-[11px] text-[#f59e0b] underline">Deactivate (hide but keep data) →</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== ADMIN QR GENERATOR MODAL ===== */}
      {showQRModal && selectedProfile && (
        <div className="admin-qr-modal" onClick={closeQR} role="dialog" aria-modal="true" aria-label={`QR code for ${selectedProfile.username}`}>
          <div className="admin-qr-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">QR Code - {selectedProfile.username}</h3>
              <button onClick={closeQR} aria-label="Close" className="w-8 h-8 bg-[#1E1E20] rounded-full flex items-center justify-center text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-gray-400 mb-3 break-all">{qrUrl}</p>

            <div className="admin-qr-print">
              <div className="admin-qr-white-box">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=0&format=png&data=${encodeURIComponent(qrUrl)}`}
                  alt={`QR code for ${qrUrl}`}
                  width={228}
                  height={228}
                  className="w-full h-full"
                />
              </div>
              <p className="text-[11px] text-[#D4AF37] mt-3 uppercase tracking-widest admin-qr-caption">{displayName(selectedProfile) || selectedProfile.username} • {themeLabel(selectedProfile)}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Scan to view profile • For NFC card printing</p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => { navigator.clipboard.writeText(qrUrl).then(() => showToast('Link copied!'), () => showToast('Copy failed')) }} className="h-11 bg-[#2A2A2A] text-white rounded-xl text-sm border border-[#2A2A2A] hover:border-[#D4AF37]/50">
                Copy Link
              </button>
              <button onClick={downloadQR} className="h-11 bg-[#E8C766] text-black rounded-xl text-sm font-bold hover:bg-[#D4AF37]">
                Download QR
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button onClick={() => window.open(qrUrl, '_blank', 'noopener')} className="h-11 bg-[#1E1E20] text-white rounded-xl text-sm border border-[#2A2A2A] hover:border-[#D4AF37]/50">
                View Profile →
              </button>
              <button onClick={() => window.print()} className="h-11 bg-[#1E1E20] text-white rounded-xl text-sm border border-[#2A2A2A] hover:border-[#D4AF37]/50">
                Print QR
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1E1E20]">
              <p className="text-[11px] text-gray-500">Use this QR for:</p>
              <p className="text-[11px] text-gray-400 mt-1">• Printing on NFC cards • Stickers • Table tents • Client handout</p>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="success-toast" role="status">{toast}</div>}
    </div>
  )
}
