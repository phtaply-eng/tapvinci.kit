export type StudentProfile = {
  id: string
  username: string
  name: string | null
  tier: string | null
  school: string | null
  course: string | null
  year_level: string | null
  spotify_url: string | null
  tap_count: number | null
  streak_count: number | null
  last_tap_date: string | null
  avatar_url?: string | null
  bio?: string | null
  role?: string | null
  taps?: number | null
  streak?: number | null
  socials?: Record<string, string> | null
  socials_visible?: Record<string, boolean> | null
}

export function displayStreak(streak: number | null | undefined): string {
  const value = streak ?? 0
  if (value <= 0) return 'No streak yet - tap to start'
  if (value === 1) return '1 day streak'
  return `${value} day streak`
}

export function displayTapCount(tapCount: number | null | undefined): string {
  const value = tapCount ?? 0
  if (value === 1) return '1 tap'
  return `${value} taps`
}
