'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import StudentStats from '@/components/students/StudentStats'
import StudentEducation from '@/components/students/StudentEducation'
import StudentSpotify from '@/components/students/StudentSpotify'
import LoginModal from '@/components/LoginModal'
import { getTapCount, getVisibleEducation, resolveProfileRole } from '../lib/profile-role'
import { createClient } from '../lib/supabase-browser'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import ToastView from '@/components/ToastView'

const EditDrawer = dynamic(() => import('@/components/EditDrawer'), { ssr: false })

export default function TaplyTemplate({
  profile,
}: {
  profile: any
  viewAs?: 'student' | 'professional'
}) {
  const [isDark, setIsDark] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'gcash' | 'maya'>('gcash')

  const router = useRouter()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isCardOwner, setIsCardOwner] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [drawerMounted, setDrawerMounted] = useState(false)
  const [notice, setNotice] = useState('')
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const awaitingSignIn = useRef(false)

  const showNotice = (message: string) => {
    setNotice(message)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(''), 3500)
  }

  const openEditor = () => {
    setDrawerMounted(true)
    setIsEditDrawerOpen(true)
  }

  const checkOwnership = async (userId: string): Promise<boolean> => {
    if (userId === profile.owner_id || userId === profile.claimed_by) return true
    if (!profile.id) return false
    const supabase = createClient()
    const { data } = await supabase
      .from('cards')
      .select('profile_id')
      .eq('claimed_by', userId)
      .eq('profile_id', profile.id)
      .maybeSingle()
    return !!data?.profile_id
  }

  const handleAuthResult = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data?.user ?? null
      setCurrentUserId(user?.id ?? null)
      if (!user) {
        setIsCardOwner(false)
        return
      }
      const owner = await checkOwnership(user.id)
      setIsCardOwner(owner)
      if (awaitingSignIn.current) {
        setIsLoginModalOpen(false)
        if (owner) openEditor()
        else showNotice('You are not the owner of this profile.')
      }
    } catch (error) {
      console.error('[Auth] ownership check failed:', error)
    } finally {
      awaitingSignIn.current = false
    }
  }
  const authResultRef = useRef(handleAuthResult)
  authResultRef.current = handleAuthResult

  useEffect(() => {
    let alive = true
    const params = new URLSearchParams(window.location.search)
    const wantsEdit = params.get('edit_profile') === '1'

    const run = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (!alive) return
        const user = data?.user ?? null
        setCurrentUserId(user?.id ?? null)

        const owner = user ? await checkOwnership(user.id) : false
        if (!alive) return
        setIsCardOwner(owner)

        if (wantsEdit) {
          params.delete('edit_profile')
          const qs = params.toString()
          window.history.replaceState(
            null,
            '',
            window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
          )
          if (!user) {
            awaitingSignIn.current = true
            setIsLoginModalOpen(true)
          } else if (owner) {
            openEditor()
          } else {
            showNotice('You are not the owner of this profile.')
          }
        }
      } catch {
      } finally {
        if (alive) setAuthReady(true)
      }
    }
    void run()

    return () => {
      alive = false
    }
  }, [profile.id])

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUserId(null)
        setIsCardOwner(false)
        setIsEditDrawerOpen(false)
        return
      }
      if (event === 'SIGNED_IN' && awaitingSignIn.current) {
        setTimeout(() => void authResultRef.current(), 0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [profile.id])

  const isOwner =
    !!currentUserId &&
    (currentUserId === profile.owner_id ||
      currentUserId === profile.claimed_by ||
      isCardOwner)

  const isStudent = resolveProfileRole(profile) === 'student'
  const accent = profile.accent_color || (isStudent ? '#22c55e' : '#D4AF37')

  const visiblePhone = profile.show_phone !== false && profile.phone ? String(profile.phone) : ''
  const visibleEmail = profile.show_email !== false && profile.email ? String(profile.email) : ''
  const visibleAddress =
    profile.show_address !== false && profile.address ? String(profile.address) : ''
  const visibleEducation = getVisibleEducation(profile)
  
  const mapsVisible =
    profile.socials_visible?.google_maps !== false && profile.show_google_maps !== false

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('tapvinci-theme-mode')
    if (saved) setIsDark(saved === 'dark')
  }, [])

  const toggleMode = () => {
    const newMode = !isDark
    setIsDark(newMode)
    localStorage.setItem('tapvinci-theme-mode', newMode ? 'dark' : 'light')
  }

  const gallery = (profile.gallery || [])
    .map((item: any) => {
      if (typeof item === 'string') return { src: item, alt: 'Gallery' }
      return { src: item.src, alt: item.alt || 'Gallery' }
    })
    .filter((g: any) => g.src)

  const heroImg = profile.hero_image || profile.avatar_url || ''
  const socials = profile.socials || {}
  const socialsVisible = profile.socials_visible || {}

  const isVisible = (key: string) => {
    if (socialsVisible[key] === false) return false
    return !!socials[key]
  }

  const socialButtons: Array<{ id: string; href: string; icon: string; label: string }> = []
  if (isVisible('facebook')) socialButtons.push({ id: 'facebook', href: socials.facebook, icon: 'fa-facebook-f', label: 'Facebook' })
  if (isVisible('instagram')) socialButtons.push({ id: 'instagram', href: socials.instagram, icon: 'fa-instagram', label: 'Instagram' })
  if (isVisible('tiktok')) socialButtons.push({ id: 'tiktok', href: socials.tiktok, icon: 'fa-tiktok', label: 'TikTok' })
  if (isVisible('messenger')) socialButtons.push({ id: 'messenger', href: socials.messenger, icon: 'fa-facebook-messenger', label: 'Messenger' })
  if (isVisible('linkedin')) socialButtons.push({ id: 'linkedin', href: socials.linkedin, icon: 'fa-linkedin-in', label: 'LinkedIn' })
  if (isVisible('youtube')) socialButtons.push({ id: 'youtube', href: socials.youtube, icon: 'fa-youtube', label: 'YouTube' })
  if (isVisible('whatsapp')) socialButtons.push({ id: 'whatsapp', href: socials.whatsapp, icon: 'fa-whatsapp', label: 'WhatsApp' })
  if (isVisible('website')) socialButtons.push({ id: 'website', href: socials.website, icon: 'fa-globe', label: 'Website' })
  if (isVisible('twitter') || isVisible('x')) socialButtons.push({ id: 'twitter', href: socials.twitter || socials.x, icon: 'fa-x-twitter', label: 'X / Twitter' })

  const gcashQR = (profile as any).gcash_qr_url || (profile as any).gcash_qr
  const mayaQR = (profile as any).maya_qr_url || (profile as any).maya_qr

  useEffect(() => {
    if (!gcashQR && mayaQR) setActiveTab('maya')
    if (gcashQR && !mayaQR) setActiveTab('gcash')
  }, [gcashQR, mayaQR])

  const handleSaveQR = async (url: string, type: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${type}-QR-${profile.name || 'TapVinci'}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const handleShareQR = async (url: string, type: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${type} QR - ${profile.name}`,
          text: `Scan my ${type} QR to pay`,
          url,
        })
      } catch {}
    } else {
      navigator.clipboard.writeText(url).then(() => alert(`${type} QR link copied!`))
    }
  }

  const getTheme = () => {
    const t = profile.theme || 'gold'
    if (!isDark) {
      return {
        bg: '#f1f5f9',
        card: '#ffffff',
        glow: `radial-gradient(600px circle at 50% -10%, ${accent}22, transparent 60%)`,
        shadow: '0 10px 40px rgba(0,0,0,0.08)',
        light: true,
      }
    }
    switch (t) {
      case 'purple':
      case 'blue':
      case 'green':
      case 'pink':
      case 'orange':
        return {
          bg: '#050505',
          card: '#151515',
          glow: `radial-gradient(600px circle at 50% -10%, ${accent}44, transparent 60%)`,
          shadow: `0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${accent}30`,
          light: false,
        }
      default:
        return {
          bg: '#050505',
          card: '#151515',
          glow: `radial-gradient(600px circle at 50% -10%, ${accent}44, transparent 60%)`,
          shadow: `0 20px 80px rgba(0,0,0,0.8), 0 0 60px ${accent}30`,
          light: false,
        }
    }
  }
  const th = getTheme()

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
  const handleZoomOut = () =>
    setZoom((z) => {
      const newZoom = Math.max(z - 0.5, 1)
      if (newZoom === 1) setPan({ x: 0, y: 0 })
      return newZoom
    })
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }
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
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${profile.name}`,
      `ORG:${profile.title || ''}`,
      visiblePhone ? `TEL:${visiblePhone}` : '',
      visibleEmail ? `EMAIL:${visibleEmail}` : '',
      visibleAddress ? `ADR:${visibleAddress}` : '',
      `URL:${mounted && typeof window !== 'undefined' ? window.location.href : ''}`,
      'END:VCARD',
    ].filter(Boolean)
    const vcard = lines.join('\n')
    const blob = new Blob([vcard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.name.replace(/\s+/g, '_')}.vcf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const shareCard = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const shareData = {
      title: profile.name || 'My TapVinci card',
      text: profile.title || 'Tap my TapVinci card',
      url,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const socialsSection =
    socialButtons.length > 0 ? (
      <section className="taply-section" id="socials">
        <h2 style={{ color: '#D4AF37' }}>
          <i className="fa-solid fa-link" style={{ color: '#D4AF37' }}></i> Social Media
        </h2>
        
        <div className="mt-4 flex w-full flex-row flex-nowrap gap-4 overflow-x-auto px-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] justify-center">
          {socialButtons.map((s) => {
            let bgStyle: React.CSSProperties = { background: '#1E1E20' }
            if (s.id === 'facebook') bgStyle = { background: '#1877F2' }
            else if (s.id === 'instagram')
              bgStyle = {
                background:
                  'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
              }
            else if (s.id === 'tiktok') bgStyle = { background: '#000000', border: '1px solid #333' }
            else if (s.id === 'messenger')
              bgStyle = { background: 'linear-gradient(45deg, #0084FF, #7a5cff)' }
            else if (s.id === 'linkedin') bgStyle = { background: '#0A66C2' }
            else if (s.id === 'youtube') bgStyle = { background: '#FF0000' }
            else if (s.id === 'whatsapp') bgStyle = { background: '#25D366' }
            else if (s.id === 'twitter') bgStyle = { background: '#000000', border: '1px solid #333' }
            else if (s.id === 'website') bgStyle = { background: '#3f3f46' }

            const iconClass = s.id === 'website' ? 'fa-solid' : 'fa-brands'

            return (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                title={s.label}
                className="flex h-16 w-16 flex-shrink-0 cursor-pointer items-center justify-center rounded-2xl text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                style={bgStyle}
              >
                <i className={`${iconClass} ${s.icon} text-3xl`}></i>
              </a>
            )
          })}
        </div>
      </section>
    ) : null

  const gallerySection =
    gallery.length > 0 ? (
      <section className="taply-section">
        <h2 style={{ color: '#D4AF37' }}>
          <i className="fa-regular fa-images" style={{ color: '#D4AF37' }}></i> Gallery
        </h2>
        <div className="-mx-5 mt-4 grid grid-cols-3 gap-1.5">
          {gallery.map((item: any, i: number) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt || `Gallery ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>
    ) : null

  const contactSection =
    visiblePhone || visibleEmail || visibleAddress ? (
      <section className="taply-contact">
        <h2 style={{ color: '#D4AF37' }}>
          <i className="fa-solid fa-address-book" style={{ color: '#D4AF37' }}></i> Contact
        </h2>
        {visiblePhone && (
          <div className="taply-contact-item">
            <span className="taply-contact-icon">
              <i className="fa-solid fa-mobile-screen-button"></i>
            </span>
            <div>
              <small>Phone</small>
              <a href={`tel:${visiblePhone}`}>{visiblePhone}</a>
            </div>
          </div>
        )}
        {visibleEmail && (
          <div className="taply-contact-item">
            <span className="taply-contact-icon">
              <i className="fa-regular fa-envelope"></i>
            </span>
            <div>
              <small>Email</small>
              <a href={`mailto:${visibleEmail}`}>{visibleEmail}</a>
            </div>
          </div>
        )}
        {visibleAddress && (
          <div className="taply-contact-item">
            <span className="taply-contact-icon">
              <i className="fa-solid fa-location-dot"></i>
            </span>
            <div>
              <small>Address</small>
              <p>{visibleAddress}</p>
            </div>
          </div>
        )}
      </section>
    ) : null

  const quickActionsSection = (
    <section className="taply-section">
      <h2 style={{ color: '#D4AF37' }}>
        <i className="fa-solid fa-bolt" style={{ color: '#D4AF37' }}></i> Quick Actions
      </h2>

      <div className="taply-pills">
        {profile.phone && (
          <a className="taply-action-btn" href={`tel:${profile.phone}`}>
            <span className="ico">
              <i className="fa-solid fa-phone"></i>
            </span>
            <span className="lbl">Call Me</span>
          </a>
        )}
        {profile.phone && (
          <a className="taply-action-btn" href={`sms:${profile.phone}`}>
            <span className="ico">
              <i className="fa-solid fa-comment-sms"></i>
            </span>
            <span className="lbl">Text / SMS</span>
          </a>
        )}
        {profile.email && (
          <a className="taply-action-btn" href={`mailto:${profile.email}`}>
            <span className="ico">
              <i className="fa-solid fa-envelope"></i>
            </span>
            <span className="lbl">Send Email</span>
          </a>
        )}
      </div>

      <div className="taply-secondary-pills quick-actions-row">
        {profile.address && mapsVisible && (
          <a
            className="taply-action-btn small google-maps"
            href={
              profile.mapsLink ||
              `https://maps.google.com/?q=${encodeURIComponent(profile.address)}`
            }
            target="_blank"
            rel="noreferrer"
          >
            <span className="ico">
              <i className="fa-solid fa-location-dot" style={{ color: '#E53935' }}></i>
            </span>
            <span className="lbl">Google Maps</span>
          </a>
        )}
        <button className="taply-action-btn small gold" onClick={saveContact}>
          <span className="ico">
            <i className="fa-solid fa-address-card"></i>
          </span>
          <span className="lbl">Save Contact</span>
        </button>
        {(gcashQR || mayaQR) && (
          <button className="taply-action-btn small gold" onClick={() => setShowPaymentModal(true)}>
            <span className="ico">
              <i className="fa-solid fa-qrcode"></i>
            </span>
            <span className="lbl">Payment</span>
          </button>
        )}
        <button className="taply-action-btn small gold" onClick={shareCard}>
          <span className="ico">
            <i className="fa-solid fa-share-nodes"></i>
          </span>
          <span className="lbl">Share My Card</span>
        </button>
      </div>
    </section>
  )

  const footerSection = (
    <footer
      className="taply-footer"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
    >
      <p suppressHydrationWarning style={{ margin: 0 }}>
        © {new Date().getFullYear()} {profile.name}. All rights reserved.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        {isStudent ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: accent,
              opacity: 0.9,
            }}
          >
            <i className="fa-solid fa-hand-pointer" />
            <span>
              {getTapCount(profile)} {getTapCount(profile) === 1 ? 'tap' : 'taps'}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: '#D4AF37',
              opacity: 0.8,
            }}
          >
            <i className="fa-regular fa-eye"></i>
            <span suppressHydrationWarning>
              {profile.views || 0} {profile.views === 1 ? 'view' : 'views'}
            </span>
          </div>
        )}

        {authReady && <span style={{ color: '#333', fontSize: '10px' }}>|</span>}

        {authReady &&
          (isOwner ? (
            <button
              type="button"
              onClick={openEditor}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: isStudent ? '#22c55e' : '#D4AF37',
              }}
            >
              <i className="fa-solid fa-pen-to-square" style={{ fontSize: '9px' }} />
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                fontSize: '10px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted, #71717a)',
                opacity: 0.85,
                cursor: 'pointer',
              }}
            >
              Sign in to edit
            </button>
          ))}
      </div>
    </footer>
  )

  if (!mounted) {
    return (
      <div className="taply-gold-wrapper" style={{ background: '#050505' }}>
        <div className="phone-wrap">
          <main
            className="taply-card"
            style={{
              background: '#121214',
              border: '1px solid #242426',
              borderRadius: '36px',
              width: '390px',
            }}
          >
            <div style={{ height: '380px', background: '#1A1B1F' }} />
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div
                style={{
                  height: '32px',
                  background: '#27272a',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}
              />
              <div
                style={{
                  height: '12px',
                  background: '#27272a',
                  borderRadius: '4px',
                  width: '60%',
                  margin: '0 auto',
                }}
              />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          awaitingSignIn.current = false
          setIsLoginModalOpen(false)
        }}
        onSignInStart={() => {
          awaitingSignIn.current = true
        }}
        onAuthComplete={() => void authResultRef.current()}
      />

      {drawerMounted && (
        <EditDrawer
          isOpen={isEditDrawerOpen}
          onClose={() => setIsEditDrawerOpen(false)}
          profile={profile}
          onSaved={() => router.refresh()}
        />
      )}

      <ToastView message={notice} />

      <div
        suppressHydrationWarning
        className={`taply-gold-wrapper ${!isDark ? 'light-mode' : ''}`}
        style={{ background: '#050505', ['--sg' as any]: accent } as any}
      >
        <div className="phone-wrap">
          <div className="glow-behind" style={{ background: accent }} />
          <main
            suppressHydrationWarning
            className={`taply-card ${th.light || !isDark ? 'light-mode' : ''}`}
            style={{
              background: '#121214',
              border: '1px solid #242426',
              borderRadius: '36px',
              width: '390px',
              boxShadow: `0 0 80px ${accent}45, 0 0 140px ${accent}22`,
            } as any}
          >
            <button className="taply-theme-toggle" onClick={toggleMode} aria-label="Toggle dark mode">
              <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            <section suppressHydrationWarning className="taply-profile">
              <div className="taply-hero">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImg} alt="Profile" className="taply-profile-img" />
              </div>
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
                    textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.5)',
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
                    color: accent,
                    textAlign: 'center',
                    margin: '0 auto 18px',
                    maxWidth: '420px',
                  }}
                >
                  {profile.title || 'Your Title'}
                </p>

                <div
                  className="gold-line-divider"
                  style={{
                    width: '60px',
                    height: '1.5px',
                    background: `linear-gradient(90deg, transparent 0%, ${accent} 20%, ${accent} 50%, ${accent} 80%, transparent 100%)`,
                    margin: '12px auto 0 auto',
                    borderRadius: '2px',
                    boxShadow: `0 0 8px ${accent}80`,
                    opacity: 0.9,
                  }}
                />

                {isStudent && (
                  <div style={{ marginTop: '16px' }}>
                    <StudentStats profile={profile} />
                  </div>
                )}

                <div className="taply-bio" style={{ marginTop: isStudent ? '20px' : '24px' }}>
                  {profile.bio || 'Bio'}
                </div>

                {socialButtons.length > 0 && (
                  <a
                    href="#socials"
                    className="taply-primary-btn"
                    style={{ marginTop: '16px', display: 'inline-flex' }}
                  >
                    Let&apos;s Connect ↓
                  </a>
                )}
              </div>
            </section>

            {profile.about && (
              <section className="taply-section">
                <h2 style={{ color: '#D4AF37' }}>
                  <i className="fa-regular fa-user" style={{ color: '#D4AF37' }}></i> About Me
                </h2>
                <p>{profile.about}</p>
              </section>
            )}

            {isStudent && (
              <>
                {visibleEducation.hasAny && (
                  <section className="taply-section student-section">
                    <StudentEducation profile={profile} />
                  </section>
                )}
                {profile.spotify_url && (
                  <div className="taply-section">
                    <StudentSpotify spotifyUrl={profile.spotify_url} />
                  </div>
                )}
              </>
            )}

            {gallerySection}
            {quickActionsSection}
            {socialsSection}
            {contactSection}
            {footerSection}
          </main>
        </div>
      </div>

      {showPaymentModal &&
        (gcashQR || mayaQR) &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowPaymentModal(false)}
          >
            <div
              className="relative w-full max-w-[340px] overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#121214] shadow-[0_0_80px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative p-6 pb-2">
                <h3 className="mb-1 text-xl font-bold tracking-wide text-white">Scan to Pay</h3>
                <p className="text-[11px] text-[#A1A1A1]">Secure payment via e-wallet</p>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#1E1E20] text-gray-400 transition-colors hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="mb-4 px-6">
                <div className="flex rounded-xl border border-[#1E1E1E] bg-[#050505] p-1">
                  {gcashQR && (
                    <button
                      onClick={() => setActiveTab('gcash')}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                        activeTab === 'gcash'
                          ? 'bg-[#007DFE] text-white shadow-lg'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      GCash
                    </button>
                  )}
                  {mayaQR && (
                    <button
                      onClick={() => setActiveTab('maya')}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                        activeTab === 'maya'
                          ? 'bg-[#00D632] text-black shadow-lg'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Maya
                    </button>
                  )}
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="mb-3 flex items-center justify-between">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      activeTab === 'gcash' ? 'text-[#007DFE]' : 'text-[#00D632]'
                    }`}
                  >
                    {activeTab === 'gcash' ? 'GCash QR' : 'Maya QR'}
                  </p>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#00D632]">
                    <i className="fa-solid fa-circle-check"></i> Verified
                  </span>
                </div>
                <div className="mb-4 flex justify-center rounded-2xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeTab === 'gcash' ? gcashQR : mayaQR}
                    alt={`${activeTab} QR`}
                    className="h-[200px] w-[200px] rounded-xl object-contain"
                  />
                </div>
                <p className="mb-6 text-center text-[11px] leading-relaxed text-[#A1A1A1]">
                  Open your {activeTab === 'gcash' ? 'GCash' : 'Maya'} app, scan this code,
                  <br />
                  and enter the amount to pay.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handleSaveQR(
                        activeTab === 'gcash' ? gcashQR : mayaQR,
                        activeTab === 'gcash' ? 'GCash' : 'Maya'
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#1E1E20] py-3 text-xs font-bold text-white transition-colors hover:bg-[#2A2A2A]"
                  >
                    <i className="fa-solid fa-download"></i> Save
                  </button>
                  <button
                    onClick={() =>
                      handleShareQR(
                        activeTab === 'gcash' ? gcashQR : mayaQR,
                        activeTab === 'gcash' ? 'GCash' : 'Maya'
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#E8C766] py-3 text-xs font-bold text-black transition-colors hover:bg-[#D4AF37]"
                  >
                    <i className="fa-solid fa-share-nodes"></i> Share
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {lightboxOpen &&
        gallery[lightboxIndex] &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="bg-[#050505]/95 p-4 backdrop-blur-[16px]"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100000 }}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#2A2A2A] bg-[#121214] text-white hover:border-[#D4AF37]"
            >
              ×
            </button>
            <div
              className="relative flex items-center justify-center"
              style={{ width: '90vw', maxWidth: '900px', height: '70vh', margin: '0 auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-[#1E1E1E] bg-[#121214]"
                style={{ boxShadow: '0 0 80px rgba(212,175,55,0.15)' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                onDoubleClick={() => (zoom === 1 ? handleZoomIn() : handleReset())}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gallery[lightboxIndex].src}
                  alt={gallery[lightboxIndex].alt}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease',
                  }}
                  draggable={false}
                />
              </div>
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      prevImage()
                    }}
                    className="absolute left-0 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#2A2A2A] bg-[#121214] text-white hover:border-[#D4AF37] md:-left-12"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      nextImage()
                    }}
                    className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#2A2A2A] bg-[#121214] text-white hover:border-[#D4AF37] md:-right-12"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            <div
              className="mt-6 flex items-center gap-2 rounded-full border border-[#1E1E1E] bg-[#121214] px-4 py-2"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-[#A1A1A1]">
                {lightboxIndex + 1} / {gallery.length}
              </span>
              <div className="h-4 w-px bg-[#2A2A2A]" />
              <span className="text-xs text-white/50">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E1E1E] text-white disabled:opacity-30"
              >
                −
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E1E1E] text-white disabled:opacity-30"
              >
                +
              </button>
              <button
                onClick={handleReset}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E1E1E] text-white"
              >
                ⛶
              </button>
              <button
                onClick={closeLightbox}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/30 bg-red-500/20 text-red-400"
              >
                ×
              </button>
            </div>
            <p className="mt-3 text-[11px] text-white/30">
              Tap + to zoom • Arrows to navigate • Esc to close
            </p>
            {gallery.length > 1 && (
              <div className="mt-4 flex max-w-[90vw] justify-center gap-2 overflow-x-auto">
                {gallery.map((img: any, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img.src}
                    onClick={() => setLightboxIndex(i)}
                    className={`h-14 w-14 flex-shrink-0 cursor-pointer rounded-lg border-2 object-cover ${
                      i === lightboxIndex ? 'border-[#D4AF37]' : 'border-transparent opacity-60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  )
}