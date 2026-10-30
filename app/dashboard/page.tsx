'use client'
import { useState, useEffect, useRef } from 'react'
import TaplyTemplate from '../../components/TaplyTemplate'
import { supabase } from '../../lib/supabase'

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

export default function Dashboard() {
  const [profile, setProfile] = useState<any>({
    username: 'TapVinci',
    name: 'TapVinci',
    title: 'INTRODUCTIONS, REDEFINED • A NEW WAY TO CONNECT • PHILIPPINES 2026',
    bio: 'A simple tap. A smarter introduction. TapVinci turns calling cards into digital profiles where your contact details and links are easy to access and share.',
    about: "TapVinci Help professionals and local businesses get noticed - through NFC digital business cards that share contacts and links instantly. TapVinci goal is simple: make it personal, modern, and easy to share.",
    hero_image: 'hero.png',
    avatar_url: '',
    photoFocus: 'center 30%',
    phone: '+63 908 327 4971',
    email: 'tapvinci@yahoo.com',
    address: 'Quezon City, Philippines',
    mapsLink: 'https://maps.app.goo.gl/9JxYrjC499aCfgxW7',
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const load = async () => {
      const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME || 'TapVinci'
const { data } = await supabase.from('profiles').select('*').eq('username', DEFAULT_USERNAME).single()
      if (data) {
        const mergedSocials = { ...DEFAULT_SOCIALS, ...(data.socials || {}) }
        const mergedVisible = { ...DEFAULT_VISIBLE, ...(data.socials_visible || {}) }
        setProfile((p:any) => ({ ...p, ...data, socials: mergedSocials, socials_visible: mergedVisible }))
      }
    }
    load()
  }, [])

  const uploadToSupabase = async (file: File, folder: string = 'gallery'): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const { data, error } = await supabase.storage.from('images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
    if (error) {
      alert('Upload failed: ' + error.message + '\nMake sure you ran create_storage_bucket.sql in Supabase SQL Editor')
      return null
    }
    const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(fileName)
    return publicUrl.publicUrl
  }

  const handleHeroFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    setHeroUploading(true)
    const url = await uploadToSupabase(file, 'heroes')
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
    const url = await uploadToSupabase(file, 'payments')
    setGcashUploading(false)
    if (url) setProfile((p:any) => ({ ...p, gcash_qr_url: url }))
  }

  const handleMayaFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    setMayaUploading(true)
    const url = await uploadToSupabase(file, 'payments')
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

  const save = async () => {
    setSaving(true)
    const fixed = { ...profile, username: profile.username.toLowerCase() }
    const { error } = await supabase.from('profiles').upsert(fixed, { onConflict: 'username' })
    setSaving(false)
    if (error) alert(error.message)
    else {
      const visibleCount = SOCIALS_CONFIG.filter(s => profile.socials_visible[s.key] && profile.socials[s.key]?.trim()).length
      alert(`Saved! ${visibleCount} social buttons visible, gallery ${profile.gallery?.length || 0} photos, theme ${profile.theme}`)
    }
  }

  const inputCls = "w-full mt-1 p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-[#D4AF37] outline-none text-sm"
  const activeSocialCount = SOCIALS_CONFIG.filter(s => profile.socials_visible[s.key] && profile.socials[s.key]?.trim()).length

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4 bg-zinc-900 p-6 rounded-2xl h-fit max-h-[95vh] overflow-y-auto">
          <h1 className="text-xl font-bold">Edit Profile</h1>
          
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
              <div className="text-2xl mb-1">🖼️</div>
              <p className="text-xs text-white font-semibold">{galleryUploading ? 'Uploading...' : 'Drop images here'}</p>
              <p className="text-[11px] text-zinc-400">or click to pick from computer — multiple allowed</p>
            </div>
            {profile.gallery && profile.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {profile.gallery.map((item:any, idx:number) => (
                  <div key={idx} className="relative group">
                    <img src={typeof item === 'string' ? item : item.src} alt={`Gallery ${idx+1}`} className="w-full h-20 rounded-lg object-cover border border-zinc-700" />
                    <button onClick={() => removeGalleryItem(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100">×</button>
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
            <p className="text-[11px] text-zinc-500">👁️ Show = visible, 🙈 Hide = hidden but saved. Order matches Live Preview.</p>
            
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

          {/* 8. PAYMENT QR CODES - Put at very bottom, before Save */}
          <div className="space-y-4 border-t border-zinc-800 pt-6">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[1px] text-[#9CA3AF] font-bold flex items-center gap-2">
                  <i className="fa-solid fa-qrcode text-[#D4AF37]"></i> Payment QR Codes
                </p>
                <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full">{(profile.socials_visible.gcash_qr !== false ? 1 : 0) + (profile.socials_visible.maya_qr !== false ? 1 : 0)} visible</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">👁️ Show = visible, 🙈 Hide = hidden but saved</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GCASH */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">GCash QR {profile.socials_visible.gcash_qr !== false ? <span className="text-[9px] bg-green-500/20 px-1.5 py-0.5 rounded text-green-300 ml-2">VISIBLE</span> : <span className="text-[9px] bg-red-500/20 px-1.5 py-0.5 rounded text-red-300 ml-2">HIDDEN</span>}</p>
                  <button onClick={() => toggleVisibility('gcash_qr')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${profile.socials_visible.gcash_qr !== false ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}><i className={`fa-solid ${profile.socials_visible.gcash_qr !== false ? 'fa-eye' : 'fa-eye-slash'}`}></i>{profile.socials_visible.gcash_qr !== false ? 'Show' : 'Hide'}</button>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOverGcash(true) }}
                  onDragLeave={() => setDragOverGcash(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOverGcash(false); handleGcashFiles(e.dataTransfer.files) }}
                  onClick={() => gcashInputRef.current?.click()}
                  className={`group relative w-full rounded-[16px] border border-dashed p-4 cursor-pointer text-center transition-all h-[160px] flex flex-col items-center justify-center overflow-hidden ${dragOverGcash ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10' : 'border-[#2A2A2A] bg-[#1E1E20] hover:border-[#D4AF37]/50'}`}
                >
                  <input ref={gcashInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(e) => handleGcashFiles(e.target.files)} />
                  {profile.gcash_qr_url ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img src={profile.gcash_qr_url} alt="GCash QR" className="w-[120px] h-[120px] object-contain bg-white rounded-[12px] p-2 shadow-lg" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-[16px] transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full">Change</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setProfile((p:any) => ({ ...p, gcash_qr_url: '' })) }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white hover:bg-red-500 flex items-center justify-center text-xs">×</button>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-2">
                        <i className="fa-solid fa-qrcode text-zinc-400"></i>
                      </div>
                      <p className="text-[12px] font-bold text-white">{gcashUploading ? 'Uploading...' : 'Drop GCash QR here'}</p>
                      <p className="text-[10px] text-[#6B7280] mt-1">GCash QR will show in Payment modal</p>
                    </>
                  )}
                </div>
                <p className="text-[9px] text-zinc-500">/gcash-qr.png (Upload your GCash QR)</p>
              </div>

              {/* MAYA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">Maya QR {profile.socials_visible.maya_qr !== false ? <span className="text-[9px] bg-green-500/20 px-1.5 py-0.5 rounded text-green-300 ml-2">VISIBLE</span> : <span className="text-[9px] bg-red-500/20 px-1.5 py-0.5 rounded text-red-300 ml-2">HIDDEN</span>}</p>
                  <button onClick={() => toggleVisibility('maya_qr')} className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${profile.socials_visible.maya_qr !== false ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}><i className={`fa-solid ${profile.socials_visible.maya_qr !== false ? 'fa-eye' : 'fa-eye-slash'}`}></i>{profile.socials_visible.maya_qr !== false ? 'Show' : 'Hide'}</button>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOverMaya(true) }}
                  onDragLeave={() => setDragOverMaya(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOverMaya(false); handleMayaFiles(e.dataTransfer.files) }}
                  onClick={() => mayaInputRef.current?.click()}
                  className={`group relative w-full rounded-[16px] border border-dashed p-4 cursor-pointer text-center transition-all h-[160px] flex flex-col items-center justify-center overflow-hidden ${dragOverMaya ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10' : 'border-[#2A2A2A] bg-[#1E1E20] hover:border-[#D4AF37]/50'}`}
                >
                  <input ref={mayaInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(e) => handleMayaFiles(e.target.files)} />
                  {profile.maya_qr_url ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img src={profile.maya_qr_url} alt="Maya QR" className="w-[120px] h-[120px] object-contain bg-white rounded-[12px] p-2 shadow-lg" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-[16px] transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full">Change</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setProfile((p:any) => ({ ...p, maya_qr_url: '' })) }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white hover:bg-red-500 flex items-center justify-center text-xs">×</button>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-2">
                        <i className="fa-solid fa-qrcode text-zinc-400"></i>
                      </div>
                      <p className="text-[12px] font-bold text-white">{mayaUploading ? 'Uploading...' : 'Drop Maya QR here'}</p>
                      <p className="text-[10px] text-[#6B7280] mt-1">Maya QR will show when swiped</p>
                    </>
                  )}
                </div>
                <p className="text-[9px] text-zinc-500">/maya-qr.png (Upload your Maya QR)</p>
              </div>
            </div>
          </div>

          <button onClick={save} disabled={saving || heroUploading || galleryUploading || gcashUploading || mayaUploading} className="w-full py-3 rounded-xl font-bold hover:brightness-110 disabled:opacity-50" style={{background: profile.accent_color, color: 'black'}}>{saving ? 'Saving...' : 'Save Profile'}</button>
        </div>

        <div className="lg:sticky lg:top-4">
          <p className="mb-4 text-zinc-400 text-sm">Live Preview — Order Matches Edit Form:</p>
          <TaplyTemplate profile={profile} />
        </div>
      </div>
    </div>
  )
}
