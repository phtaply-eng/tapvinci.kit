/**
 * Strict profile-ownership rules.
 *
 * A profile can be edited only by the signed-in account whose auth user id
 * matches either the profile row id or the profile's explicit owner_id.
 * Being signed in, or having a row in `cards`, is never enough on its own.
 */

export type ProfileOwnershipFields = {
  id?: string | null
  owner_id?: string | null
}

function normalizeId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function isProfileOwner(
  userId: string | null | undefined,
  profile: ProfileOwnershipFields | null | undefined
): boolean {
  const uid = normalizeId(userId)
  if (!uid || !profile) return false

  const profileId = normalizeId(profile.id)
  const ownerId = normalizeId(profile.owner_id)

  return uid === profileId || (ownerId !== '' && uid === ownerId)
}
