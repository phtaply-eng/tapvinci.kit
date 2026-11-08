import { displayStreak, displayTapCount } from '../../lib/students/student'
import type { StudentProfile } from '../../lib/students/student'

export default function StudentStats({ profile }: { profile: StudentProfile }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border p-4 text-center">
        <p className="text-2xl font-bold">{displayTapCount(profile.tap_count)}</p>
        <p className="text-sm opacity-70">Total taps</p>
      </div>
      <div className="rounded-2xl border p-4 text-center">
        <p className="text-2xl font-bold">{profile.streak_count ?? 0}</p>
        <p className="text-sm opacity-70">{displayStreak(profile.streak_count)}</p>
      </div>
    </div>
  )
}
