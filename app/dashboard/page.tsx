'use client'

import { useState, useEffect, useRef } from 'react'
import TaplyTemplate from '../../components/TaplyTemplate'
import UnifiedEditForm from '../../components/dashboard/UnifiedEditForm'
import { supabase } from '../../lib/supabase'
import HamburgerMenu from '@/components/HamburgerMenu'
import PaymentModal, { type PaymentSubmission } from '../../components/PaymentModal'
import { DEFAULT_SOCIALS, DEFAULT_VISIBLE } from '../../lib/profile-config'

const RECEIPT_BUCKET = 'payment-proofs'

const DEFAULT_PROFILE_DATA = {
  username: 'TapVinci',
  name: 'TapVinci',
  title: 'A NEW STANDARD OF INTRODUCTION • MADE TO CONNECT • PHILIPPINES 2026 ',
  bio: 'A simple tap. A smarter introduction. TapVinci turns calling cards into digital profiles where your contact details and links are easy to access and share.',
  about:
    'TapVinci helps professionals and local businesses get noticed - through NFC digital business cards that share contacts and links instantly. TapVinci goal is simple: make it personal, modern, and easy to share.',
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
  spotify_url: '',
  school: '',
  course: '',
  year_level: '',
  is_admin: false,
  gcash_qr_url: '',
  maya_qr_url: '',
  gcash_name: '',
  maya_name: '',
  gcash_number: '',
  maya_number: '',
  show_phone: true,
  show_email: true,
  show_address: true,
  show_school: true,
  show_year_level: true,
  show_course: true,
  show_bio: true,
  show_about: true,
  show_spotify: true,
  show_stats: true,
}

