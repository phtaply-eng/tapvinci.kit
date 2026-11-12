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

type UpdateOrderResult =
  | { ok: true; profile: Record<string, unknown> }
  | { ok: false; error: string }

// Keep server-side writes limited to known profile columns. This prevents a
// compromised client from mass-assigning fields such as id or username.
const ALLOWED_PROFILE_UPDATE_FIELDS = new Set([
  // Profile editor
  'name',
  'business',
  'title',
  'bio',
  'about',
  'phone',
  'email',
  'address',
  'mapsLink',
  'socials',
  'hero_image',
  'avatar_url',
  'gallery',
  'theme',
  'accent_color',
  'spotify_url',
  'gcash_qr_url',
  'maya_qr_url',
  // Orders / fulfillment
  'payment_status',
  'paid_at',
  'fulfillment',
  'fulfilled_at',
  'is_demo',
  'package',
  'plan_tier',
  'plan_amount',
  'is_admin',
  'role',
  'is_active',
  'deactivated_at',
])

/**
 * Service-role client. Only call this from requireAdmin() after both the
 * authentication and authorization checks have passed.
 */
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

type AdminSupabase = ReturnType<typeof supabaseAdmin>

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

/**
 * Authenticate and authorize an admin caller before any service-role access.
 *
 * 1. Authenticate: read the Supabase session on the server with getUser().
 * 2. Authorize: require profiles.is_admin === true, or a valid signed admin
 *    console cookie (the password console does not create a Supabase session).
 * 3. Only after those checks pass, create the service-role client.
 */
async function requireAdmin(): Promise<{ error: string } | { admin: AdminSupabase }> {
  let isAdmin = false

  try {
    const supabase = createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      isAdmin = profile?.is_admin === true
    }
  } catch {
    // Fall through to the admin console cookie check below.
  }

  // The admin console authenticates with a signed, httpOnly password session
  // instead of Supabase Auth, so a valid cookie is an authenticated admin.
  if (!isAdmin && !hasValidAdminCookie()) {
    return { error: 'Not authorized. Sign in to the admin console again.' }
  }

  // Service-role client creation is intentionally after both checks above.
  try {
    return { admin: supabaseAdmin() }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin client unavailable.'
    return { error: message }
  }
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
  const id = typeof userId === 'string' ? userId.trim() : ''
  if (!id) return { ok: false, error: 'Missing user id.' }

  const auth = await requireAdmin()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const admin = auth.admin

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
  const auth = await requireAdmin()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const admin = auth.admin
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
 * Toggle a profile between VIP/admin and a normal professional account.
 * The sales dashboard uses is_demo for VIP exclusion, so keep it in sync
 * with is_admin to avoid the account still counting as a real sale.
 */
export async function toggleVipAction(userId: string, isVip: boolean): Promise<ActionResult> {
  const id = typeof userId === 'string' ? userId.trim() : ''
  if (!id) return { ok: false, error: 'Missing user id.' }
  if (typeof isVip !== 'boolean') return { ok: false, error: 'Invalid VIP status.' }

  const auth = await requireAdmin()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const admin = auth.admin

    const { data: current, error: readError } = await admin
      .from('profiles')
      .select('fulfillment')
      .eq('id', id)
      .maybeSingle()

    if (readError) {
      return { ok: false, error: `Could not read the profile: ${readError.message}` }
    }
    if (!current) return { ok: false, error: 'Profile not found.' }

    const patch: Record<string, unknown> = {
      is_admin: isVip,
      role: isVip ? 'admin' : 'professional',
      is_demo: isVip,
    }

    if (isVip) {
      patch.fulfillment = 'vip'
    } else if (current.fulfillment === 'vip') {
      patch.fulfillment = 'pending'
    }

    const { data, error } = await admin
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select('id')

    if (error) {
      return { ok: false, error: `Could not update VIP status: ${error.message}` }
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

/**
 * Update one profile from the admin console. The caller must be an
 * authenticated admin, and only whitelisted profile columns are accepted.
 */
export async function updateOrderAction(
  profileId: string,
  updates: Record<string, unknown>
): Promise<UpdateOrderResult> {
  const id = typeof profileId === 'string' ? profileId.trim() : ''
  if (!id) return { ok: false, error: 'Missing profile id.' }
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return { ok: false, error: 'Invalid update payload.' }
  }

  const invalidFields = Object.keys(updates).filter((key) => !ALLOWED_PROFILE_UPDATE_FIELDS.has(key))
  if (invalidFields.length > 0) {
    return { ok: false, error: `Fields not allowed: ${invalidFields.join(', ')}` }
  }

  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(updates)) {
    patch[key] = value
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No fields to update.' }
  }

  const auth = await requireAdmin()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const admin = auth.admin
    const { data, error } = await admin
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      return { ok: false, error: `Could not update the profile: ${error.message}` }
    }
    if (!data) {
      return { ok: false, error: 'Profile not found.' }
    }

    return { ok: true, profile: data as Record<string, unknown> }
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
  const auth = await requireAdmin()
  if ('error' in auth) return { ok: false, error: auth.error }

  try {
    const admin = auth.admin

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
