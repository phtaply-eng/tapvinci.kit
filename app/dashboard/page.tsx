'use client'
import { useState, useEffect, useRef } from 'react'
import TaplyTemplate from '../../components/TaplyTemplate'
import { supabase } from '../../lib/supabase'
import HamburgerMenu from "@/components/HamburgerMenu"

const DEFAULT_SOCIALS = {
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
  tiktok: 'https://www.tiktok.com/',
  messenger: 'https://m.me/',
  linkedin: '',
  youtube: '',
  whatsapp: '',
  website: ''
}

const DEFAULT_VISIBLE = {
  facebook: true,
  instagram: true,
  tiktok: true,
  messenger: true,
  linkedin: true,
  youtube: true,
  whatsapp: true,
  website: true,
  google_maps: true,
  call: true,
  text: true,
  email_btn: true,
  save_contact: true,
  share_card: true,
  gcash_qr: true,
  maya_qr: true
}

const SOCIALS_CONFIG = [
  { key: 'facebook', label: 'Facebook', color: 'text-blue-400', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', color: 'text-pink-400', placeholder: 'https://instagram.com/...' },
  { key: 'tiktok', label: 'TikTok', color: 'text-white', placeholder: 'https://tiktok.com/@...' },
  { key: 'messenger', label: 'Messenger', color: 'text-blue-400', placeholder: 'https://m.me/...' },
  { key: 'linkedin', label: 'LinkedIn', color: 'text-blue-300', placeholder: 'https://linkedin.com/in/...' },
  { key: 'youtube', label: 'YouTube', color: 'text-red-400', placeholder: 'https://youtube.com/@...' },
  { key: 'whatsapp', label: 'WhatsApp', color: 'text-green-400', placeholder: 'https://wa.me/639...' },
  { key: 'website', label: 'Website', color: 'text-zinc-400', placeholder: 'https://yourwebsite.com' },
]

const THEMES = [
  { id: 'gold', name: 'Black Gold', hex: '#D4AF37', desc: 'Default luxury' },
  { id: 'purple', name: 'Midnight Purple', hex: '#a855f7', desc: 'Creative / Tour' },
  { id: 'blue', name: 'Ocean Blue', hex: '#2563eb', desc: 'Professional' },
  { id: 'green', name: 'Forest Green', hex: '#22c55e', desc: 'Fresh / Nature' },
  { id: 'pink', name: 'Sunset Pink', hex: '#ec4899', desc: 'Bold / Creator' },
  { id: 'orange', name: 'Sunrise Orange', hex: '#f97316', desc: 'Energetic' },
]

// ---- Permanent image storage: Supabase Storage bucket "profile-images" ----
const BUCKET = 'profile-images'
const MAX_INPUT_BYTES = 20 * 1024 * 1024 // refuse absurdly large originals; stored files end up well under 1 MB

type UploadKind = 'hero' | 'gallery' | 'gcash' | 'maya'
// Gallery: 800px / 70% webp. Profile photo a bit larger; payment QRs kept sharp so they still scan.
const UPLOAD_OPTS: Record<UploadKind, { maxWidth: number; quality: number }> = {
  hero: { maxWidth: 1000, quality: 0.8 },
  gallery: { maxWidth: 800, quality: 0.7 },
  gcash: { maxWidth: 1000, quality: 0.92 },
  maya: { maxWidth: 1000, quality: 0.92 },
}

function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let width = img.naturalWidth
      let height = img.naturalHeight
      if (width > maxWidth) {
        height = Math.round((maxWidth / width) * height)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas not supported in this browser'))
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Could not compress the image'))
        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp' }))
      }, 'image/webp', quality)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read this image. Try a JPG or PNG.'))
    }
    img.src = objectUrl
  })
}

