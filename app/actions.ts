'use server'

import { createClient } from '@/lib/supabase-server'

export type ResetViewsResult = { ok: true } | { ok: false; error: string }

/**
 * Reset the signed-in user's own view counter.
 *
 * The write is scoped to auth.uid() so this action can never reset another
 * profile's views, even if the caller is an admin (admins use
 * resetViewsAsAdmin from app/admin/actions.ts instead).
 */
export async function resetMyViewsAction(): Promise<ResetViewsResult> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'Please sign in to reset your view count.' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ views: 0 })
      .eq('id', user.id)
      .select('id')

    if (error) {
      return { ok: false, error: `Could not reset views: ${error.message}` }
    }
    if (!data || data.length === 0) {
      return { ok: false, error: 'Profile not found for this account.' }
    }

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, error: message }
  }
}
