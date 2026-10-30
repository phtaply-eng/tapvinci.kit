'use client'
import { useState, useEffect, useRef } from 'react'
import TaplyTemplate from '../../components/TaplyTemplate'
import { supabase } from '../../lib/supabase'

const DEFAULT_SOCIALS = {
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com',
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
  website: true
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
    title: 'A NEW WAY TO CONNECT • PHILIPPINES 2026',
    bio: 'A simple tap. A smarter introduction. TapVinci turns calling cards into digital calling card profiles where your contact details and links are easy to access and share.',
    about: 'TapVinci help professionals and local businesses get noticed - through NFC digital business cards that share contacts and links instanty. TapVinci goal is simple: make it personal, modern, and easy to share.  ',
    hero_image: '/hero.png',
    avatar_url: '',
    photoFocus: 'center 30%',
    phone: '+63 908 327 4971',
    email: 'tapvinci@yahoo.com',
    address: ' Quezon City, Philippines', 
    mapsLink: '',
    accent_color: '#D4AF37',
    theme: 'gold',
    galleryTitle: 'Gallery',
    gallerySubtitle: '',
    gallery: [],
    socials: { ...DEFAULT_SOCIALS },
    socials_visible: { ...DEFAULT_VISIBLE },
  })
  
  const [gcashQR, setGcashQR] = useState('')
  const [mayaQR, setMayaQR] = useState('')
  const [gcashName, setGcashName] = useState('')
  const [gcashNumber, setGcashNumber] = useState('')
  const [mayaName, setMayaName] = useState('')
  const [mayaNumber, setMayaNumber] = useState('')
  const gcashInputRef = useRef<HTMLInputElement>(null)
  const mayaInputRef = useRef<HTMLInputElement>(null)
  const [originalUsername, setOriginalUsername] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [dragOverHero, setDragOverHero] = useState(false)
  const [dragOverGallery, setDragOverGallery] = useState(false)

  // Load if ?username=xxx is in URL - FIXED WITH QR LOAD
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const usernameFromUrl = params.get('username')
    if (!usernameFromUrl) return
    
    const load = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('username', usernameFromUrl.toLowerCase()).single()
      if (data) {
        const mergedSocials = { ...DEFAULT_SOCIALS, ...(data.socials || {}) }
        const mergedVisible = { ...DEFAULT_VISIBLE, ...(data.socials_visible || {}) }
        setProfile((p:any) => ({ ...p, ...data, socials: mergedSocials, socials_visible: mergedVisible }))
        setOriginalUsername(data.username)
        // LOAD QR FIELDS
        setGcashQR(data.gcash_qr_url || '')
        setMayaQR(data.maya_qr_url || '')
        setGcashName(data.gcash_name || '')
        setGcashNumber(data.gcash_number || '')
        setMayaName(data.maya_name || '')
        setMayaNumber(data.maya_number || '')
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
      alert('Upload failed: ' + error.message)
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
    const url = await uploadToSupabase(file, 'avatars')
    setHeroUploading(false)
    if (url) setProfile((p:any) => ({ ...p, avatar_url: url }))
  }

