/**
 * Role helpers shared by the dashboard, the public profile and the
 * student-only components.
 *
 * The live database has both `role` (new) and `tier` (legacy) columns.
 * `role` wins when it is set; otherwise we fall back to `tier` so existing
 * student cards keep working before the SQL migration is applied.
 */

export type ProfileRole = 'student' | 'professional'

export function resolveProfileRole(profile: any): ProfileRole {
  const role = String(profile?.role ?? '').trim().toLowerCase()
  if (role === 'student' || role === 'professional') return role

  const tier = String(profile?.tier ?? '').trim().toLowerCase()
  if (tier === 'student') return 'student'

  return 'professional'
}

export function isStudentProfile(profile: any): boolean {
  return resolveProfileRole(profile) === 'student'
}

/**
 * `taps` is the new column. `tap_count` is the legacy student_profiles
 * column that the existing record_student_tap RPC updates.
 */
export function getTapCount(profile: any): number {
  const raw = profile?.taps ?? profile?.tap_count ?? 0
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

/**
 * `streak` is the new column. `streak_count` is the legacy column.
 * The UI treats a missing/zero streak as 1 day, matching the requested
 * `profile.streak || 1` fallback.
 */
export function getStreakCount(profile: any): number {
  const raw = profile?.streak ?? profile?.streak_count ?? 1
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
}

/**
 * Fill gaps in a profiles row with the legacy student_profiles row. Values on
 * profiles always win, so this is safe to run after the SQL migration too.
 */
export function mergeStudentProfileData(profile: any, studentData: any) {
  const merged: any = { ...(profile || {}) }
  if (!studentData) return merged

  for (const key of ['school', 'course', 'year_level', 'spotify_url', 'bio']) {
    if (merged[key] === null || merged[key] === undefined || merged[key] === '') {
      merged[key] = studentData[key] ?? merged[key]
    }
  }

  if (!merged.taps && studentData.tap_count) merged.taps = studentData.tap_count
  if ((!merged.streak || merged.streak <= 1) && studentData.streak_count) {
    merged.streak = studentData.streak_count
  }

  return merged
}
