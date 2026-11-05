'use client'
import { useState, useRef, useEffect } from 'react'

export default function TaplyTemplate({ profile }: { profile: any }) {
  const reelRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(1)
  const [isDark, setIsDark] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const [isDashboard, setIsDashboard] = useState(false)
  
  const accent = profile.accent_color || '#D4AF37'
  
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('tapvinci-theme-mode')
    if (saved) setIsDark(saved === 'dark')
    if (typeof window !== 'undefined') {
      setIsDashboard(window.location.pathname.includes('dashboard'))
    }
  }, [])

  const toggleMode = () => {
    const newMode = !isDark
    setIsDark(newMode)
    localStorage.setItem('tapvinci-theme-mode', newMode ? 'dark' : 'light')
  }
  
  const gallery = (profile.gallery || []).map((item: any) => {
    if (typeof item === 'string') return { src: item, alt: 'Gallery' }
    return { src: item.src, alt: item.alt || 'Gallery' }
  }).filter((g: any) => g.src)

  const heroImg = profile.hero_image || profile.avatar_url || ''
  const socials = profile.socials || {}
  const socialsVisible = profile.socials_visible || {}

  const isVisible = (key: string) => {
    if (socialsVisible[key] === false) return false
    return !!socials[key]
  }

  const socialButtons = []
  if (isVisible('facebook')) socialButtons.push({ id: 'facebook', href: socials.facebook, icon: 'fa-facebook-f', label: 'Facebook' })
  if (isVisible('instagram')) socialButtons.push({ id: 'instagram', href: socials.instagram, icon: 'fa-instagram', label: 'Instagram' })
  if (isVisible('tiktok')) socialButtons.push({ id: 'tiktok', href: socials.tiktok, icon: 'fa-tiktok', label: 'TikTok' })
  if (isVisible('messenger')) socialButtons.push({ id: 'messenger', href: socials.messenger, icon: 'fa-facebook-messenger', label: 'Messenger' })
  if (isVisible('linkedin')) socialButtons.push({ id: 'linkedin', href: socials.linkedin, icon: 'fa-linkedin-in', label: 'LinkedIn' })
  if (isVisible('youtube')) socialButtons.push({ id: 'youtube', href: socials.youtube, icon: 'fa-youtube', label: 'YouTube' })
  if (isVisible('whatsapp')) socialButtons.push({ id: 'whatsapp', href: socials.whatsapp, icon: 'fa-whatsapp', label: 'WhatsApp' })
  if (isVisible('website')) socialButtons.push({ id: 'website', href: socials.website, icon: 'fa-globe', label: 'Website' })
  if (isVisible('twitter') || isVisible('x')) socialButtons.push({ id: 'twitter', href: socials.twitter || socials.x, icon: 'fa-x-twitter', label: 'X / Twitter' })

  // PAYMENT DATA
  const gcashQR = (profile as any).gcash_qr_url || (profile as any).gcash_qr || (isDashboard ? null : "/gallery/gcash-qr.jpg")
  const mayaQR = (profile as any).maya_qr_url || (profile as any).maya_qr || (isDashboard ? null : "/gallery/maya-qr.jpg")

  const getTheme = () => {
    const t = profile.theme || 'gold'
    if (!isDark) {
      return { bg: '#f1f5f9', card: '#ffffff', glow: `radial-gradient(600px circle at 50% -10%, ${accent}22, transparent 60%)`, shadow: '0 10px 40px rgba(0,0,0,0.08)', light: true }
    }
    switch(t){
      case 'purple': return { bg:'#050505', card:'#151515', glow:`radial-gradient(600px circle at 50% -10%, ${accent}44, transparent 60%)`, shadow:`0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${accent}30`, light:false }
      case 'blue': return { bg:'#050505', card:'#151515', glow:`radial-gradient(600px circle at 50% -10%, ${accent}44, transparent 60%)`, shadow:`0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${accent}30`, light:false }
      case 'green': return { bg:'#050505', card:'#151515', glow:`radial-gradient(600px circle at 50% -10%, ${accent}44, transparent 60%)`, shadow:`0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${accent}30`, light:false }
      case 'pink': return { bg:'#050505', card:'#151515', glow:`radial-gradient(600px circle at 50% -10%, ${accent}44, transparent 60%)`, shadow:`0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${accent}30`, light:false }
      case 'orange': return { bg:'#050505', card:'#151515', glow:`radial-gradient(600px circle at 50% -10%, ${accent}44, transparent 60%)`, shadow:`0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${accent}30`, light:false }
      default: return { bg:'#050505', card:'#151515', glow:`radial-gradient(600px circle at 50% -10%, ${accent}44, transparent 60%)`, shadow:`0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${accent}30`, light:false }
    }
  }
  const th = getTheme()

  useEffect(()=>{
    const reel = reelRef.current; if(!reel) return
    const h = () => {
      const first = reel.firstElementChild as HTMLElement
      const w = first ? first.offsetWidth + 14 : 300
      setCurrent(Math.round(reel.scrollLeft / w) + 1)
    }
    reel.addEventListener('scroll', h, { passive:true })
    return ()=> reel.removeEventListener('scroll', h)
  },[gallery])

  const scroll = (dir:number) => {
    if(!reelRef.current) return
    const first = reelRef.current.firstElementChild as HTMLElement
    const w = first ? first.offsetWidth + 14 : 300
    reelRef.current.scrollBy({ left: dir*w, behavior:'smooth' })
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    document.body.style.overflow = ''
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % gallery.length)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 4))
  const handleZoomOut = () => setZoom((z) => {
    const newZoom = Math.max(z - 0.5, 1)
    if (newZoom === 1) setPan({ x: 0, y: 0 })
    return newZoom
  })
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  const handleMouseDown = (e: any) => {
    if (zoom === 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }
  const handleMouseMove = (e: any) => {
    if (!isDragging || zoom === 1) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handleMouseUp = () => setIsDragging(false)

  const handleTouchStart = (e: any) => {
    if (zoom === 1) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
  }
  const handleTouchMove = (e: any) => {
    if (!isDragging || zoom === 1) return
    const touch = e.touches[0]
    setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y })
  }

  const saveContact = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.name}
