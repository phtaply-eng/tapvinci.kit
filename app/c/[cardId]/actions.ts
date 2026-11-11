'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export type ClaimState = {
  error: string | null
}

const ALREADY_CLAIMED = 'Card already claimed'

/**
 * Claim a card for the signed-in user. No PIN is required.
 *
 * The ownership check and the write happen in one UPDATE statement, so two
 * people tapping at the same time cannot both claim the same card. The update
 * only matches cards that are still unclaimed (claimed_by IS NULL).
 */
export async function claimCardAction(
  code: string,
  username: string | null,
  _prevState: ClaimState,
  _formData: FormData
): Promise<ClaimState> {
  const cardCode = (code || '').trim().toUpperCase()
  if (!cardCode) {
    return { error: 'Card not found. Check the code and try again.' }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to claim this card.' }
  }

  let profileUsername: string | null = username

  try {
    // Service-role client: cards has no public update policy, but this runs
    // only on the server after the session above has been verified.
    const admin = createSupabaseAdmin()

    // The card and the profile share the same id as the signed-in user. Make
    // sure that profile exists before writing the card.
    const { data: existingProfile, error: profileError } = await admin
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[claim_card] profile lookup failed:', profileError)
      return { error: 'Something went wrong. Please try again.' }
    }

    profileUsername = existingProfile?.username ?? username

    if (!existingProfile) {
      const fullName = String(user.user_metadata?.full_name || '').trim() || 'New User'

      let insertedProfile: { username: string | null } | null = null
      let insertError: { code?: string; message?: string } | null = null

      // Retry on a username collision (23505) so random names stay unique.
      for (let attempt = 0; attempt < 5 && !insertedProfile; attempt += 1) {
        const generatedUsername = `user_${Math.floor(Math.random() * 10000)}`
        const { data, error } = await admin
          .from('profiles')
          .insert({
            id: user.id,
            name: fullName,
            username: generatedUsername,
          })
          .select('username')
          .maybeSingle()

        if (!error) {
          insertedProfile = data
          profileUsername = data?.username ?? generatedUsername
          break
        }

        insertError = error
        if (error.code !== '23505') break
      }

      if (!insertedProfile) {
        console.error('[claim_card] profile insert failed:', insertError)
        return { error: 'Could not create your profile. Please try again.' }
      }
    }

    const { data: claimedRows, error } = await admin
      .from('cards')
      .update({
        status: 'claimed',
        claimed_by: user.id,
        profile_id: user.id,
      })
      .eq('card_code', cardCode)
      .is('claimed_by', null)
      .select('id')

    if (error) {
      console.error('[claim_card] update failed:', error)
      return { error: 'Something went wrong. Please try again.' }
    }

    // A single UPDATE is atomic: if it matched nothing, someone else owns it.
    if (!claimedRows || claimedRows.length === 0) {
      return { error: ALREADY_CLAIMED }
    }
  } catch (error) {
    console.error('[claim_card] unexpected error:', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  // Send the new owner straight to the Edit Profile dashboard.
  redirect(
    profileUsername
      ? `/dashboard?edit=${encodeURIComponent(profileUsername)}`
      : '/dashboard'
  )
}

export async function signOutAction(code: string) {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect(`/c/${encodeURIComponent(code)}`)
}
