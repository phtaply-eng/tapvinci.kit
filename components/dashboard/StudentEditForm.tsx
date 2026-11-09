'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  DEFAULT_VISIBLE,
  SOCIALS_CONFIG,
  isValidSpotifyUrl,
} from '../../lib/profile-config'

type StudentEditFormProps = {
  profile: any
  onSaved?: () => void | Promise<void>
}

const inputCls =
  'w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/10'

const labelCls =
  'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400'

function normaliseSocials(value: any) {
  // Start empty. DEFAULT_SOCIALS in the professional dashboard contains
  // placeholder URLs; we do not want a student's first save to publish those.
  const base: Record<string, string> = {}
  for (const social of SOCIALS_CONFIG) base[social.key] = ''
  return { ...base, ...(value || {}) } as Record<string, string>
}

function normaliseVisible(value: any) {
  return { ...DEFAULT_VISIBLE, ...(value || {}) } as Record<string, boolean>
}

export default function StudentEditForm({ profile, onSaved }: StudentEditFormProps) {
  const [username, setUsername] = useState(profile.username || '')
  const [school, setSchool] = useState(profile.school || '')
  const [course, setCourse] = useState(profile.course || '')
  const [yearLevel, setYearLevel] = useState(profile.year_level || '')
  const [spotifyUrl, setSpotifyUrl] = useState(profile.spotify_url || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [socials, setSocials] = useState<Record<string, string>>(() => normaliseSocials(profile.socials))
  const [socialsVisible, setSocialsVisible] = useState<Record<string, boolean>>(() =>
    normaliseVisible(profile.socials_visible)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // The dashboard loads the real row asynchronously. Reset the form when a
  // different profile is loaded (id changes from '' to the real UUID).
  useEffect(() => {
    setUsername(profile.username || '')
    setSchool(profile.school || '')
    setCourse(profile.course || '')
    setYearLevel(profile.year_level || '')
    setSpotifyUrl(profile.spotify_url || '')
    setBio(profile.bio || '')
    setSocials(normaliseSocials(profile.socials))
    setSocialsVisible(normaliseVisible(profile.socials_visible))
    setError('')
    setSuccess('')
  }, [profile.id])

  const spotifyIsValid = useMemo(() => isValidSpotifyUrl(spotifyUrl), [spotifyUrl])
  const hasSpotify = Boolean(spotifyUrl.trim())

  const toggleSocial = (key: string) => {
    setSocialsVisible((current) => ({ ...current, [key]: !current[key] }))
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    const nextUsername = username.trim().toLowerCase()
    if (!nextUsername) {
      setError('Username is required.')
      return
    }
    if (!/^[a-z0-9_-]+$/.test(nextUsername)) {
      setError('Username can only use letters, numbers, hyphens, and underscores.')
      return
    }
    if (!spotifyIsValid) {
      setError('That does not look like a Spotify link. Use a track, album, or playlist URL.')
      return
    }

    setSaving(true)

    const payload = {
      username: nextUsername,
      school: school.trim() || null,
      course: course.trim() || null,
      year_level: yearLevel.trim() || null,
      spotify_url: spotifyUrl.trim() || null,
      bio: bio.trim() || null,
      socials,
      socials_visible: socialsVisible,
    }

    let query = supabase.from('profiles').update(payload)
    const { error: saveError } = profile.id
      ? await query.eq('id', profile.id)
      : await query.eq('username', String(profile.username || '').toLowerCase())

    if (saveError) {
      setSaving(false)
      setError(saveError.message)
      return
    }

    // Keep the legacy student_profiles row in sync for the existing
    // record_student_tap RPC and for older deployments. If the table or the
    // new columns are missing, the profiles save above is still the source of
    // truth, so this is intentionally best-effort.
    if (profile.id) {
      const { error: legacyError } = await supabase.from('student_profiles').upsert(
        {
          id: profile.id,
          school: payload.school,
          course: payload.course,
          year_level: payload.year_level,
          spotify_url: payload.spotify_url,
        },
        { onConflict: 'id' }
      )
      if (legacyError) {
        console.warn('[StudentEditForm] Legacy student_profiles sync skipped:', legacyError.message)
      }
    }

    setSaving(false)
    setSuccess('Student profile saved.')
    await onSaved?.()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-950 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500 text-black shadow-[0_8px_24px_rgba(34,197,94,0.28)]">
            <i className="fa-solid fa-graduation-cap text-lg" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-400">
              Student profile
            </p>
            <h2 className="mt-0.5 text-xl font-bold text-white">Edit your student card</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Only the fields that appear on your student layout. Changes go live as soon as you save.
            </p>
          </div>
        </div>
      </div>

      {/* Identity + education */}
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/20 text-[10px] text-emerald-400">
            <i className="fa-regular fa-id-card" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">Identity</p>
        </div>

        <label className="block">
          <span className={labelCls}>Username</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
              @
            </span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              className={`${inputCls} pl-8`}
              placeholder="your-name"
              autoComplete="username"
            />
          </div>
          <p className="mt-1.5 text-[10px] text-zinc-500">
            Your public link: /{username.trim().toLowerCase() || 'your-name'}
          </p>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>School</span>
            <input
              value={school}
              onChange={(event) => setSchool(event.target.value)}
              className={inputCls}
              placeholder="Your school"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Year Level</span>
            <input
              value={yearLevel}
              onChange={(event) => setYearLevel(event.target.value)}
              className={inputCls}
              placeholder="e.g. 2nd Year"
            />
          </label>
        </div>

        <label className="block">
          <span className={labelCls}>Course</span>
          <input
            value={course}
            onChange={(event) => setCourse(event.target.value)}
            className={inputCls}
            placeholder="e.g. BS Computer Science"
          />
        </label>
      </div>

      {/* Spotify + bio */}
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-500/20 text-[10px] text-sky-400">
            <i className="fa-brands fa-spotify" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-400">Spotify & Bio</p>
        </div>

        <label className="block">
          <span className={labelCls}>Spotify Link</span>
          <input
            value={spotifyUrl}
            onChange={(event) => setSpotifyUrl(event.target.value)}
            className={inputCls}
            placeholder="https://open.spotify.com/track/..."
            inputMode="url"
          />
          <p className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${hasSpotify && !spotifyIsValid ? 'text-red-400' : 'text-zinc-500'}`}>
            <i className={`fa-solid ${hasSpotify && !spotifyIsValid ? 'fa-circle-exclamation' : 'fa-circle-info'}`} />
            {hasSpotify && !spotifyIsValid
              ? 'That does not look like a valid Spotify link yet.'
              : 'Paste a track, album, or playlist link. It appears as a compact player on your card.'}
          </p>
        </label>

        <label className="block">
          <span className={labelCls}>Bio</span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={4}
            maxLength={280}
            className={`${inputCls} resize-none`}
            placeholder="A short intro about you, your course, or what you are working on."
          />
          <p className="mt-1.5 text-right text-[10px] text-zinc-500">{bio.length}/280</p>
        </label>
      </div>

      {/* Socials */}
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/20 text-[10px] text-emerald-400">
              <i className="fa-solid fa-link" />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">Socials</p>
          </div>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[9px] font-semibold text-zinc-400">
            {SOCIALS_CONFIG.filter((social) => socials[social.key]?.trim()).length} added
          </span>
        </div>

        <div className="space-y-2.5">
          {SOCIALS_CONFIG.map((social) => {
            const value = socials[social.key] || ''
            const hasUrl = Boolean(value.trim())
            const isVisible = socialsVisible[social.key] !== false

            return (
              <div
                key={social.key}
                className={`rounded-xl border p-3 transition ${
                  hasUrl ? 'border-zinc-700 bg-zinc-950/50' : 'border-zinc-800 bg-zinc-950/30'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`flex min-w-0 items-center gap-2 text-xs font-semibold ${social.color}`}>
                    <i className={social.icon} />
                    <span className="truncate">{social.label}</span>
                    {hasUrl && (
                      <span
                        className={`hidden rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider sm:inline ${
                          isVisible
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        {isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSocial(social.key)}
                    aria-label={`${isVisible ? 'Hide' : 'Show'} ${social.label}`}
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] transition ${
                      isVisible
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <i className={`fa-solid ${isVisible ? 'fa-eye' : 'fa-eye-slash'}`} />
                  </button>
                </div>
                <input
                  value={value}
                  onChange={(event) =>
                    setSocials((current) => ({ ...current, [social.key]: event.target.value }))
                  }
                  className={`${inputCls} py-2 text-xs`}
                  placeholder={social.placeholder}
                  inputMode="url"
                />
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs leading-relaxed text-red-300">
          <i className="fa-solid fa-circle-exclamation mt-0.5" />
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-300">
          <i className="fa-solid fa-circle-check" />
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-black shadow-[0_10px_30px_rgba(34,197,94,0.25)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`} />
        {saving ? 'Saving...' : 'Save Student Profile'}
      </button>
    </div>
  )
}
