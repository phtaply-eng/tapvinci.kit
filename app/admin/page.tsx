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

  // restore a previous login for this browser tab
  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTH_KEY) === '1') setIsAuthed(true)
    } catch {}
    setChecked(true)
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
    } else {
      setAuthError('Wrong password.')
    }
  }

  const logout = () => {
    setIsAuthed(false)
    setProfiles([])
    try { sessionStorage.removeItem(AUTH_KEY) } catch {}
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

  const exportCsv = () => {
    const header = ['username', 'name', 'phone', 'email', 'theme', 'created_at', 'link']
    const lines = filtered.map((p) =>
      [p.username, displayName(p), p.phone, p.email, themeLabel(p), p.created_at, `${SITE_URL}/${p.username}`].map(csvCell).join(',')
    )
    const blob = new Blob([[header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tapvinci-clients-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showToast(`Exported ${filtered.length} clients`)
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
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
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
