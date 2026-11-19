'use server'

import { createClient } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export type ResetViewsResult = { ok: true } | { ok: false; error: string }

/**
 * Reset the view counter for one profile.
 *
 * Allowed callers:
 *   - the owner of the profile (profile.id / owner_id), or
 *   - an account flagged as admin (profiles.is_admin or role = 'admin').
 *
 * Authorization is checked with the signed-in user's session. Only after it
 * passes do we write with the service-role client, scoped to the requested
 * profile id.
 */
export async function resetMyViewsAction(profileId: string): Promise<ResetViewsResult> {
  const id = typeof profileId === 'string' ? profileId.trim() : ''
  if (!id) return { ok: false, error: 'Missing profile id.' }

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'Please sign in to reset the view count.' }
    }

    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('id, owner_id')
      .eq('id', id)
      .maybeSingle()

    if (targetError) {
      return { ok: false, error: `Could not load the profile: ${targetError.message}` }
    }
    if (!target) {
      return { ok: false, error: 'Profile not found.' }
    }

    const isOwner = user.id === target.id || user.id === target.owner_id

    let isAdmin = false
    if (!isOwner) {
      const { data: caller } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .maybeSingle()

      isAdmin =
        caller?.is_admin === true ||
        String(caller?.role || '').toLowerCase() === 'admin'
    }

    if (!isOwner && !isAdmin) {
      return { ok: false, error: 'You are not allowed to reset this profile.' }
    }

    // Service role so the reset works regardless of RLS. The query is still
    // scoped to the single, already-authorized profile id.
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .from('profiles')
      .update({ views: 0 })
      .eq('id', id)
      .select('id')

    if (error) {
      return { ok: false, error: `Could not reset views: ${error.message}` }
    }
    if (!data || data.length === 0) {
      return { ok: false, error: 'Profile not found.' }
    }

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, error: message }
  }
}
