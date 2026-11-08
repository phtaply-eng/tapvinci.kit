export type StudentProfile = {
  id: string
  school: string | null
  course: string | null
  year_level: string | null
  spotify_url: string | null
  streak_count: number
  last_tap_date: string | null
  tap_count: number
}

function manilaDate(offsetDays: number) {
  const d = new Date(Date.now() + offsetDays * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(d)
}

// A streak only counts if the last tap was today or yesterday
export function displayStreak(streak: number, lastTapDate: string | null) {
  if (!lastTapDate) return 0
  return lastTapDate === manilaDate(0) || lastTapDate === manilaDate(-1) ? streak : 0
}