'use server'

import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'

const ADMIN_COOKIE = 'tapvinci_admin_session'
const SESSION_MAX_AGE_MS = 60 * 60 * 8 * 1000 // Must match /api/admin/login (8 hours).
const CARD_PREFIX = 'TAPV'
// The cards_tier_check constraint only allows 'student' or 'professional'.
// Pre-sale NFC cards are the standard professional TapVinci card.
const DEFAULT_CARD_TIER = 'professional'
// No 0/O/1/I so a printed card code is easy to read and type.
const CARD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

type ActionResult = { ok: true } | { ok: false; error: string }
type GenerateCardResult =
  | { ok: true; cardCode: string }
  | { ok: false; error: string }

type UnclaimedCard = { card_code: string; created_at: string | null }
type UnclaimedCardsResult =
  | { ok: true; cards: UnclaimedCard[] }
  | { ok: false; error: string }

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase admin env vars are missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * The admin console signs in with the password cookie from /api/admin/login.
 * If the same browser also has a Supabase session, that user must be flagged
 * as an admin in public.profiles before the action is allowed.
 */
function hasValidAdminCookie(): boolean {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) return false

  const raw = cookies().get(ADMIN_COOKIE)?.value
  if (!raw) return false

  const [issuedAt, nonce, signature] = raw.split('.')
  if (!issuedAt || !nonce || !signature) return false

  const age = Date.now() - Number(issuedAt)
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_MS) return false

  const expected = createHmac('sha256', secret).update(`${issuedAt}.${nonce}`).digest('hex')
  const provided = Buffer.from(signature, 'hex')
  const wanted = Buffer.from(expected, 'hex')
  if (provided.length !== wanted.length) return false
  return timingSafeEqual(provided, wanted)
}

async function currentUserIsAdmin(): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    return profile?.is_admin === true
  } catch {
    return false
  }
}

/** Returns an error message, or null when the caller is allowed. */
async function authorizeAdmin(): Promise<string | null> {
  if (await currentUserIsAdmin()) return null
  if (hasValidAdminCookie()) return null
  return 'Not authorized. Sign in to the admin console again.'
}

function makeCardCode(): string {
  let suffix = ''
  for (let i = 0; i < 8 - CARD_PREFIX.length; i += 1) {
    suffix += CARD_ALPHABET[randomInt(CARD_ALPHABET.length)]
  }
  return `${CARD_PREFIX}${suffix}`
}

/**
 * Permanently delete a user:
 *   1. release any cards they claimed,
 *   2. delete their public profile row,
 *   3. delete the Supabase Auth user.
 */
export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const id = (userId || '').trim()
  if (!id) return { ok: false, error: 'Missing user id.' }

  const denied = await authorizeAdmin()
  if (denied) return { ok: false, error: denied }

  try {
    const admin = supabaseAdmin()

    // 1. Free the cards first, otherwise the profile -> auth foreign key blocks
    //    the account deletion.
    const { error: cardsError } = await admin
      .from('cards')
      .update({ status: 'shipped', claimed_by: null, profile_id: null })
      .eq('claimed_by', id)

    if (cardsError) {
      return { ok: false, error: `Could not release the user's cards: ${cardsError.message}` }
    }

    // 2. Remove the public profile row.
    const { error: profileError } = await admin.from('profiles').delete().eq('id', id)
    if (profileError) {
      return { ok: false, error: `Could not delete the profile: ${profileError.message}` }
    }

    // 3. Remove the auth account permanently.
    const { error: authError } = await admin.auth.admin.deleteUser(id)
    if (authError && !/not found|does not exist/i.test(authError.message)) {
      return { ok: false, error: `Could not delete the auth user: ${authError.message}` }
    }

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, error: message }
  }
}

/**
 * Cards that are ready to sell: status shipped and no owner yet.
 */
export async function listUnclaimedCardsAction(): Promise<UnclaimedCardsResult> {
  const denied = await authorizeAdmin()
  if (denied) return { ok: false, error: denied }

  try {
    const admin = supabaseAdmin()
    const { data, error } = await admin
      .from('cards')
      .select('card_code, created_at')
      .eq('status', 'shipped')
      .is('claimed_by', null)
      .order('created_at', { ascending: false })

    if (error) {
      return { ok: false, error: `Could not load pre-sale cards: ${error.message}` }
    }

    return { ok: true, cards: (data || []) as UnclaimedCard[] }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, error: message }
  }
}

/**
 * Create a blank pre-sale NFC card. It is ready to be written/printed and can
 * be claimed later through /c/[card_code].
 */
export async function generateCardAction(): Promise<GenerateCardResult> {
  const denied = await authorizeAdmin()
  if (denied) return { ok: false, error: denied }

  try {
    const admin = supabaseAdmin()

    // Retry when the short code collides with an existing card.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const cardCode = makeCardCode()
      const { error } = await admin.from('cards').insert({
        card_code: cardCode,
        card_tier: DEFAULT_CARD_TIER,
        status: 'shipped',
        claimed_by: null,
        profile_id: null,
      })

      if (!error) return { ok: true, cardCode }
      if (error.code !== '23505') {
        return { ok: false, error: `Could not create the card: ${error.message}` }
      }
    }

    return { ok: false, error: 'Could not find a unique card code. Please try again.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { ok: false, error: message }
  }
}
