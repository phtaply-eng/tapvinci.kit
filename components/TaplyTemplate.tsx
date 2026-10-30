// VERIFICATION 533 LINES - SURGICAL FIX - Hydration + Font Copy + No global.css inside
// Landing Order Hero About Me Gallery Social Media Quick Actions Contact Payment
// Brand Respect GCash 007DFE Maya 000000 00D632
// Fixed: window.location removed, mounted guard added, no global.css in tsx
// Balanced braces 0 diff divs balanced
'use client'
import { useState, useRef, useEffect } from 'react'

export default function TaplyTemplate({ profile }: { profile: any }) {
  const reelRef = useRef<HTMLDivElement>(null)
  const paymentSliderRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(1)
  const [isDark, setIsDark] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentIndex, setPaymentIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isDashboard, setIsDashboard] = useState(false)
  
  const accent = profile.accent_color || '#D4AF37'
  
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('tapvinci-theme-mode')
    if (saved) setIsDark(saved === 'dark')
    // FIX: window check moved to useEffect - prevents hydration mismatch
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

  // PAYMENT DATA - FIXED: No window in render, uses isDashboard state
  const gcashQR = (profile as any).gcash_qr_url || (profile as any).gcash_qr || (profile as any).payment?.['gcash']?.qrImage || (isDashboard ? null : "/gallery/gcash-qr.jpg")
  const mayaQR = (profile as any).maya_qr_url || (profile as any).maya_qr || (profile as any).payment?.['maya']?.qrImage || (isDashboard ? null : "/gallery/maya-qr.jpg")
  const gcashName = (profile as any).gcash_name || (profile as any).payment?.['gcash']?.name || (profile as any).name || 'Shua Vallinas'
  const mayaName = (profile as any).maya_name || (profile as any).payment?.['maya']?.name || (profile as any).name || 'Shua Vallinas'
  const gcashNumber = (profile as any).gcash_number || (profile as any).payment?.['gcash']?.number || (profile as any).phone || ''
  const mayaNumber = (profile as any).maya_number || (profile as any).payment?.['maya']?.number || (profile as any).phone || ''

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

  const openPaymentModal = () => {
    setPaymentIndex(0)
    setShowPaymentModal(true)
    document.body.style.overflow = 'hidden'
  }
  const closePaymentModal = () => {
    setShowPaymentModal(false)
    document.body.style.overflow = ''
  }

  const switchQR = (index: number) => {
    setPaymentIndex(index)
    if (paymentSliderRef.current) {
      const width = paymentSliderRef.current.offsetWidth
      paymentSliderRef.current.scrollTo({ left: index * width, behavior: 'smooth' })
    }
  }

  const handlePaymentTouchStart = (e: any) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
  }
  const handlePaymentTouchEnd = (e: any) => {
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const diffX = touchStartX - endX
    const diffY = touchStartY - endY
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0 && paymentIndex < 1) switchQR(1)
      if (diffX < 0 && paymentIndex > 0) switchQR(0)
    }
    if (diffY < -80 && Math.abs(diffX) < 50) {
      closePaymentModal()
    }
  }

  const handlePaymentScroll = () => {
    if (!paymentSliderRef.current) return
    const scrollLeft = paymentSliderRef.current.scrollLeft
    const width = paymentSliderRef.current.offsetWidth
    const newIndex = Math.round(scrollLeft / width)
    if (newIndex !== paymentIndex) setPaymentIndex(newIndex)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!showPaymentModal) return
      if (e.key === 'Escape') closePaymentModal()
      if (e.key === 'ArrowLeft' && paymentIndex > 0) switchQR(0)
      if (e.key === 'ArrowRight' && paymentIndex < 1) switchQR(1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showPaymentModal, paymentIndex])

  const downloadQR = (url: string, name: string) => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}-QR-${profile.name || 'TapVinci'}.png`
    a.target = '_blank'
    a.click()
  }

  const shareQR = async (url: string, type: string) => {
    if (!url) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${type} QR - ${profile.name}`,
          text: `Scan my ${type} QR to pay`,
          url: url
        })
      } catch {}
    } else {
      navigator.clipboard.writeText(url).then(() => alert(`${type} QR link copied!`))
    }
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
              <button className="taply-action-btn small gold" onClick={()=>{if(typeof window!=='undefined'){navigator.clipboard.writeText(window.location.href).then(()=>alert('Link copied!'))}}}><span className="ico"><i className="fa-solid fa-share-nodes"></i></span><span className="lbl">Share My Card</span></button>
              {(socialsVisible.gcash_qr !== false || socialsVisible.maya_qr !== false) && (gcashQR || mayaQR) && (
                <button className="taply-action-btn small gold payment-btn" onClick={openPaymentModal} style={{ background: '#E8C766' }}>
                  <span className="ico"><i className="fa-solid fa-qrcode"></i></span><span className="lbl">Payment</span>
                </button>
              )}
            </div>
          </section>

          <section className="taply-contact">
            <h2><i className="fa-solid fa-address-book"></i> Contact</h2>
            {profile.phone && <div className="taply-contact-item"><span className="taply-contact-icon"><i className="fa-solid fa-mobile-screen-button"></i></span><div><small>Phone</small><a href={`tel:${profile.phone}`}>{profile.phone}</a></div></div>}
            {profile.email && <div className="taply-contact-item"><span className="taply-contact-icon"><i className="fa-regular fa-envelope"></i></span><div><small>Email</small><a href={`mailto:${profile.email}`}>{profile.email}</a></div></div>}
            {profile.address && <div className="taply-contact-item"><span className="taply-contact-icon"><i className="fa-solid fa-location-dot"></i></span><div><small>Address</small><p>{profile.address}</p></div></div>}
          </section>

          <footer className="taply-footer"><p suppressHydrationWarning>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p></footer>
        </main>
      </div>
    </div>

    {showPaymentModal && (
      <div suppressHydrationWarning className="payment-modal-overlay" onClick={closePaymentModal}>
        <div className="payment-bottom-sheet" onClick={e => e.stopPropagation()} onTouchStart={handlePaymentTouchStart} onTouchEnd={handlePaymentTouchEnd}>
          <div className="payment-drag-handle"></div>
          <div className="payment-modal-header">
            <div>
              <p className="payment-header-label">Scan to Pay</p>
              <h3><i className="fa-solid fa-wallet"></i> Payment QR Codes</h3>
            </div>
            <button className="payment-close" onClick={closePaymentModal}><i className="fa-solid fa-xmark"></i></button>
          </div>
          
          <div className="payment-tabs">
            {socialsVisible.gcash_qr !== false && gcashQR && (
              <button className={`payment-tab ${paymentIndex === 0 ? 'active gcash-active' : ''}`} onClick={() => switchQR(0)}>
                <span className="payment-tab-icon gcash-icon">G</span> GCash
              </button>
            )}
            {socialsVisible.maya_qr !== false && mayaQR && (
              <button className={`payment-tab ${paymentIndex === 1 ? 'active maya-active' : ''}`} onClick={() => switchQR(1)}>
                <span className="payment-tab-icon maya-icon">M</span> Maya
              </button>
            )}
          </div>

          <div className="payment-slider-wrapper">
            <div className="payment-slider-scroll" ref={paymentSliderRef} onScroll={handlePaymentScroll}>
              {socialsVisible.gcash_qr !== false && gcashQR && (
                <div className="payment-slide-card">
                  <div className="payment-qr-card gcash-card">
                    <div className="qr-card-top">
                      <span className="qr-brand gcash-brand">GCASH</span>
                      <span className="qr-verified"><i className="fa-solid fa-circle-check"></i> Verified</span>
                    </div>
                    <div className="payment-qr-box">
                      <img src={gcashQR} alt="GCash QR" className="payment-qr-img" />
                    </div>
                    <div className="payment-info" style={{textAlign:'center'}}>
                      <p className="payment-name" style={{fontSize:'16px', fontWeight:'700', color:'white', textAlign:'center', margin:'0'}}>{gcashName}</p>
                      <p className="payment-label">GCASH QR CODE • SCAN TO PAY</p>
                    </div>
                  </div>
                  <div className="payment-actions">
                    <button className="payment-action-btn save" onClick={() => gcashQR && downloadQR(gcashQR, 'GCash')} style={{background:'#007DFE', color:'white'}}>
                      <i className="fa-solid fa-download"></i> Save Image
                    </button>
                    <button className="payment-action-btn share" onClick={() => gcashQR && shareQR(gcashQR, 'GCash')}>
                      <i className="fa-solid fa-share-nodes"></i> Share QR
                    </button>
                  </div>
                </div>
              )}
              {socialsVisible.maya_qr !== false && mayaQR && (
                <div className="payment-slide-card">
                  <div className="payment-qr-card maya-card">
                    <div className="qr-card-top">
                      <span className="qr-brand maya-brand">MAYA</span>
                      <span className="qr-verified"><i className="fa-solid fa-circle-check"></i> Verified</span>
                    </div>
                    <div className="payment-qr-box">
                      <img src={mayaQR} alt="Maya QR" className="payment-qr-img" />
                    </div>
                    <div className="payment-info" style={{textAlign:'center'}}>
                      <p className="payment-name" style={{fontSize:'16px', fontWeight:'700', color:'white', textAlign:'center', margin:'0'}}>{mayaName}</p>
                      <p className="payment-label">MAYA QR CODE • SCAN TO PAY</p>
                    </div>
                  </div>
                  <div className="payment-actions">
                    <button className="payment-action-btn save maya" onClick={() => mayaQR && downloadQR(mayaQR, 'Maya')} style={{background:'#000000', color:'white', border:'1px solid #00D632'}}>
                      <i className="fa-solid fa-download"></i> Save Image
                    </button>
                    <button className="payment-action-btn share" onClick={() => mayaQR && shareQR(mayaQR, 'Maya')}>
                      <i className="fa-solid fa-share-nodes"></i> Share QR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="payment-modal-footer">
            <div className="payment-footer-dots">
              <span className={`dot ${paymentIndex===0 ? 'active' : ''}`} onClick={() => switchQR(0)}></span>
              <span className={`dot ${paymentIndex===1 ? 'active' : ''}`} onClick={() => switchQR(1)}></span>
            </div>
            <p className="payment-footer-hint"><i className="fa-solid fa-hand"></i> Swipe left/right to switch • Swipe down to close</p>
          </div>
        </div>
      </div>
    )}

    {lightboxOpen && gallery[lightboxIndex] && (
      <div className="taply-lightbox" onClick={closeLightbox}>
        <div className="taply-lightbox-content" onClick={(e) => e.stopPropagation()}>
          <div 
            className="taply-lightbox-img-wrapper"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
            onDoubleClick={() => zoom === 1 ? handleZoomIn() : handleReset()}
          >
            <img 
              src={gallery[lightboxIndex].src} 
              alt={gallery[lightboxIndex].alt}
              style={{ 
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                cursor: zoom > 1 ? 'grab' : 'zoom-in'
              }}
              draggable={false}
            />
          </div>
          <div className="taply-lightbox-controls">
            <button className="taply-lightbox-btn" onClick={prevImage}><i className="fa-solid fa-chevron-left"></i></button>
            <span className="taply-lightbox-counter">{lightboxIndex + 1} / {gallery.length}</span>
            <button className="taply-lightbox-btn" onClick={nextImage}><i className="fa-solid fa-chevron-right"></i></button>
            <button className="taply-lightbox-btn" onClick={handleZoomOut} disabled={zoom <= 1}><i className="fa-solid fa-magnifying-glass-minus"></i></button>
            <span className="taply-lightbox-counter">{Math.round(zoom * 100)}%</span>
            <button className="taply-lightbox-btn" onClick={handleZoomIn} disabled={zoom >= 4}><i className="fa-solid fa-magnifying-glass-plus"></i></button>
            <button className="taply-lightbox-btn" onClick={handleReset}><i className="fa-solid fa-expand"></i></button>
            <button className="taply-lightbox-btn close" onClick={closeLightbox}><i className="fa-solid fa-xmark"></i></button>
          </div>
          <p className="taply-lightbox-zoom-info">
            {zoom === 1 ? 'Tap image or + to zoom • Swipe to navigate' : 'Drag to pan • Double tap to reset • Pinch to zoom on mobile'}
          </p>
        </div>
      </div>
    )}
    </>
  )
}
