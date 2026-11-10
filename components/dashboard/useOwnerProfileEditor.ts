'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { DEFAULT_VISIBLE } from '@/lib/profile-config'
import { mergeStudentProfileData, resolveProfileRole } from '@/lib/profile-role'

const PROTECTED_KEYS = [
  'id', 'created_at', 'updated_at', 'views', 'receipt_url', 'payment_status', 
  'is_active', 'is_admin', 'is_demo', 'paid_at', 'fulfillment', 'fulfilled_at', 
  'deactivated_at', 'package', 'plan_tier', 'plan_amount', 'payment_method', 
  'owner_id', 'claimed_by', 'role', 'tier', 'taps', 'streak', 'tap_count', 
  'streak_count', 'last_tap_date',
]

// These fields exist in student_profiles, NOT in the main profiles table
const STUDENT_ONLY_KEYS = [
  'school', 'course', 'year_level', 'spotify_url', 'youtube_url', 'audio_url',
  'show_school', 'show_year_level', 'show_course'
]

const USERNAME_MESSAGES: Record<string, string> = {
  invalid: 'Username: 3-24 letters, numbers, - or _.',
  reserved: 'That username is reserved.',
  taken: 'That username is already taken. Please choose another one.',
  no_profile: 'No student profile found for this account.',
}

function normalize(row: any) {
  return {
    ...row,
    gallery: Array.isArray(row?.gallery) ? row.gallery : [],
    socials: { ...(row?.socials || {}) },
    socials_visible: { ...DEFAULT_VISIBLE, ...(row?.socials_visible || {}) },
  }
}

export type OwnerSaveResult = { ok: boolean; newUsername?: string }

export function useOwnerProfileEditor({
  profileId,
  enabled,
  showToast,
}: {
  profileId?: string | null
  enabled: boolean
  showToast: (message: string) => void
}) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const baselineRef = useRef('')
  const originalUsernameRef = useRef('')
  const savingRef = useRef(false)

  // Fresh copy from the database every time the drawer opens
  useEffect(() => {
    if (!enabled || !profileId) return
    let alive = true
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error: loadError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle()
        if (loadError || !data) throw loadError ?? new Error('Profile not found')

        let merged: any = data
        if (resolveProfileRole(data) === 'student') {
          const { data: legacy } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('id', profileId)
            .maybeSingle()
          merged = mergeStudentProfileData(data, legacy)
        }

        const next = normalize(merged)
        if (!alive) return
        baselineRef.current = JSON.stringify(next)
        originalUsernameRef.current = String(next.username || '').toLowerCase()
        setProfile(next)
      } catch (loadFailure) {
        console.error('[Owner editor] load failed:', loadFailure)
        if (alive) setError('Could not load your profile. Please try again.')
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [enabled, profileId, reloadKey])

  const isStudent = useMemo(() => resolveProfileRole(profile) === 'student', [profile])
  const usernameLocked = !isStudent

  const dirty = useMemo(
    () => (profile ? JSON.stringify(profile) !== baselineRef.current : false),
    [profile]
  )

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  const save = useCallback(async (): Promise<OwnerSaveResult> => {
    if (!profile || savingRef.current) return { ok: false }

    const username = String(profile.username || '').trim().toLowerCase()
    const name = String(profile.name || '').trim()
    if (!username || !name) {
      showToast('Username and Name are required.')
      return { ok: false }
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      showToast('Username can only use letters, numbers, hyphens, and underscores.')
      return { ok: false }
    }

    const originalUsername = originalUsernameRef.current
    const usernameChanged = username !== originalUsername

    if (usernameChanged && !isStudent) {
      showToast('Your card link uses this username, so it can’t be changed here.')
      setProfile((previous: any) => ({ ...previous, username: originalUsername }))
      return { ok: false }
    }

    savingRef.current = true
    setSaving(true)

    try {
      const supabase = createClient()

      if (usernameChanged) {
        const { data: result, error: renameError } = await supabase.rpc('set_my_username', {
          p_username: username,
        })
        if (renameError || result !== 'ok') {
          showToast(
            USERNAME_MESSAGES[result as string] ?? 'Could not change your username. Please try again.'
          )
          return { ok: false }
        }
        originalUsernameRef.current = username
      }

      const payload: Record<string, any> = { ...profile }
      for (const key of PROTECTED_KEYS) delete payload[key]
      delete payload.username

      // 1. Separate the data for the two tables
      const profilePayload = { ...payload }
      if (isStudent) {
        for (const key of STUDENT_ONLY_KEYS) {
          delete profilePayload[key]
        }
      }

      // 2. Update the main 'profiles' table (only safe columns)
      const { data: saved, error: saveError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', profile.id)
        .select('*')
        .maybeSingle()

      if (saveError) throw saveError
      if (!saved) throw new Error('No row was updated. Are you signed in as the owner?')

      // 3. Update the student_profiles mirror if applicable
      if (isStudent) {
        const { error: mirrorError } = await supabase.from('student_profiles').upsert(
          {
            id: profile.id,
            school: payload.school || null,
            course: payload.course || null,
            year_level: payload.year_level || null,
            show_school: payload.show_school !== false,
            show_year_level: payload.show_year_level !== false,
            show_course: payload.show_course !== false,
            spotify_url: payload.spotify_url || null,
            // audio_url/youtube_url can be added here if you keep them
          },
          { onConflict: 'id' }
        )
        if (mirrorError) {
          console.warn('[Owner editor] student_profiles mirror skipped:', mirrorError.message)
        }
      }

      // 4. Merge the local state so the drawer doesn't lose the student fields
      const mergedSaved = isStudent ? { ...saved, ...payload } : saved
      const next = normalize(mergedSaved)
      
      baselineRef.current = JSON.stringify(next)
      setProfile(next)
      showToast('Profile updated successfully')

      return { ok: true, newUsername: usernameChanged ? username : undefined }
    } catch (saveFailure: any) {
      console.error('[Owner editor] save failed:', saveFailure)
      const duplicate =
        saveFailure?.code === '23505' ||
        /duplicate key|already exists|unique constraint/i.test(saveFailure?.message || '')
      showToast(
        duplicate
          ? 'That username is already taken. Please choose another one.'
          : 'Could not save profile. Please try again.'
      )
      return { ok: false }
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [profile, isStudent, showToast])

  return { profile, setProfile, loading, saving, error, dirty, isStudent, usernameLocked, save, reload }
}