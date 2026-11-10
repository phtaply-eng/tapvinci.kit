/**
 * Student-only education card. Rendered between the bio and the compact
 * Spotify player on the public profile.
 *
 * Each field honors its dashboard visibility toggle: `show_school`,
 * `show_year_level`, `show_course`. Missing/null means visible.
 */
import { getVisibleEducation } from '../../lib/profile-role'

export default function StudentEducation({ profile }: { profile: any }) {
  const { school, course, yearLevel, hasAny } = getVisibleEducation(profile)

  if (!hasAny) return null

  return (
    <div className="student-education-card">
      <div className="student-education-head">
        <span className="student-education-icon" aria-hidden="true">
          <i className="fa-solid fa-graduation-cap" />
        </span>
        <div className="min-w-0">
          <p className="student-education-eyebrow">Education</p>
          <p className="student-education-school">{school || 'Student'}</p>
        </div>
      </div>

      {(course || yearLevel) && (
        <div className="student-education-grid">
          {course && (
            <div className="student-education-item">
              <span>Course</span>
              <strong>{course}</strong>
            </div>
          )}
          {yearLevel && (
            <div className="student-education-item">
              <span>Year Level</span>
              <strong>{yearLevel}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
