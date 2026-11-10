'use client'

import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { supabase } from '../../lib/supabase'
import { SOCIALS_CONFIG, THEMES, isValidSpotifyUrl } from '../../lib/profile-config'
import { Field, VisibilityToggle, inputCls, labelCls } from './FormControls'

const BUCKET = 'profile-images'
const MAX_INPUT_BYTES = 20 * 1024 * 1024

type UploadKind = 'hero' | 'gallery' | 'gcash' | 'maya'

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">{children}</p>
  )
}

export type UnifiedEditFormProps = {
  profile: any
  setProfile: Dispatch<SetStateAction<any>>
  onSave: () => void | Promise<void>
  saving: boolean
  isStudent: boolean
  isAdminAccount: boolean
  showDemoCode: boolean
  demoCode: string
  setDemoCode: (value: string) => void
  showToast: (message: string) => void
  /** Hide the form's own "Edit Profile" header (used inside the edit drawer). */
  embedded?: boolean
  /** Make the username read-only (professional cards are printed with it). */
  lockUsername?: boolean
}

export default function UnifiedEditForm({
  profile,
  setProfile,
  onSave,
  saving,
  isStudent,
  isAdminAccount,
  showDemoCode,
  demoCode,
  setDemoCode,
  showToast,
  embedded = false,
  lockUsername = false,
}: UnifiedEditFormProps) {
  const heroInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const gcashInputRef = useRef<HTMLInputElement>(null)
  const mayaInputRef = useRef<HTMLInputElement>(null)

  const [heroUploading, setHeroUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [gcashUploading, setGcashUploading] = useState(false)
  const [mayaUploading, setMayaUploading] = useState(false)

  const [dragOverHero, setDragOverHero] = useState(false)
  const [dragOverGallery, setDragOverGallery] = useState(false)
  const [dragOverGcash, setDragOverGcash] = useState(false)
  const [dragOverMaya, setDragOverMaya] = useState(false)

  const socials = profile.socials || {}
  const socialsVisible = profile.socials_visible || {}

  const activeSocialCount = SOCIALS_CONFIG.filter(
    (s) => socialsVisible[s.key] !== false && socials[s.key]?.trim()
  ).length

  const uploading = heroUploading || galleryUploading || gcashUploading || mayaUploading

  const patch = (values: Record<string, any>) => {
    setProfile((previous: any) => ({ ...previous, ...values }))
  }

  const toggleVisibility = (key: string) => {
    setProfile((previous: any) => {
      const isCurrentlyVisible = previous.socials_visible?.[key] !== false
      return {
        ...previous,
        socials_visible: { ...previous.socials_visible, [key]: !isCurrentlyVisible },
      }
    })
  }

  const toggleProfileFlag = (key: string) => {
    setProfile((previous: any) => {
      const isCurrentlyVisible = previous[key] !== false
      return { ...previous, [key]: !isCurrentlyVisible }
    })
  }

  const uploadToSupabase = async (file: File, kind: UploadKind): Promise<string | null> => {
    const username = String(profile.username || '').toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!username) {
      showToast('Type a username first — photos are stored under it.')
      return null
    }
    if (file.size > MAX_INPUT_BYTES) {
      showToast(`${file.name} is too large (max ${MAX_INPUT_BYTES / 1024 / 1024} MB).`)
      return null
    }
    try {
      const { maxWidth, quality } = UPLOAD_OPTS[kind]
      const compressed = await compressImage(file, maxWidth, quality)
      const safeName =
        file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) || 'photo'
      const stamp = Date.now()
      const isQR = kind === 'gcash' || kind === 'maya'
      const path =
        kind === 'hero'
          ? `${username}/avatar/${stamp}-avatar.webp`
          : kind === 'gallery'
            ? `${username}/gallery/${stamp}-${safeName}.webp`
            : `${username}/payment/${kind}-qr.webp`

      const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
        cacheControl: '3600',
        upsert: isQR,
        contentType: 'image/webp',
      })
      if (error) throw error
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      return isQR ? `${url}?v=${stamp}` : url
    } catch (error) {
      showToast(
        'Upload failed: ' +
          ((error as Error)?.message || 'unknown error') +
          ' — make sure the profile-images bucket exists.'
      )
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
    if (url) patch({ hero_image: url })
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
      setProfile((previous: any) => ({
        ...previous,
        gallery: [...(previous.gallery || []), ...newItems],
      }))
    }
  }

  const handleGcashFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    setGcashUploading(true)
    const url = await uploadToSupabase(file, 'gcash')
    setGcashUploading(false)
    if (url) patch({ gcash_qr_url: url })
  }

  const handleMayaFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    setMayaUploading(true)
    const url = await uploadToSupabase(file, 'maya')
    setMayaUploading(false)
    if (url) patch({ maya_qr_url: url })
  }

  const removeGalleryItem = (index: number) => {
    setProfile((previous: any) => ({
      ...previous,
      gallery: (previous.gallery || []).filter((_: any, i: number) => i !== index),
    }))
  }

  const gallery = profile.gallery || []
  const accent = profile.accent_color || (isStudent ? '#22c55e' : '#D4AF37')
  const mapsVisible = socialsVisible.google_maps !== false

  return (
    <div className="space-y-4">
      {/* HEADER */}
      {!embedded && (
        <>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              {isStudent ? 'Student experience' : 'Professional experience'}
            </p>
            <h1 className="mt-0.5 text-xl font-bold">Edit Profile</h1>
          </div>
          <span
            className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
              isStudent
                ? 'border-[#00D632]/30 bg-[#00D632]/10 text-[#00D632]'
                : 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]'
            }`}
          >
            <i className={`fa-solid ${isStudent ? 'fa-graduation-cap' : 'fa-briefcase'}`} />
            {isStudent ? 'Student' : 'Professional'}
          </span>
        </div>
        </>
      )}

      {/* ACCOUNT */}
      <div className="grid gap-3 border-t border-zinc-800 pt-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Username</span>
          <input
            value={profile.username || ''}
            onChange={(event) => patch({ username: event.target.value.toLowerCase() })}
            className={`${inputCls} ${lockUsername ? 'cursor-not-allowed opacity-60' : ''}`}
            placeholder="your-name"
            autoComplete="username"
            readOnly={lockUsername}
            aria-readonly={lockUsername}
          />
          {lockUsername && (
            <span className="mt-1 block text-[10px] text-zinc-500">
              Your card link uses this username, so it can’t be changed here.
            </span>
          )}
        </label>
        <label className="block">
          <span className={labelCls}>Name</span>
          <input
            value={profile.name || ''}
            onChange={(event) => patch({ name: event.target.value })}
            className={inputCls}
            placeholder="Your full name"
            autoComplete="name"
          />
        </label>
      </div>

      {/* PROFILE PHOTO */}
      <div className="space-y-2 border-t border-zinc-800 pt-4">
        <SectionTitle>Profile Photo</SectionTitle>
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragOverHero(true)
          }}
          onDragLeave={() => setDragOverHero(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOverHero(false)
            handleHeroFiles(event.dataTransfer.files)
          }}
          onClick={() => heroInputRef.current?.click()}
          className={`relative w-full cursor-pointer rounded-xl border-2 border-dashed p-4 transition-all ${
            dragOverHero
              ? 'border-[#D4AF37] bg-[#D4AF37]/10'
              : 'border-zinc-700 bg-zinc-950/40 hover:border-zinc-600'
          }`}
        >
          <input
            ref={heroInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleHeroFiles(event.target.files)}
          />
          {profile.hero_image ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.hero_image} alt="Hero preview" className="h-16 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-white">
                  {heroUploading ? 'Uploading...' : 'Profile photo set'}
                </p>
                <p className="mt-1 text-[11px] text-[#D4AF37]">Click or drag a new image to replace</p>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center">
              <div className="mb-1 text-2xl">📸</div>
              <p className="text-xs font-semibold text-white">
                {heroUploading ? 'Uploading...' : 'Drop profile photo here'}
              </p>
              <p className="text-[11px] text-zinc-400">This is the image at the top of your card</p>
            </div>
          )}
          {heroUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
              <div className="text-xs text-[#D4AF37]">Uploading...</div>
            </div>
          )}
        </div>
      </div>

      {/* THEMES */}
      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <SectionTitle>Themes</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => patch({ accent_color: theme.hex, theme: theme.id })}
              className={`rounded-xl border-2 p-3 text-left transition ${
                profile.theme === theme.id
                  ? 'scale-[1.02] border-white'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded-full border border-white/20"
                  style={{ background: theme.hex }}
                />
                <span className="text-xs font-bold">{theme.name}</span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">
                {theme.desc} • {theme.hex}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* HERO CONTENT */}
      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <SectionTitle>Hero</SectionTitle>
        <label className="block">
          <span className={labelCls}>Title</span>
          <input
            value={profile.title || ''}
            onChange={(event) => patch({ title: event.target.value })}
            className={inputCls}
            placeholder="WEB DEVELOPER | TAPVINCI FOUNDER..."
          />
        </label>
        <label className="block">
          <span className={labelCls}>Bio</span>
          <textarea
            value={profile.bio || ''}
            onChange={(event) => patch({ bio: event.target.value })}
            rows={3}
            className={inputCls}
            placeholder="A simple tap. A smarter introduction..."
          />
        </label>
        <label className="block">
          <span className={labelCls}>About Me</span>
          <textarea
            value={profile.about || ''}
            onChange={(event) => patch({ about: event.target.value })}
            rows={4}
            className={inputCls}
            placeholder="Hi, I'm Shua, owner of TapVinci..."
          />
        </label>
      </div>

      {/* STUDENT DETAILS — only for student profiles */}
      {isStudent && (
        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle>
              <span className="inline-flex items-center gap-2">
                <i className="fa-solid fa-graduation-cap" />
                Student Details
              </span>
            </SectionTitle>
          </div>
          <p className="text-[11px] text-zinc-500">
            These fields appear on your card only. Use Show / Hide to control what is public.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="School"
              visible={profile.show_school !== false}
              onToggle={() => toggleProfileFlag('show_school')}
            >
              <input
                value={profile.school || ''}
                onChange={(event) => patch({ school: event.target.value })}
                className={inputCls}
                placeholder="Your school"
              />
            </Field>
            <Field
              label="Year Level"
              visible={profile.show_year_level !== false}
              onToggle={() => toggleProfileFlag('show_year_level')}
            >
              <input
                value={profile.year_level || ''}
                onChange={(event) => patch({ year_level: event.target.value })}
                className={inputCls}
                placeholder="e.g. 2nd Year"
              />
            </Field>
          </div>

          <Field
            label="Course"
            visible={profile.show_course !== false}
            onToggle={() => toggleProfileFlag('show_course')}
          >
            <input
              value={profile.course || ''}
              onChange={(event) => patch({ course: event.target.value })}
              className={inputCls}
              placeholder="e.g. BS Computer Science"
            />
          </Field>

          <Field label="Spotify Link">
            <input
              value={profile.spotify_url || ''}
              onChange={(event) => patch({ spotify_url: event.target.value })}
              className={inputCls}
              placeholder="https://open.spotify.com/track/..."
              inputMode="url"
            />
            <p className="mt-1.5 text-[10px] text-zinc-500">
              Paste a track, album, or playlist link. It appears on your student card.
            </p>
            {profile.spotify_url && !isValidSpotifyUrl(profile.spotify_url) && (
              <p className="mt-1 text-[10px] text-red-400">
                That doesn&apos;t look like a Spotify link yet.
              </p>
            )}
          </Field>
        </div>
      )}

      {/* GALLERY */}
      <div className="space-y-2 border-t border-zinc-800 pt-4">
        <SectionTitle>Gallery</SectionTitle>
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragOverGallery(true)
          }}
          onDragLeave={() => setDragOverGallery(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOverGallery(false)
            handleGalleryFiles(event.dataTransfer.files)
          }}
          onClick={() => galleryInputRef.current?.click()}
          className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            dragOverGallery
              ? 'border-[#D4AF37] bg-[#D4AF37]/10'
              : 'border-zinc-700 bg-zinc-950/40 hover:border-zinc-600'
          }`}
        >
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleGalleryFiles(event.target.files)}
          />
          <div className="mb-1 text-2xl">🖼</div>
          <p className="text-xs font-semibold text-white">
            {galleryUploading ? 'Uploading...' : 'Drop images here'}
          </p>
          <p className="text-[11px] text-zinc-400">or click to pick from your computer — multiple allowed</p>
        </div>
        {gallery.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-[11px] text-[#D4AF37]">
              ✓ {gallery.length} image(s) saved — visible in Live Preview
            </p>
            {gallery.map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 px-3 py-2"
              >
                <span className="truncate text-[11px] text-zinc-400">/gallery-{index + 1}.webp</span>
                <button
                  type="button"
                  onClick={() => removeGalleryItem(index)}
                  className="text-[11px] text-zinc-500 transition hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SOCIAL LINKS */}
      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between">
          <SectionTitle>Social Links</SectionTitle>
          <span className="rounded-full bg-zinc-800 px-2 py-1 text-[10px]">{activeSocialCount} visible</span>
        </div>
        <p className="text-[11px] text-zinc-500">
          👁 Show = visible, 🙈 Hide = hidden but saved. Order matches Live Preview.
        </p>

        {SOCIALS_CONFIG.map((social) => {
          const hasUrl = !!socials[social.key]?.trim()
          const isVisible = socialsVisible[social.key] !== false
          const willShow = hasUrl && isVisible
          return (
            <div
              key={social.key}
              className={`rounded-xl border p-3 transition-all ${
                willShow ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-800/50 bg-zinc-800/50 opacity-75'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className={`flex items-center gap-2 text-xs font-bold ${social.color}`}>
                  {social.label}
                  {!hasUrl && (
                    <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-400">EMPTY</span>
                  )}
                  {hasUrl && !isVisible && (
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] text-red-300">HIDDEN</span>
                  )}
                  {willShow && (
                    <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[9px] text-green-300">VISIBLE</span>
                  )}
                </label>
                <VisibilityToggle
                  visible={isVisible}
                  onToggle={() => toggleVisibility(social.key)}
                  label={social.label}
                />
              </div>
              <input
                value={socials[social.key] || ''}
                onChange={(event) =>
                  patch({ socials: { ...socials, [social.key]: event.target.value } })
                }
                className={inputCls}
                placeholder={social.placeholder}
              />
            </div>
          )
        })}
      </div>

      {/* QUICK ACTIONS & CONTACT */}
      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <SectionTitle>Quick Actions & Contact Info</SectionTitle>
        <p className="text-[11px] text-zinc-500">
          Controls the Quick Actions row and the Contact section. Matches Live Preview order.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <Field
            label="Phone"
            visible={profile.show_phone !== false}
            onToggle={() => toggleProfileFlag('show_phone')}
          >
            <input
              value={profile.phone || ''}
              onChange={(event) => patch({ phone: event.target.value })}
              className={inputCls}
              placeholder="+63 9XX XXX XXXX"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>

          <Field
            label="Email"
            visible={profile.show_email !== false}
            onToggle={() => toggleProfileFlag('show_email')}
          >
            <input
              value={profile.email || ''}
              onChange={(event) => patch({ email: event.target.value })}
              className={inputCls}
              placeholder="you@email.com"
              inputMode="email"
              autoComplete="email"
            />
          </Field>

          <Field
            label="Address"
            visible={profile.show_address !== false}
            onToggle={() => toggleProfileFlag('show_address')}
          >
            <input
              value={profile.address || ''}
              onChange={(event) => patch({ address: event.target.value })}
              className={inputCls}
              placeholder="City, Country"
              autoComplete="street-address"
            />
          </Field>

          <Field
            label="Google Maps Link"
            visible={mapsVisible}
            onToggle={() => toggleVisibility('google_maps')}
            hint={
              mapsVisible
                ? '✅ Google Maps button visible on your card.'
                : '🙈 Google Maps hidden — the address is still saved.'
            }
          >
            <input
              value={profile.mapsLink || ''}
              onChange={(event) => patch({ mapsLink: event.target.value })}
              className={inputCls}
              placeholder="https://maps.app.goo.gl/..."
              inputMode="url"
            />
          </Field>
        </div>
      </div>

      {/* PAYMENT QR CODES */}
      <div className="space-y-4 border-t border-zinc-800 pt-6">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[1px] text-zinc-400">
            <i className="fa-solid fa-qrcode text-[#D4AF37]" /> Payment QR Codes (for your customers)
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Upload your GCash / Maya QR so your customers can pay you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* GCASH */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">GCash QR</p>
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragOverGcash(true)
              }}
              onDragLeave={() => setDragOverGcash(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOverGcash(false)
                handleGcashFiles(event.dataTransfer.files)
              }}
              onClick={() => gcashInputRef.current?.click()}
              className={`group w-full cursor-pointer rounded-xl border border-dashed p-6 text-center transition-all ${
                dragOverGcash
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                  : 'border-zinc-700 bg-zinc-950/40 hover:border-zinc-500'
              }`}
            >
              <input
                ref={gcashInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(event) => handleGcashFiles(event.target.files)}
              />
              <div className="flex flex-col items-center">
                {profile.gcash_qr_url ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.gcash_qr_url}
                      alt="GCash"
                      className="h-12 w-12 rounded-lg bg-white object-contain p-1"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 transition-all group-hover:opacity-100">
                      <span className="text-[10px] font-bold text-white">Change</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                    <i className="fa-solid fa-qrcode text-[12px] text-zinc-400" />
                  </div>
                )}
                <p className="mt-2 text-[13px] font-semibold text-white">
                  {gcashUploading ? 'Uploading...' : 'Drop GCash QR here'}
                </p>
              </div>
            </div>
          </div>

          {/* MAYA */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Maya QR</p>
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragOverMaya(true)
              }}
              onDragLeave={() => setDragOverMaya(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOverMaya(false)
                handleMayaFiles(event.dataTransfer.files)
              }}
              onClick={() => mayaInputRef.current?.click()}
              className={`group w-full cursor-pointer rounded-xl border border-dashed p-6 text-center transition-all ${
                dragOverMaya
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                  : 'border-zinc-700 bg-zinc-950/40 hover:border-zinc-500'
              }`}
            >
              <input
                ref={mayaInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(event) => handleMayaFiles(event.target.files)}
              />
              <div className="flex flex-col items-center">
                {profile.maya_qr_url ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.maya_qr_url}
                      alt="Maya"
                      className="h-12 w-12 rounded-lg bg-white object-contain p-1"
                    />
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 transition-all group-hover:opacity-100">
                      <span className="text-[10px] font-bold text-white">Change</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                    <i className="fa-solid fa-qrcode text-[12px] text-zinc-400" />
                  </div>
                )}
                <p className="mt-2 text-[13px] font-semibold text-white">
                  {mayaUploading ? 'Uploading...' : 'Drop Maya QR here'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HIDDEN DEMO CODE */}
      {showDemoCode && (
        <div className="mt-4 space-y-1 border-t border-zinc-800 pt-4">
          <label className="block">
            <span className={labelCls}>🔒 Admin only: demo secret code</span>
            <input
              value={demoCode}
              onChange={(event) => setDemoCode(event.target.value)}
              className={inputCls}
              placeholder="Type the secret code to create a demo"
            />
          </label>
          <p className="text-[9px] text-zinc-500">This field is hidden from public users.</p>
        </div>
      )}

      {/* SAVE */}
      <button
        type="button"
        onClick={() => void onSave()}
        disabled={saving || uploading}
        className="w-full rounded-xl py-3 font-bold transition hover:brightness-110 disabled:opacity-50"
        style={{ background: accent, color: 'black' }}
      >
        {saving ? 'Saving...' : isAdminAccount ? 'Save Profile (Admin)' : 'Save Profile'}
      </button>
    </div>
  )
}