import { getStreakCount, getTapCount } from '../../lib/profile-role'

/**
 * Small badges shown directly under the student's name/title.
 * Taps + streak are intentionally tiny pills, not a full stats grid.
 */
export default function StudentStats({ profile }: { profile: any }) {
  const taps = getTapCount(profile)
  const streak = getStreakCount(profile)

  return (
    <div className="student-stat-pills" aria-label="Student activity">
      <span className="student-stat-pill">
        <i className="fa-solid fa-hand-pointer" aria-hidden="true" />
        {taps} {taps === 1 ? 'tap' : 'taps'}
      </span>
      <span className="student-stat-pill student-stat-pill-fire">
        <i className="fa-solid fa-fire" aria-hidden="true" />
        {streak} day streak
      </span>
    </div>
  )
}