export default function Dashboard() {
  const [profile, setProfile] = useState<any>({ ...DEFAULT_PROFILE_DATA })

  const [adminSession, setAdminSession] = useState(false)
  const [forceAdminPreview, setForceAdminPreview] = useState(false)

  const isAdminAccount =
    profile.is_admin === true || String(profile.role || '').toLowerCase() === 'admin'

  const [saving, setSaving] = useState(false)
  const [showLive, setShowLive] = useState(false)
  const sliderWrapperRef = useRef<HTMLDivElement>(null)
  const editPanelRef = useRef<HTMLDivElement>(null)
  const livePreviewRef = useRef<HTMLDivElement>(null)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const [demoCode, setDemoCode] = useState('')
  const [showDemoCode, setShowDemoCode] = useState(false)

  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === 'true') {
      setShowDemoCode(true)
      setForceAdminPreview(true)
    }

    try {
      if (sessionStorage.getItem('tapvinci_admin_ok') === '1') setAdminSession(true)
    } catch {}
  }, [])

  useEffect(() => {
    const wrapper = sliderWrapperRef.current
    const activeEl = showLive ? livePreviewRef.current : editPanelRef.current
    if (!wrapper || !activeEl) return
    const updateHeight = () => {
      wrapper.style.height = activeEl.scrollHeight + 'px'
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    const timer = setTimeout(updateHeight, 300)
    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateHeight)
      observer.observe(activeEl)
      if (activeEl.firstElementChild) observer.observe(activeEl.firstElementChild)
    }
    return () => {
      window.removeEventListener('resize', updateHeight)
      clearTimeout(timer)
      observer?.disconnect()
    }
  }, [showLive, profile])

  useEffect(() => {
    const load = async () => {
      const editParam = (
        new URLSearchParams(window.location.search).get('edit') || ''
      )
        .trim()
        .toLowerCase()
      const username = (
        editParam ||
        process.env.NEXT_PUBLIC_DEFAULT_USERNAME ||
        'TapVinci'
      ).toLowerCase()

      const { data } = await supabase.from('profiles').select('*').eq('username', username).single()
      if (!data) return

      setProfile((previous: any) => ({
        ...previous,
        ...data,
        socials: { ...DEFAULT_SOCIALS, ...(data.socials || {}) },
        socials_visible: { ...DEFAULT_VISIBLE, ...(data.socials_visible || {}) },
      }))
    }
    load()
  }, [])

  const validateProfile = () => {
    const username = (profile.username || '').trim().toLowerCase()
    const name = (profile.name || '').trim()

    if (!username || !name) {
      showToast('Username and Name are required.')
      return false
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      showToast('Username can only use letters, numbers, hyphens, and underscores.')
      return false
    }
    return true
  }

  const isDuplicateUsername = (error: unknown) => {
    const candidate = error as { code?: string; message?: string } | null
    return (
      candidate?.code === '23505' ||
      /duplicate key|already exists|unique constraint/i.test(candidate?.message || '')
    )
  }

  const handleSaveProfile = async () => {
    if (!validateProfile()) return

    // BYPASSED FOR TESTING: Removed the early return that opened the payment modal
    // if (!isAdminAccount) {
    //   setIsPaymentModalOpen(true)
    //   return
    // }

    setSaving(true)
    const fixedUsername = String(profile.username || '').trim().toLowerCase()

    const rest: Record<string, any> = { ...profile }
    for (const key of [
      'id',
      'created_at',
      'updated_at',
      'views',
      'receipt_url',
      'payment_status',
      'is_active',
      'is_admin',
      'is_demo',
      'paid_at',
      'fulfillment',
      'fulfilled_at',
      'deactivated_at',
      'package',
      'plan_tier',
      'plan_amount',
      'payment_method',
      'owner_id',
      'claimed_by',
      'role',
      'tier',
      'taps',
      'streak',
      'tap_count',
      'streak_count',
      'last_tap_date',
    ]) {
      delete rest[key]
    }

    try {
      const fixed = {
        ...rest,
        username: fixedUsername,
        is_admin: profile.is_admin === true, // Only preserve true admins
        is_active: true, // Force active for users who just claimed a card
        payment_status: 'paid', // Mark as paid so it skips the modal
        paid_at: profile.paid_at || new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(fixed, { onConflict: 'username' })
        .select('*')
        .single()

      if (error) throw error
      if (!data) throw new Error('The database did not return the saved profile.')

      setProfile((previous: any) => ({
        ...previous,
        ...data,
        socials: { ...DEFAULT_SOCIALS, ...(data.socials || {}) },
        socials_visible: { ...DEFAULT_VISIBLE, ...(data.socials_visible || {}) },
        is_admin: profile.is_admin === true,
        is_active: true,
        payment_status: 'paid',
      }))

      showToast('Profile updated successfully')
    } catch (error) {
      console.error('[Admin save] Profile save failed:', error)
      showToast(
        isDuplicateUsername(error)
          ? 'That username is already taken. Please choose another one.'
          : 'Could not save profile. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmPayment = async ({
    receiptFile,
    planTier,
    planAmount,
    paymentMethod,
  }: PaymentSubmission) => {
    setSaving(true)
    const fixedUsername = String(profile.username || '').trim().toLowerCase()

    const { id: _id, created_at: _createdAt, role: _role, tier: _tier, ...rest } = profile

    try {
      const rawExt = receiptFile.name.split('.').pop()?.toLowerCase() || ''
      const fileExt = /^(jpe?g|png|pdf)$/.test(rawExt)
        ? rawExt
        : receiptFile.type === 'application/pdf'
          ? 'pdf'
          : receiptFile.type === 'image/png'
            ? 'png'
            : 'jpg'

      const path = `${fixedUsername}/receipts/receipt-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .upload(path, receiptFile)
      if (uploadError) throw new Error('Receipt upload failed. Please try again.')

      const receiptUrl = supabase.storage.from(RECEIPT_BUCKET).getPublicUrl(path).data.publicUrl
      const isDemoAccount = demoCode.trim() === process.env.NEXT_PUBLIC_DEMO_SECRET_CODE

      const fixed = {
        ...rest,
        username: fixedUsername,
        role: 'professional',
        receipt_url: receiptUrl,
        payment_status: 'pending',
        is_active: false,
        is_demo: isDemoAccount,
        package: planTier,
        plan_tier: planTier,
        plan_amount: planAmount,
        payment_method: paymentMethod,
      }

      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', fixed.username)
        .maybeSingle()
      const isNewProfile = !existing

      const { data: saved, error: dbError } = await supabase
        .from('profiles')
        .upsert(fixed, { onConflict: 'username' })
        .select('*')
        .single()

      if (dbError) {
        throw new Error(
          isDuplicateUsername(dbError)
            ? 'That username is already taken. Please choose another one.'
            : 'Database save failed. Please try again.'
        )
      }
      if (!saved) throw new Error('Database save failed. Please try again.')

      setProfile((previous: any) => ({
        ...previous,
        ...saved,
        socials: { ...DEFAULT_SOCIALS, ...(saved.socials || {}) },
        socials_visible: { ...DEFAULT_VISIBLE, ...(saved.socials_visible || {}) },
      }))

      try {
        fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: fixed.username,
            type: isNewProfile ? 'created' : 'updated',
          }),
          keepalive: true,
        }).catch(() => {})
      } catch {}
    } catch (error) {
      console.error('[Checkout] Payment submission failed:', error)
      throw error instanceof Error ? error : new Error('Payment submission failed.')
    } finally {
      setSaving(false)
    }
  }

  void adminSession
  void forceAdminPreview

  return (
    <>
      <HamburgerMenu />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      <style jsx global>{`
        .dashboard-slider-wrapper { overflow: hidden !important; display: block !important; }
        .dashboard-slider { height: auto !important; min-height: auto !important; align-items: flex-start !important; }
        .edit-panel { height: auto !important; min-height: auto !important; padding-bottom: 24px !important; margin-bottom: 0 !important; }
        .live-panel { height: auto !important; min-height: auto !important; padding-bottom: 0 !important; margin-bottom: 0 !important; }
        .floating-toggle-btn { transition: opacity .3s ease, transform .3s ease; }
        body:has(.menu-panel.open) .floating-toggle-btn { opacity: 0 !important; transform: translateY(16px) !important; pointer-events: none !important; }
        .live-panel .taply-gold-wrapper { min-height: auto !important; height: auto !important; min-height: 0 !important; padding-bottom: 0 !important; }
      `}</style>

      {!showLive && (
        <button
          onClick={() => setShowLive(true)}
          className="floating-toggle-btn fixed bottom-6 right-6 z-[30] rounded-full border border-black/10 px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.15em] shadow-[0_8px_32px_rgba(212,175,55,0.4)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] md:bottom-8 md:right-8"
          style={{ background: '#D4AF37', color: '#050505' }}
        >
          LIVE PREVIEW ↓
        </button>
      )}
      {showLive && (
        <button
          onClick={() => setShowLive(false)}
          className="floating-toggle-btn fixed bottom-6 right-6 z-[30] rounded-full border border-black/10 px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.15em] shadow-[0_8px_32px_rgba(212,175,55,0.4)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] md:bottom-8 md:right-8"
          style={{ background: '#D4AF37', color: '#050505' }}
        >
          ↑ BACK TO EDIT
        </button>
      )}

      <div className="h-auto min-h-0 bg-[#050505] p-4 pb-6 text-white" style={{ height: 'auto', minHeight: 0 }}>
        <div
          className="dashboard-slider-wrapper h-auto min-h-0 w-full overflow-hidden"
          ref={sliderWrapperRef}
          style={{ transition: 'height 0.3s ease' }}
        >
          <div
            className="dashboard-slider flex w-[200%] items-start will-change-transform"
            style={{
              transform: showLive ? 'translateX(-50%) translate3d(0,0,0)' : 'translateX(0) translate3d(0,0,0)',
              transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <div
              ref={editPanelRef}
              className="h-auto min-h-0 w-[50%] flex-shrink-0 px-1 lg:px-3"
              style={{ height: 'auto', minHeight: 0 }}
            >
              <div className="mx-auto h-auto min-h-0 max-w-7xl" style={{ height: 'auto', minHeight: 0 }}>
                <div
                  className="edit-panel h-auto min-h-0 space-y-4 rounded-2xl bg-zinc-900 p-6 pb-6"
                  style={{ height: 'auto', minHeight: 0 }}
                >
                  <UnifiedEditForm
                    profile={profile}
                    setProfile={setProfile}
                    onSave={handleSaveProfile}
                    saving={saving}
                    isAdminAccount={isAdminAccount}
                    showDemoCode={showDemoCode}
                    demoCode={demoCode}
                    setDemoCode={setDemoCode}
                    showToast={showToast}
                  />
                </div>
              </div>
            </div>

            <div className="h-auto min-h-0 w-[50%] flex-shrink-0 px-1 lg:px-3">
              <div className="mx-auto h-auto min-h-0 max-w-7xl">
                <div
                  ref={livePreviewRef}
                  id="live-preview-section"
                  className="live-panel h-auto min-h-0 scroll-mt-24 pb-6"
                >
                  <TaplyTemplate profile={profile} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="success-toast" role="status">
          {toast}
        </div>
      )}
    </>
  )
}