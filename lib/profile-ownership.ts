/**
 * Strict profile-ownership rules.
 *
 * A profile can be edited only by the signed-in account whose auth user id
 * matches either the profile row id or the profile's explicit owner_id, or
 * whose authenticated email matches the profile's email as a fallback.
 * Being signed in, or having a row in `cards`, is never enough on its own.
 */

export type ProfileOwnershipFields = {
  id?: string | null
  owner_id?: string | null
  email?: string | null
}

function normalizeId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function isProfileOwner(
  userId: string | null | undefined,
  profile: ProfileOwnershipFields | null | undefined,
  userEmail?: string | null
): boolean {
  const uid = normalizeId(userId)
  if (!uid || !profile) return false

  const profileId = normalizeId(profile.id)
  const ownerId = normalizeId(profile.owner_id)

  if (uid === profileId) return true
  if (ownerId !== '' && uid === ownerId) return true

  // Fallback for accounts whose auth id and profile row id diverged but whose
  // authenticated email still matches the email saved on the profile.
  const email = normalizeEmail(userEmail)
  const profileEmail = normalizeEmail(profile.email)
  return email !== '' && profileEmail !== '' && email === profileEmail
}