const handleGcashFiles = async (files: FileList | null) => {
  if (!files || files.length === 0) return
  const file = files[0]
  if (!file.type.startsWith('image/')) return
  setHeroUploading(true)
  const preview = URL.createObjectURL(file)
  setGcashQR(preview)
  const url = await uploadToSupabase(file, 'qr-codes')
  setHeroUploading(false)
  if (url) {
    setGcashQR(url)
    setProfile((p:any) => ({ ...p, gcash_qr_url: url }))
  }
}
const handleMayaFiles = async (files: FileList | null) => {
  if (!files || files.length === 0) return
  const file = files[0]
  if (!file.type.startsWith('image/')) return
  setHeroUploading(true)
  const preview = URL.createObjectURL(file)
  setMayaQR(preview)
  const url = await uploadToSupabase(file, 'qr-codes')
  setHeroUploading(false)
  if (url) {
    setMayaQR(url)
    setProfile((p:any) => ({ ...p, maya_qr_url: url }))
  }
}
  const handleLogoFiles = async (files: FileList | null) => {
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
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    setGalleryUploading(true)
    const newItems: any[] = []
    for (const file of validFiles) {
      const url = await uploadToSupabase(file, 'gallery')
      if (url) newItems.push({ src: url, alt: 'Gallery photo' })
    }
    setGalleryUploading(false)
    if (newItems.length > 0) {
      setProfile((p:any) => ({ ...p, gallery: [...(p.gallery || []), ...newItems] }))
    }
  }

  const removeGalleryItem = (idx: number) => {
    setProfile((p:any) => ({ ...p, gallery: p.gallery.filter((_:any, i:number) => i !== idx) }))
  }

  const toggleVisibility = (key: string) => {
    setProfile((p:any) => ({
      ...p,
      socials_visible: { ...p.socials_visible, [key]: !p.socials_visible[key] }
    }))
  }

  const clearSocial = (key: string) => {
    setProfile((p:any) => ({ ...p, socials: { ...p.socials, [key]: '' } }))
  }

  const loadExistingProfile = async () => {
    const uname = profile.username.toLowerCase().trim()
    if (!uname) { alert('Type username first'); return }
    const { data } = await supabase.from('profiles').select('*').eq('username', uname).maybeSingle()
    if (!data) { alert(`No profile found for "${uname}" - this will be a new client`); return }
    const mergedSocials = { ...DEFAULT_SOCIALS, ...(data.socials || {}) }
    const mergedVisible = { ...DEFAULT_VISIBLE, ...(data.socials_visible || {}) }
    setProfile((p:any) => ({ ...p, ...data, socials: mergedSocials, socials_visible: mergedVisible }))
    setOriginalUsername(data.username)
    // LOAD QR FIELDS - FIXED
    setGcashQR(data.gcash_qr_url || '')
    setMayaQR(data.maya_qr_url || '')
    setGcashName(data.gcash_name || '')
    setGcashNumber(data.gcash_number || '')
    setMayaName(data.maya_name || '')
    setMayaNumber(data.maya_number || '')
    alert(`Loaded ${data.username}`)
  }

  const save = async () => {
    const normalizedUsername = profile.username.toLowerCase().trim()
    if (!normalizedUsername) {
      alert('Username is required')
      return
    }
    if (!/^[a-z0-9-_]+$/.test(normalizedUsername)) {
      alert('Username can only contain lowercase letters, numbers, dash and underscore')
      return
    }

    setSaving(true)

    if (normalizedUsername !== originalUsername) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', normalizedUsername)
        .maybeSingle()

      if (existing) {
        setSaving(false)
        alert(`Username "${normalizedUsername}" already taken, please choose another`)
        return
      }
    }

    const fixed = { 
      ...profile,
      username: normalizedUsername,
      gcash_qr_url: gcashQR,
      maya_qr_url: mayaQR,
      gcash_name: gcashName,
      gcash_number: gcashNumber,
      maya_name: mayaName,
      maya_number: mayaNumber,
    }
    const { error } = await supabase.from('profiles').upsert(fixed, { onConflict: 'username' })
    setSaving(false)
    if (error) alert(error.message)
    else {
      setOriginalUsername(normalizedUsername)
      const visibleCount = SOCIALS_CONFIG.filter(s => profile.socials_visible[s.key] && profile.socials[s.key]?.trim()).length
      alert(`Saved! ${visibleCount} social buttons visible, gallery ${profile.gallery?.length || 0} photos`)
    }
  }

  const inputCls = "w-full mt-1 p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-[#D4AF37] outline-none text-sm"
  const activeSocialCount = SOCIALS_CONFIG.filter(s => profile.socials_visible[s.key] && profile.socials[s.key]?.trim()).length

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4 bg-zinc-900 p-6 rounded-2xl h-fit max-h-[95vh] overflow-y-auto">
          <h1 className="text-xl font-bold">Edit Profile</h1>
          
          <div className="flex gap-2">
            <label className="block flex-1 text-[11px] tracking-widest text-zinc-400 uppercase">Username<input value={profile.username} onChange={e => setProfile({...profile, username: e.target.value.toLowerCase()})} className={inputCls} placeholder="Nickname" /></label>
            <button onClick={loadExistingProfile} className="mt-5 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs">Load</button>
          </div>

          <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Name<input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className={inputCls} placeholder="Name" /></label>
          
          <div className="space-y-2">
            <p className="text-[11px] tracking-widest text-zinc-400 uppercase">Profile Photo </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverHero(true) }}
              onDragLeave={() => setDragOverHero(false)}
              onDrop={(e) => { e.preventDefault(); setDragOverHero(false); handleHeroFiles(e.dataTransfer.files) }}
              onClick={() => heroInputRef.current?.click()}
              className={`relative w-full rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all ${dragOverHero ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'}`}
            >
              <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroFiles(e.target.files)} />
              {profile.avatar_url ? (
                <div className="flex items-center gap-3">
                  <img src={profile.avatar_url} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{heroUploading ? 'Uploading...' : 'Profile photo set'}</p>
                    <p className="text-[11px] text-[#D4AF37] mt-1">Click or drag new photo to replace</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="text-2xl mb-1">📸</div>
                  <p className="text-xs text-white font-semibold">{heroUploading ? 'Uploading...' : 'Drop profile photo here'}</p>
                  <p className="text-[11px] text-zinc-400">Logo will stay as hero banner</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500"> {profile.hero_image} (Upload your profile)</p>
          </div>
        {/* ===== PAYMENT QR CODES ===== */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
  <p className="text-[10px] uppercase tracking-[1px] text-[#9CA3AF] font-bold flex gap-2 mb-4">
    PAYMENT QR CODES
  </p>
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <div onClick={()=>gcashInputRef.current?.click()} className="h-[160px] border border-dashed border-[#2A2A2A] bg-[#1E1E20] rounded-[16px] flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600 transition">
        {gcashQR ? <img src={gcashQR} className="w-[120px] h-[120px] bg-white rounded-[12px] object-contain p-2" /> : <p className="text-[12px] font-bold text-white">Drop GCash QR here</p>}
      </div>
      <input ref={gcashInputRef} type="file" hidden accept="image/*" onChange={e=>handleGcashFiles(e.target.files)} />
      <input value={gcashName} onChange={e=>setGcashName(e.target.value)} placeholder="GCash Name" className="w-full h-[38px] px-3 rounded-[10px] bg-[#1E1E20] border border-[#2A2A2A] text-[13px] text-white outline-none" />
      <input value={gcashNumber} onChange={e=>setGcashNumber(e.target.value)} placeholder="GCash Number" className="w-full h-[38px] px-3 rounded-[10px] bg-[#1E1E20] border border-[#2A2A2A] text-[13px] text-white outline-none" />
    </div>
    <div className="space-y-2">
      <div onClick={()=>mayaInputRef.current?.click()} className="h-[160px] border border-dashed border-[#2A2A2A] bg-[#1E1E20] rounded-[16px] flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600 transition">
        {mayaQR ? <img src={mayaQR} className="w-[120px] h-[120px] bg-white rounded-[12px] object-contain p-2" /> : <p className="text-[12px] font-bold text-white">Drop Maya QR here</p>}
      </div>
      <input ref={mayaInputRef} type="file" hidden accept="image/*" onChange={e=>handleMayaFiles(e.target.files)} />
      <input value={mayaName} onChange={e=>setMayaName(e.target.value)} placeholder="Maya Name" className="w-full h-[38px] px-3 rounded-[10px] bg-[#1E1E20] border border-[#2A2A2A] text-[13px] text-white outline-none" />
      <input value={mayaNumber} onChange={e=>setMayaNumber(e.target.value)} placeholder="Maya Number" className="w-full h-[38px] px-3 rounded-[10px] bg-[#1E1E20] border border-[#2A2A2A] text-[13px] text-white outline-none" />
    </div>
  </div>
</div>
          <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Title<input value={profile.title} onChange={e => setProfile({...profile, title: e.target.value})} className={inputCls} /></label>
          <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Bio<textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} rows={2} className={inputCls} /></label>
          <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">About<textarea value={profile.about} onChange={e => setProfile({...profile, about: e.target.value})} rows={3} className={inputCls} /></label>

          <div className="grid grid-cols-1 gap-3 border-t border-zinc-800 pt-4">
            <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Phone<input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className={inputCls} /></label>
            <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Email<input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className={inputCls} /></label>
            <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Address<input value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} className={inputCls} /></label>
            <label className="block text-[11px] tracking-widest text-zinc-400 uppercase">Google Maps Link<input value={profile.mapsLink} onChange={e => setProfile({...profile, mapsLink: e.target.value})} className={inputCls} placeholder="https://maps.app.goo.gl/..." /></label>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold">Social Links</p>
              <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full">{activeSocialCount} visible</span>
            </div>
            
            {SOCIALS_CONFIG.map(s => {
              const hasUrl = !!profile.socials[s.key]?.trim()
              const isVisible = profile.socials_visible[s.key]
              const willShow = hasUrl && isVisible
              return (
                <div key={s.key} className={`p-3 rounded-xl border transition-all ${willShow ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-800/50 border-zinc-800/50 opacity-75'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-bold ${s.color} flex items-center gap-2`}>
                      {s.label}
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => toggleVisibility(s.key)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${isVisible ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}
                      >
                        <i className={`fa-solid ${isVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        {isVisible ? 'Show' : 'Hide'}
                      </button>
                      {hasUrl && (
                        <button onClick={() => clearSocial(s.key)} className="px-2 py-1.5 rounded-full bg-zinc-700 text-[11px] text-zinc-300">×</button>
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
              <p className="text-[11px] text-zinc-400">or click to browse</p>
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

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-bold">Theme</p>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setProfile({...profile, accent_color: t.hex, theme: t.id})} className={`p-3 rounded-xl border-2 text-left ${profile.theme === t.id ? 'border-white scale-[1.02]' : 'border-zinc-700 hover:border-zinc-600'}`}>
                  <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full border border-white/20" style={{background: t.hex}}></div><span className="text-xs font-bold">{t.name}</span></div>
                  <p className="text-[10px] text-zinc-500 mt-1">{t.desc} • {t.hex}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={saving || heroUploading || galleryUploading} className="w-full py-3 rounded-xl font-bold hover:brightness-110 disabled:opacity-50" style={{background: profile.accent_color, color: 'black'}}>{saving ? 'Saving...' : `Create profile`}</button>
        </div>

        <div className="lg:sticky lg:top-4">
          <p className="mb-4 text-zinc-400 text-sm">Live Preview </p>
          <TaplyTemplate profile={profile} />
        </div>
      </div>
    </div>
  )
} 
