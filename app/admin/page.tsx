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
  [key: string]: any
}

type SortKey = 'username' | 'name' | 'phone' | 'email' | 'theme' | 'created_at'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'theme', label: 'Theme' },
]

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

  // QR generator modal
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Row | null>(null)
  const [qrUrl, setQrUrl] = useState('')

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

  useEffect(() => {
    if (isAuthed) fetchProfiles()
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
                      <td className="font-bold text-[#D4AF37]">{profile.username}</td>
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
                        <div className="flex gap-2">
                          <button onClick={() => copyLink(profile.username)} className="text-[11px] bg-[#2A2A2A] hover:bg-[#333] px-2.5 py-1.5 rounded whitespace-nowrap">Copy Link</button>
                          <button onClick={() => window.open(`/${profile.username}`, '_blank', 'noopener')} className="text-[11px] bg-[#E8C766] hover:bg-[#D4AF37] text-black font-semibold px-2.5 py-1.5 rounded">Open</button>
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
      </div>

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
