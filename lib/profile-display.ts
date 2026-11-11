/**
 * Display helpers shared by the dashboard and the public profile.
 *
 * Every profile is a professional profile now. These helpers only read the
 * public card fields — there is no role branching anywhere.
 */

/**
 * `taps` is the current column. `tap_count` is the legacy student_profiles
 * column and is only read as a fallback for rows that were never migrated.
 */
export function getTapCount(profile: any): number {
  const raw = profile?.taps ?? profile?.tap_count ?? 0
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

/**
 * `streak` is the current column. `streak_count` is the legacy column.
 * A missing/zero streak is treated as 1 day.
 */
export function getStreakCount(profile: any): number {
  const raw = profile?.streak ?? profile?.streak_count ?? 1
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
}

/**
 * Education values that are allowed to appear on the public card. A missing or
 * null flag means visible.
 */
export function getVisibleEducation(profile: any) {
  const school = profile?.show_school === false ? '' : String(profile?.school || '')
  const course = profile?.show_course === false ? '' : String(profile?.course || '')
  const yearLevel =
    profile?.show_year_level === false ? '' : String(profile?.year_level || '')

  return {
    school,
    course,
    yearLevel,
    hasAny: Boolean(school || course || yearLevel),
  }
}
