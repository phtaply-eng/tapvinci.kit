/**
 * Student-only education card. Rendered between the bio and the compact
 * Spotify player on the public profile.
 */
export default function StudentEducation({ profile }: { profile: any }) {
  if (!profile.school && !profile.course && !profile.year_level) return null

  return (
    <div className="student-education-card">
      <div className="student-education-head">
        <span className="student-education-icon" aria-hidden="true">
          <i className="fa-solid fa-graduation-cap" />
        </span>
        <div className="min-w-0">
          <p className="student-education-eyebrow">Education</p>
          <p className="student-education-school">{profile.school || 'Student'}</p>
        </div>
      </div>

      {(profile.course || profile.year_level) && (
        <div className="student-education-grid">
          {profile.course && (
            <div className="student-education-item">
              <span>Course</span>
              <strong>{profile.course}</strong>
            </div>
          )}
          {profile.year_level && (
            <div className="student-education-item">
              <span>Year Level</span>
              <strong>{profile.year_level}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
