import { displayStreak } from '../lib/student'

export default function StudentStats({
  tapCount, streak, lastTapDate,
}: { tapCount: number; streak: number; lastTapDate: string | null }) {
  const s = displayStreak(streak, lastTapDate)
  const pill = 'rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white'
  return (
    <div className="flex items-center justify-center gap-2">
      <span className={pill}>👆 {tapCount.toLocaleString()} taps</span>
      <span className={pill}>🔥 {s}-day streak</span>
    </div>
  )
}