export default function Dashboard() {
  const [profile, setProfile] = useState<any>({
    username: 'TapVinci',
    name: 'TapVinci',
    title: 'A NEW STANDARD OF INTRODUCTION • MADE TO CONNECT • PHILIPPINES 2026 ',
    bio: 'A simple tap. A smarter introduction. TapVinci turns calling cards into digital profiles where your contact details and links are easy to access and share.',
    about: "TapVinci Help professionals and local businesses get noticed - through NFC digital business cards that share contacts and links instantly. TapVinci goal is simple: make it personal, modern, and easy to share.",
    hero_image: 'hero.png',
    avatar_url: '',
    photoFocus: 'center 30%',
    phone: '+63 908 327 4971',
    email: 'tapvinci@yahoo.com',
    address: 'Quezon City, Philippines',
    mapsLink: 'https://maps.app.goo.gl/Rz2wrV8uDwbg4qox7',
    accent_color: '#D4AF37',
    theme: 'gold',
    galleryTitle: 'Gallery',
    gallerySubtitle: '',
    gallery: [],
    socials: { ...DEFAULT_SOCIALS },
    socials_visible: { ...DEFAULT_VISIBLE },
    gcash_qr_url: '',
    maya_qr_url: '',
    gcash_name: '',
    maya_name: '',
    gcash_number: '',
    maya_number: '',
  })
  const [saving, setSaving] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [gcashUploading, setGcashUploading] = useState(false)
  const [mayaUploading, setMayaUploading] = useState(false)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const gcashInputRef = useRef<HTMLInputElement>(null)
  const mayaInputRef = useRef<HTMLInputElement>(null)
  const [dragOverHero, setDragOverHero] = useState(false)
  const [dragOverGallery, setDragOverGallery] = useState(false)
  const [dragOverGcash, setDragOverGcash] = useState(false)
  const [dragOverMaya, setDragOverMaya] = useState(false)
  const [showLive, setShowLive] = useState(false)
  // After-save UX
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [liveUrl, setLiveUrl] = useState('')
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const livePreviewRef = useRef<HTMLDivElement>(null)
  const editTopRef = useRef<HTMLDivElement>(null)

  const scrollToLivePreview = () => {
    document.getElementById('live-preview-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const scrollToEditTop = () => {
    editTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  // Close the success modal with Esc
  useEffect(() => {
    if (!showSuccessModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSuccessModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showSuccessModal])

  useEffect(() => {
    const load = async () => {
      // /dashboard?edit=username (used by the Admin panel) loads that client; usernames are stored lowercase
      const editParam = (new URLSearchParams(window.location.search).get('edit') || '').trim().toLowerCase()
      const DEFAULT_USERNAME = (editParam || process.env.NEXT_PUBLIC_DEFAULT_USERNAME || 'TapVinci').toLowerCase()
const { data } = await supabase.from('profiles').select('*').eq('username', DEFAULT_USERNAME).single()
      if (data) {
        const mergedSocials = { ...DEFAULT_SOCIALS, ...(data.socials || {}) }
        const mergedVisible = { ...DEFAULT_VISIBLE, ...(data.socials_visible || {}) }
        setProfile((p:any) => ({ ...p, ...data, socials: mergedSocials, socials_visible: mergedVisible }))
      }
    }
    load()
  }, [])

  const uploadToSupabase = async (file: File, kind: UploadKind): Promise<string | null> => {
    const username = (profile.username || '').toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!username) {
      alert('Type a username first - photos are stored under it.')
      return null
    }
    if (file.size > MAX_INPUT_BYTES) {
      alert(`${file.name} is too large (max ${MAX_INPUT_BYTES / 1024 / 1024} MB).`)
      return null
    }
    try {
      const { maxWidth, quality } = UPLOAD_OPTS[kind]
      const compressed = await compressImage(file, maxWidth, quality)
      const safeName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) || 'photo'
      const stamp = Date.now()
      const isQR = kind === 'gcash' || kind === 'maya'
      const path =
        kind === 'hero' ? `${username}/avatar/${stamp}-avatar.webp`
        : kind === 'gallery' ? `${username}/gallery/${stamp}-${safeName}.webp`
        : `${username}/payment/${kind}-qr.webp`
      const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
        cacheControl: '3600',
        upsert: isQR, // QR keeps one fixed file name per client, so replacing it overwrites
        contentType: 'image/webp'
      })
      if (error) throw error
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      // fixed file name -> add a version so browsers/CDN do not show the old QR
      return isQR ? `${url}?v=${stamp}` : url
    } catch (err) {
      alert('Upload failed: ' + ((err as Error)?.message || 'unknown error') + '\nMake sure you ran the profile-images SQL in Supabase.')
      return null
    }
  }

  const handleHeroFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    setHeroUploading(true)
    const url = await uploadToSupabase(file, 'hero')
    setHeroUploading(false)
    if (url) setProfile((p:any) => ({ ...p, hero_image: url }))
  }

  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newItems: any[] = []
    setGalleryUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      const url = await uploadToSupabase(file, 'gallery')
      if (url) newItems.push({ src: url, alt: 'Gallery photo' })
    }
    setGalleryUploading(false)
    if (newItems.length > 0) {
      setProfile((p:any) => ({ ...p, gallery: [...(p.gallery || []), ...newItems] }))
    }
  }

  const handleGcashFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    setGcashUploading(true)
    const url = await uploadToSupabase(file, 'gcash')
    setGcashUploading(false)
    if (url) setProfile((p:any) => ({ ...p, gcash_qr_url: url }))
  }

  const handleMayaFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    setMayaUploading(true)
    const url = await uploadToSupabase(file, 'maya')
    setMayaUploading(false)
    if (url) setProfile((p:any) => ({ ...p, maya_qr_url: url }))
  }

  const removeGalleryItem = (idx: number) => {
    setProfile((p:any) => ({ ...p, gallery: p.gallery.filter((_:any, i:number) => i !== idx) }))
  }

  const toggleVisibility = (key: string) => {
    setProfile((p:any) => ({ ...p, socials_visible: { ...p.socials_visible, [key]: !p.socials_visible[key] } }))
  }

  const clearSocial = (key: string) => {
    setProfile((p:any) => ({ ...p, socials: { ...p.socials, [key]: '' } }))
  }

  // Public site base URL. Set NEXT_PUBLIC_SITE_URL in Vercel (e.g. https://tapvinci.vercel.app) to change it.
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tapvinci.vercel.app').replace(/\/+$/, '')

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied!')
    } catch {
      showToast('Copy failed - select the link and copy it manually')
    }
  }

  // 500x500 PNG of the live link. Uses the free qrserver.com API (no npm package needed).
  const downloadQR = async (url: string) => {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&format=png&data=${encodeURIComponent(url)}`
    try {
      const res = await fetch(qrApiUrl)
      if (!res.ok) throw new Error('QR request failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      const objectUrl = URL.createObjectURL(blob)
      a.href = objectUrl
      a.download = `${profile.username.toLowerCase()}-tapvinci-qr.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
      showToast('QR downloaded')
    } catch {
      // Fallback: open the image so it can be saved manually
      window.open(qrApiUrl, '_blank', 'noopener')
      showToast('Opened QR in a new tab - right-click to save')
    }
  }

  const save = async () => {
    setSaving(true)
    const fixedUsername = profile.username.trim().toLowerCase()
    const { id, created_at, ...rest } = profile
    const fixed = { ...rest, username: fixedUsername }
    // new client or returning client? decides the email subject
    let isNewProfile = true
    try {
      const { data: existing } = await supabase.from('profiles').select('username').eq('username', fixed.username).maybeSingle()
      isNewProfile = !existing
    } catch {}
    const { error } = await supabase.from('profiles').upsert(fixed, { onConflict: 'username' }).select()
    setSaving(false)
    if (error) {
      showToast('Failed to save: ' + error.message)
    } else {
      const url = `${SITE_URL}/${encodeURIComponent(fixed.username)}`
      setLiveUrl(url)
      setShowSuccessModal(true)
      // Email the admin (fire-and-forget: the modal never waits for it, and a failure never blocks saving)
      try {
        fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: fixed.username, type: isNewProfile ? 'created' : 'updated' }),
          keepalive: true,
        }).catch(() => {})
      } catch {}
    }
  }

  const inputCls = "w-full mt-1 p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-[#D4AF37] outline-none text-sm"
  const activeSocialCount = SOCIALS_CONFIG.filter(s => profile.socials_visible[s.key] && profile.socials[s.key]?.trim()).length
  return (
    <>
      <HamburgerMenu />
      <button onClick={() => setShowLive(!showLive)} className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 w-[44px] h-[44px] rounded-full items-center justify-center transition-all hover:scale-110 active:scale-95 group" style={{ background: 'rgba(18,18,20,0.9)', border: '1px solid #D4AF37', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(212,175,55,0.25)' }}>
        <i className={`fa-solid ${showLive ? 'fa-pen' : 'fa-arrow-down'} text-[#D4AF37] text-[14px]`}></i>
      </button>
      <button onClick={() => setShowLive(!showLive)} className="md:hidden fixed right-4 bottom-6 z-40 rounded-full px-5 py-3 text-[11px] font-bold tracking-[0.15em] uppercase shadow-xl" style={{ background: showLive ? '#1E1E20' : '#D4AF37', color: showLive ? '#F5F1E8' : '#050505' }}>
        {showLive ? 'Edit ↑' : 'Preview ↓'}
      </button>
      <div className="min-h-screen bg-[#050505] text-white p-4">
        <div className="dashboard-slider-wrapper overflow-hidden w-full">
          <div className="dashboard-slider flex w-[200%] will-change-transform" style={{ transform: showLive ? 'translateX(-50%)' : 'translateX(0)', transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
            <div className="w-[50%] flex-shrink-0 px-1 lg:px-3">
              <div className="max-w-7xl mx-auto">
<div ref={editTopRef} className="space-y-4 bg-zinc-900 p-6 rounded-2xl h-fit max-h-[95vh] overflow-y-auto scroll-mt-24 order-2 lg:order-2">
          <div className="flex items-center justify-between gap-3 mr-14">
            <h1 className="text-xl font-bold">Edit Profile</h1>
            <button
              onClick={() => setShowLive(true)}
              className="rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-all hover:brightness-110 active:scale-[0.98] shrink-0"
              style={{ background: '#D4AF37', color: '#050505' }}
            >
              View Live Preview ↓
            </button>
          </div>
          
          {/* 1. USERNAME */}
          <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Username<input value={profile.username} onChange={e => setProfile({...profile, username: e.target.value.toLowerCase()})} className={inputCls} /></label>

          {/* 2. NAME */}
          <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Name<input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className={inputCls} /></label>
          
          {/* 3. PROFILE PHOTO */}
          <div className="space-y-2">
            <p className="text-[11px] tracking-widest text-zinc-400 uppercase">Profile Photo</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverHero(true) }}
              onDragLeave={() => setDragOverHero(false)}
              onDrop={(e) => { e.preventDefault(); setDragOverHero(false); handleHeroFiles(e.dataTransfer.files) }}
              onClick={() => heroInputRef.current?.click()}
              className={`relative w-full rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all ${dragOverHero ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'}`}
            >
              <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroFiles(e.target.files)} />
              {profile.hero_image ? (
                <div className="flex items-center gap-3">
                  <img src={profile.hero_image} alt="Hero preview" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{heroUploading ? 'Uploading...' : 'Hero image set'}</p>
                    <p className="text-[11px] text-[#D4AF37] mt-1">Click or drag new image to replace</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="text-2xl mb-1">📸</div>
                  <p className="text-xs text-white font-semibold">{heroUploading ? 'Uploading...' : 'Drop profile photo here'}</p>
                  <p className="text-[11px] text-zinc-400">Logo will stay as hero banner</p>
                </div>
              )}
              {heroUploading && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center"><div className="text-[#D4AF37] text-xs">Uploading...</div></div>}
            </div>
            <p className="text-[9px] text-zinc-500">/hero.png (Upload your profile)</p>
          </div>

          {/* 3.5 THEME - After Profile Photo, Before Title per previous requirement */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold">Themes</p>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setProfile({...profile, accent_color: t.hex, theme: t.id})} className={`p-3 rounded-xl border-2 text-left ${profile.theme === t.id ? 'border-white scale-[1.02]' : 'border-zinc-700 hover:border-zinc-500'}`}>
                  <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full border border-white/20" style={{background: t.hex}}></div><span className="text-xs font-bold">{t.name}</span></div>
                  <p className="text-[10px] text-zinc-500 mt-1">{t.desc} • {t.hex}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. TITLE, BIO, ABOUT ME - Grouped like Hero + About */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold">Hero</p>
            <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Title<input value={profile.title} onChange={e => setProfile({...profile, title: e.target.value})} className={inputCls} placeholder="WEB DEVELOPER | TAPVINCI FOUNDER..." /></label>
            <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Bio<textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} rows={3} className={inputCls} placeholder="A simple tap. A smarter introduction..." /></label>
            <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">About Me<textarea value={profile.about} onChange={e => setProfile({...profile, about: e.target.value})} rows={4} className={inputCls} placeholder="Hi, I'm Shua, owner of TapVinci..." /></label>
          </div>

          {/* 5. GALLERY */}
          <div className="space-y-2 border-t border-zinc-800 pt-4">
            <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold">Gallery</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverGallery(true) }}
              onDragLeave={() => setDragOverGallery(false)}
              onDrop={(e) => { e.preventDefault(); setDragOverGallery(false); handleGalleryFiles(e.dataTransfer.files) }}
              onClick={() => galleryInputRef.current?.click()}
              className={`w-full rounded-xl border-2 border-dashed p-6 cursor-pointer text-center transition-all ${dragOverGallery ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'}`}
            >
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGalleryFiles(e.target.files)} />
              <div className="text-2xl mb-1">🖼</div>
              <p className="text-xs text-white font-semibold">{galleryUploading ? 'Uploading...' : 'Drop images here'}</p>
              <p className="text-[11px] text-zinc-400">or click to pick from computer — multiple allowed</p>
            </div>
            {profile.gallery && profile.gallery.length > 0 && (
              <div className="space-y-1 mt-2">
                <p className="text-[11px] text-[#D4AF37]">✓ {profile.gallery.length} image(s) saved - Visible in Live Preview</p>
                {profile.gallery.map((item:any, idx:number) => (
                  <div key={idx} className="flex items-center justify-between bg-[#1A1A1C] rounded-[8px] px-3 py-2 border border-dashed border-[#3a3a3c]">
                    <span className="text-[11px] text-zinc-400">/gallery-{idx+1}.webp</span>
                    <button onClick={() => removeGalleryItem(idx)} className="text-[11px] text-zinc-500 hover:text-red-400">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. SOCIALS - Facebook, Instagram, TikTok, Messenger, LinkedIn, YouTube, WhatsApp, Website with Show/Hide */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold">Social Links</p>
              <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full">{activeSocialCount} visible</span>
            </div>
            <p className="text-[11px] text-zinc-500">👁 Show = visible, 🙈 Hide = hidden but saved. Order matches Live Preview.</p>
            
            {SOCIALS_CONFIG.map(s => {
              const hasUrl = !!profile.socials[s.key]?.trim()
              const isVisible = profile.socials_visible[s.key]
              const willShow = hasUrl && isVisible
              return (
                <div key={s.key} className={`p-3 rounded-xl border transition-all ${willShow ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-800/50 border-zinc-800/50 opacity-75'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-bold ${s.color} flex items-center gap-2`}>
                      {s.label}
                      {!hasUrl && <span className="text-[9px] bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-400">EMPTY</span>}
                      {hasUrl && !isVisible && <span className="text-[9px] bg-red-500/20 px-1.5 py-0.5 rounded text-red-300">HIDDEN</span>}
                      {willShow && <span className="text-[9px] bg-green-500/20 px-1.5 py-0.5 rounded text-green-300">VISIBLE</span>}
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => toggleVisibility(s.key)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${isVisible ? 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'}`}
                      >
                        <i className={`fa-solid ${isVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        {isVisible ? 'Show' : 'Hide'}
                      </button>
                      {hasUrl && (
                        <button onClick={() => clearSocial(s.key)} className="px-2 py-1.5 rounded-full bg-zinc-700 text-[11px] text-zinc-300 hover:bg-zinc-600">×</button>
                      )}
                    </div>
                  </div>
                  <input 
                    value={profile.socials[s.key] || ''} 
                    onChange={e => setProfile({...profile, socials:{...profile.socials, [s.key]: e.target.value}})} 
                    className={inputCls + " mt-0"} 
                    placeholder={s.placeholder}
                  />
                </div>
              )
            })}
          </div>

          {/* 7. QUICK ACTIONS + CONTACT INFO - Phone, Email, Address, Google Maps with Show/Hide */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold">Quick Actions & Contact Info</p>
            <p className="text-[11px] text-zinc-500">Controls Quick Actions row + Contact section. Matches Live Preview order.</p>
            <div className="grid grid-cols-1 gap-3">
              <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Phone<input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className={inputCls} /></label>
              <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Email<input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className={inputCls} /></label>
              <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Address<input value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} className={inputCls} /></label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] tracking-widest text-zinc-400 uppercase">Google Maps Link</label>
                  <button
                    onClick={() => toggleVisibility('google_maps')}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${profile.socials_visible.google_maps !== false ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}
                  >
                    <i className={`fa-solid ${profile.socials_visible.google_maps !== false ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    {profile.socials_visible.google_maps !== false ? 'Show' : 'Hide'}
                  </button>
                </div>
                <input value={profile.mapsLink} onChange={e => setProfile({...profile, mapsLink: e.target.value})} className={inputCls} placeholder="https://maps.app.goo.gl/..." />
                <p className="text-[10px] text-zinc-500">{profile.socials_visible.google_maps !== false ? '✅ Google Maps button visible on profile' : '🙈 Google Maps hidden — address still saved but button hidden'}</p>
              </div>
            </div>
          </div>

          {/* 8. PAYMENT QR CODES - DESIRED: 2 drop zones */}
          <div className="space-y-4 border-t border-zinc-800 pt-6">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[1px] text-[#9CA3AF] font-bold flex items-center gap-2">
                  <i className="fa-solid fa-qrcode text-[#D4AF37]"></i> Payment QR Codes
                </p>
                <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full">{(profile.socials_visible.gcash_qr !== false ? 1 : 0) + (profile.socials_visible.maya_qr !== false ? 1 : 0)} visible</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">👁 Show = visible, 🙈 Hide = hidden but saved</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GCASH */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">GCash QR {profile.socials_visible.gcash_qr !== false ? <span className="text-[9px] bg-green-500/20 px-1.5 py-0.5 rounded text-green-300 ml-2">VISIBLE</span> : <span className="text-[9px] bg-red-500/20 px-1.5 py-0.5 rounded text-red-300 ml-2">HIDDEN</span>}</p>
                  <button onClick={() => toggleVisibility('gcash_qr')} className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${profile.socials_visible.gcash_qr !== false ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}><i className={`fa-solid ${profile.socials_visible.gcash_qr !== false ? 'fa-eye' : 'fa-eye-slash'}`}></i>{profile.socials_visible.gcash_qr !== false ? 'Show' : 'Hide'}</button>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOverGcash(true) }}
                  onDragLeave={() => setDragOverGcash(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOverGcash(false); handleGcashFiles(e.dataTransfer.files) }}
                  onClick={() => gcashInputRef.current?.click()}
                  className={`group w-full rounded-[12px] border border-dashed p-6 cursor-pointer text-center transition-all ${dragOverGcash ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#3a3a3c] bg-[#1A1A1C] hover:border-[#555]'}`}
                >
                  <input ref={gcashInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(e) => handleGcashFiles(e.target.files)} />
                  <div className="flex flex-col items-center">
                    {profile.gcash_qr_url ? (
                      <div className="relative">
                        <img src={profile.gcash_qr_url} alt="GCash" className="w-12 h-12 rounded-[8px] object-contain bg-white p-1" />
                        <div className="absolute inset-0 bg-black/60 rounded-[8px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><span className="text-[10px] text-white font-bold">Change</span></div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-2"><i className="fa-solid fa-qrcode text-zinc-400 text-[12px]"></i></div>
                    )}
                    <p className="text-[13px] font-semibold text-white mt-2">{gcashUploading ? 'Uploading...' : 'Drop GCash QR here'}</p>
                    <p className="text-[11px] text-[#8a8a8e] mt-1">GCash QR will show in Payment modal</p>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500">/gcash-qr.png (Upload your GCash QR)</p>
              </div>

              {/* MAYA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">Maya QR {profile.socials_visible.maya_qr !== false ? <span className="text-[9px] bg-green-500/20 px-1.5 py-0.5 rounded text-green-300 ml-2">VISIBLE</span> : <span className="text-[9px] bg-red-500/20 px-1.5 py-0.5 rounded text-red-300 ml-2">HIDDEN</span>}</p>
                  <button onClick={() => toggleVisibility('maya_qr')} className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${profile.socials_visible.maya_qr !== false ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}><i className={`fa-solid ${profile.socials_visible.maya_qr !== false ? 'fa-eye' : 'fa-eye-slash'}`}></i>{profile.socials_visible.maya_qr !== false ? 'Show' : 'Hide'}</button>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOverMaya(true) }}
                  onDragLeave={() => setDragOverMaya(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOverMaya(false); handleMayaFiles(e.dataTransfer.files) }}
                  onClick={() => mayaInputRef.current?.click()}
                  className={`group w-full rounded-[12px] border border-dashed p-6 cursor-pointer text-center transition-all ${dragOverMaya ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#3a3a3c] bg-[#1A1A1C] hover:border-[#555]'}`}
                >
                  <input ref={mayaInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(e) => handleMayaFiles(e.target.files)} />
                  <div className="flex flex-col items-center">
                    {profile.maya_qr_url ? (
                      <div className="relative">
                        <img src={profile.maya_qr_url} alt="Maya" className="w-12 h-12 rounded-[8px] object-contain bg-white p-1" />
                        <div className="absolute inset-0 bg-black/60 rounded-[8px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><span className="text-[10px] text-white font-bold">Change</span></div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-2"><i className="fa-solid fa-qrcode text-zinc-400 text-[12px]"></i></div>
                    )}
                    <p className="text-[13px] font-semibold text-white mt-2">{mayaUploading ? 'Uploading...' : 'Drop Maya QR here'}</p>
                    <p className="text-[11px] text-[#8a8a8e] mt-1">Maya QR will show when swiped</p>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500">/maya-qr.png (Upload your Maya QR)</p>
              </div>
            </div>
          </div>


          <button
            onClick={() => setShowLive(true)}
            type="button"
            className="w-full py-3.5 rounded-xl font-bold border text-[11px] uppercase tracking-[0.15em] transition-all hover:border-[#D4AF37] hover:text-[#D4AF37]"
            style={{ borderColor: '#2A2A2A', color: '#F5F1E8', background: 'transparent' }}
          >
            See Live Preview → Order Matches Edit Form ↓
          </button>

          <button onClick={save} disabled={saving || heroUploading || galleryUploading || gcashUploading || mayaUploading} className="w-full py-3 rounded-xl font-bold hover:brightness-110 disabled:opacity-50" style={{background: profile.accent_color, color: 'black'}}>{saving ? 'Saving...' : 'Save Profile'}</button>
        </div>
              </div>
            </div>
            <div className="w-[50%] flex-shrink-0 px-1 lg:px-3">
              <div className="max-w-7xl mx-auto">
                <div ref={livePreviewRef} id="live-preview-section" className="scroll-mt-24">
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <p className="text-zinc-400 text-sm font-bold tracking-wide">Live Preview — Order Matches Edit Form: <span className="text-[#D4AF37] text-[11px]">DEFAULT</span></p>
                    <button onClick={() => setShowLive(false)} className="rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] border bg-[#1E1E20]" style={{ borderColor: '#2A2A2A', color: '#F5F1E8' }}>↓ EDIT FORM</button>
                  </div>
                  <TaplyTemplate profile={profile} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showSuccessModal && (<div className="success-modal-overlay" onClick={() => setShowSuccessModal(false)}><div className="success-modal" onClick={e => e.stopPropagation()}><div className="success-check">✓</div><h3>Profile Saved!</h3><div className="live-url-box"><span>{liveUrl}</span><button onClick={() => copyLink(liveUrl)}>Copy</button></div><a href={liveUrl} target="_blank">View Live</a><button onClick={() => setShowSuccessModal(false)}>Close</button></div></div>)}
      {toast && <div className="success-toast">{toast}</div>}
    </>
  )
}