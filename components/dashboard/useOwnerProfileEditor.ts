'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { DEFAULT_VISIBLE } from '@/lib/profile-config'

const PROTECTED_KEYS = [
  'id', 'created_at', 'updated_at', 'views', 'receipt_url', 'payment_status',
  'is_active', 'is_admin', 'is_demo', 'paid_at', 'fulfillment', 'fulfilled_at',
  'deactivated_at', 'package', 'plan_tier', 'plan_amount', 'payment_method',
  'owner_id', 'claimed_by', 'role', 'tier', 'taps', 'streak', 'tap_count',
  'streak_count', 'last_tap_date',
]

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

  // Fresh copy from the database every time the drawer opens.
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

        const next = normalize(data)
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

  // Printed cards keep their link, so every account has a locked username.
  const usernameLocked = true

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

    if (usernameChanged) {
      showToast('Your card link uses this username, so it can’t be changed here.')
      setProfile((previous: any) => ({ ...previous, username: originalUsername }))
      return { ok: false }
    }

    savingRef.current = true
    setSaving(true)

    try {
      const supabase = createClient()

      const payload: Record<string, any> = { ...profile }
      for (const key of PROTECTED_KEYS) delete payload[key]
      delete payload.username

      const { data: saved, error: saveError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profile.id)
        .select('*')
        .maybeSingle()

      if (saveError) throw saveError
      if (!saved) throw new Error('No row was updated. Are you signed in as the owner?')

      const next = normalize(saved)
      baselineRef.current = JSON.stringify(next)
      setProfile(next)
      showToast('Profile updated successfully')

      return { ok: true }
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
  }, [profile, showToast])

  return { profile, setProfile, loading, saving, error, dirty, usernameLocked, save, reload }
}