ORG:${profile.title || ''}
TEL:${profile.phone || ''}
EMAIL:${profile.email || ''}
ADR:${profile.address || ''}
URL:${mounted && typeof window !== 'undefined' ? window.location.href : ''}
END:VCARD`
    const blob = new Blob([vcard], {type:'text/vcard'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.name.replace(/\s+/g, '_')}.vcf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!mounted) {
    return (
      <div className="taply-gold-wrapper" style={{ background: '#050505' }}>
        <div className="phone-wrap">
          <main className="taply-card" style={{ background: '#121214', border: '1px solid #242426', borderRadius: '36px', width: '390px' }}>
            <div style={{ height: '380px', background: '#1A1B1F' }} />
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ height: '32px', background: '#27272a', borderRadius: '8px', marginBottom: '12px' }} />
              <div style={{ height: '12px', background: '#27272a', borderRadius: '4px', width: '60%', margin: '0 auto' }} />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <>
    <div suppressHydrationWarning className={`taply-gold-wrapper ${!isDark ? 'light-mode' : ''}`} style={{ background: '#050505', ['--sg' as any]: accent } as any}>
      <div className="phone-wrap">
        <div className="glow-behind" style={{ background: accent }} />
        <main suppressHydrationWarning className={`taply-card ${th.light || !isDark ? 'light-mode' : ''}`} style={{ background: '#121214', border: '1px solid #242426', borderRadius: '36px', width: '390px', boxShadow: `0 0 80px ${accent}45, 0 0 140px ${accent}22` } as any}>
          <button className="taply-theme-toggle" onClick={toggleMode} aria-label="Toggle dark mode">
            <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          <section suppressHydrationWarning className="taply-profile">
            <div className="taply-hero"><img src={heroImg} alt="Profile" className="taply-profile-img" /></div>
            <div suppressHydrationWarning className="taply-profile-body text-center">
              <h1 
                className="name-font-taply"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(30px, 7vw, 36px)',
                  fontWeight: 700,
                  lineHeight: '1.08',
                  letterSpacing: '0.5px',
                  color: '#FFF8E7',
                  textAlign: 'center',
                  marginBottom: '10px',
                  textWrap: 'balance',
                  textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.5)'
                }}
              >
                {profile.name || 'Your Name'}
              </h1>
              <p 
                className="subtitle-gold job-title"
                style={{
                  fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                  fontSize: '8px',
                  fontWeight: 500,
                  lineHeight: '1.4',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#D4AF37',
                  textAlign: 'center',
                  margin: '0 auto 18px',
                  maxWidth: '420px'
                }}
              >
                {profile.title || 'Your Title'}
              </p>
              <div 
                className="gold-line-divider"
                style={{
                  width: '60px',
                  height: '1.5px',
                  background: 'linear-gradient(90deg, transparent 0%, #D4AF37 20%, #E8C766 50%, #D4AF37 80%, transparent 100%)',
                  margin: '12px auto 0 auto',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px rgba(212,175,55,0.5)',
                  opacity: 0.9
                }}
              />
              <div className="taply-bio" style={{ marginTop: '24px' }}>{profile.bio || 'Bio'}</div>
              {socialButtons.length > 0 && <a href="#socials" className="taply-primary-btn" style={{ marginTop: '16px', display: 'inline-flex' }}>Let's Connect ↓</a>}
            </div>
          </section>

          {profile.about && (<section className="taply-section"><h2><i className="fa-regular fa-user"></i> About Me</h2><p>{profile.about}</p></section>)}

          {gallery.length > 0 && (
            <section className="taply-section">
              <h2><i className="fa-regular fa-images"></i> Gallery </h2>
              <div className="taply-carousel">
                <div className="taply-reel" ref={reelRef}>
                  {gallery.map((item:any,i:number)=>(
                    <figure key={i} onClick={() => openLightbox(i)}>
                      <img src={item.src} alt={item.alt} loading="lazy" />
                    </figure>
                  ))}
                </div>
                <button className="taply-carousel-btn prev" onClick={()=>scroll(-1)}><i className="fa-solid fa-chevron-left"></i></button>
                <button className="taply-carousel-btn next" onClick={()=>scroll(1)}><i className="fa-solid fa-chevron-right"></i></button>
                <p className="taply-carousel-count">{current} / {gallery.length} </p>
              </div>
            </section>
          )}

          {socialButtons.length > 0 && (
            <section className="taply-section" id="socials">
              <h2><i className="fa-solid fa-link"></i> Social Media</h2>
              {socialButtons.map((s) => (
                <a key={s.id} className="taply-social-btn" data-href={s.id} href={s.href} target="_blank" rel="noreferrer">
                  <i className={`fa-brands ${s.icon}`}></i> {s.label}
                </a>
              ))}
            </section>
          )}

          <section className="taply-section">
            <h2><i className="fa-solid fa-bolt"></i> Quick Actions</h2>
            <div className="taply-pills">
              {profile.phone && <a className="taply-action-btn" href={`tel:${profile.phone}`}><span className="ico"><i className="fa-solid fa-phone"></i></span><span className="lbl">Call Me</span></a>}
              {profile.phone && <a className="taply-action-btn" href={`sms:${profile.phone}`}><span className="ico"><i className="fa-solid fa-comment-sms"></i></span><span className="lbl">Text / SMS</span></a>}
              {profile.email && <a className="taply-action-btn" href={`mailto:${profile.email}`}><span className="ico"><i className="fa-solid fa-envelope"></i></span><span className="lbl">Send Email</span></a>}
            </div>
            <div className="taply-secondary-pills quick-actions-row">
              {profile.address && socialsVisible.google_maps !== false && (
                <a className="taply-action-btn small google-maps" href={profile.mapsLink || `https://maps.google.com/?q=${encodeURIComponent(profile.address)}`} target="_blank" rel="noreferrer">
                  <span className="ico"><i className="fa-solid fa-location-dot" style={{ color: '#E53935' }}></i></span><span className="lbl">Google Maps</span>
                </a>
              )}
              <button className="taply-action-btn small gold" onClick={saveContact}><span className="ico"><i className="fa-solid fa-address-card"></i></span><span className="lbl">Save Contact</span></button>
              
              {/* PAYMENT ANCHOR BUTTON */}
              {(socialsVisible.gcash_qr !== false || socialsVisible.maya_qr !== false) && (gcashQR || mayaQR) && (
                <a href="#payment-section" className="taply-action-btn small gold payment-btn" style={{ background: '#E8C766', textDecoration: 'none' }}>
                  <span className="ico"><i className="fa-solid fa-qrcode"></i></span><span className="lbl">Payment</span>
                </a>
              )}

              <button className="taply-action-btn small gold" onClick={()=>{if(typeof window!=='undefined'){navigator.clipboard.writeText(window.location.href).then(()=>alert('Link copied!'))}}}><span className="ico"><i className="fa-solid fa-share-nodes"></i></span><span className="lbl">Share My Card</span></button>
            </div>
          </section>

          {/* NEW INLINE PAYMENT SECTION - Moved outside of Quick Actions */}
          {(socialsVisible.gcash_qr !== false || socialsVisible.maya_qr !== false) && (gcashQR || mayaQR) && (
            <section id="payment-section" className="taply-section" style={{ scrollMarginTop: '20px' }}>
              <h2><i className="fa-solid fa-wallet"></i> Payment Options</h2>
              <p style={{ marginBottom: '16px', fontSize: '11px', color: '#A1A1A1' }}>Scan to pay via GCash or Maya</p>
              
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {socialsVisible.gcash_qr !== false && gcashQR && (
                  <div style={{ background: '#121214', padding: '12px', borderRadius: '16px', border: '1px solid #27272a', textAlign: 'center', flex: '1 1 120px', maxWidth: '160px' }}>
                    <div style={{ background: 'white', padding: '8px', borderRadius: '8px', marginBottom: '8px' }}>
                      <img src={gcashQR} alt="GCash QR" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }} />
                    </div>
                    <p style={{ color: '#007DFE', fontSize: '12px', fontWeight: 'bold', margin: 0 }}>GCash</p>
                  </div>
                )}

                {socialsVisible.maya_qr !== false && mayaQR && (
                  <div style={{ background: '#121214', padding: '12px', borderRadius: '16px', border: '1px solid #27272a', textAlign: 'center', flex: '1 1 120px', maxWidth: '160px' }}>
                    <div style={{ background: 'white', padding: '8px', borderRadius: '8px', marginBottom: '8px' }}>
                      <img src={mayaQR} alt="Maya QR" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }} />
                    </div>
                    <p style={{ color: '#00D632', fontSize: '12px', fontWeight: 'bold', margin: 0 }}>Maya</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="taply-contact">
            <h2><i className="fa-solid fa-address-book"></i> Contact</h2>
            {profile.phone && <div className="taply-contact-item"><span className="taply-contact-icon"><i className="fa-solid fa-mobile-screen-button"></i></span><div><small>Phone</small><a href={`tel:${profile.phone}`}>{profile.phone}</a></div></div>}
            {profile.email && <div className="taply-contact-item"><span className="taply-contact-icon"><i className="fa-regular fa-envelope"></i></span><div><small>Email</small><a href={`mailto:${profile.email}`}>{profile.email}</a></div></div>}
            {profile.address && <div className="taply-contact-item"><span className="taply-contact-icon"><i className="fa-solid fa-location-dot"></i></span><div><small>Address</small><p>{profile.address}</p></div></div>}
          </section>

          <footer className="taply-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <p suppressHydrationWarning style={{ margin: 0 }}>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
  
            {/* VIEW COUNTER */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#D4AF37', opacity: 0.8 }}>
              <i className="fa-regular fa-eye"></i>
              <span suppressHydrationWarning>
                {profile.views || 0} {profile.views === 1 ? 'view' : 'views'}
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>

    {lightboxOpen && gallery[lightboxIndex] && (
      <div 
        style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        className="bg-[#050505]/95 backdrop-blur-[16px] p-4"
        onClick={closeLightbox}
      >
        <button 
          onClick={closeLightbox} 
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100000 }}
          className="w-10 h-10 rounded-full bg-[#121214] border border-[#2A2A2A] text-white hover:border-[#D4AF37] flex items-center justify-center cursor-pointer"
        >
          ×
        </button>

        <div
          className="relative flex items-center justify-center"
          style={{ width: '90vw', maxWidth: '900px', height: '70vh', margin: '0 auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative w-full h-full flex items-center justify-center rounded-xl border border-[#1E1E1E] bg-[#121214] overflow-hidden"
            style={{ boxShadow: '0 0 80px rgba(212,175,55,0.15)' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onDoubleClick={() => zoom === 1 ? handleZoomIn() : handleReset()}
          >
            <img 
              src={gallery[lightboxIndex].src} 
              alt={gallery[lightboxIndex].alt}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain',
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease'
              }}
              draggable={false}
            />
          </div>

          {gallery.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prevImage() }} className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#121214] border border-[#2A2A2A] text-white hover:border-[#D4AF37] flex items-center justify-center cursor-pointer">‹</button>
              <button onClick={(e) => { e.stopPropagation(); nextImage() }} className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#121214] border border-[#2A2A2A] text-white hover:border-[#D4AF37] flex items-center justify-center cursor-pointer">›</button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#121214] border border-[#1E1E1E] mt-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-[#A1A1A1]">{lightboxIndex + 1} / {gallery.length}</span>
          <div className="w-px h-4 bg-[#2A2A2A]" />
          <span className="text-xs text-white/50">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomOut} disabled={zoom <= 1} className="w-8 h-8 rounded-full bg-[#1E1E1E] text-white disabled:opacity-30 flex items-center justify-center">−</button>
          <button onClick={handleZoomIn} disabled={zoom >= 4} className="w-8 h-8 rounded-full bg-[#1E1E1E] text-white disabled:opacity-30 flex items-center justify-center">+</button>
          <button onClick={handleReset} className="w-8 h-8 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center">⛶</button>
          <button onClick={closeLightbox} className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">×</button>
        </div>

        <p className="text-[11px] text-white/30 mt-3">Tap + to zoom • Arrows to navigate • Esc to close</p>

        {gallery.length > 1 && (
          <div className="flex gap-2 mt-4 max-w-[90vw] overflow-x-auto justify-center">
            {gallery.map((img: any, i: number) => (
              <img key={i} src={img.src} onClick={() => setLightboxIndex(i)} className={`w-14 h-14 rounded-lg object-cover border-2 cursor-pointer flex-shrink-0 ${i === lightboxIndex ? 'border-[#D4AF37]' : 'border-transparent opacity-60'}`} />
            ))}
          </div>
        )}
      </div>
    )}
    </>
  )
}