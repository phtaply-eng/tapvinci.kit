import type { StudentProfile } from '../../lib/students/student'

export default function StudentEducation({ profile }: { profile: StudentProfile }) {
  if (!profile.school && !profile.course && !profile.year_level) return null

  return (
    <div className="rounded-2xl border p-4">
      <p className="text-sm font-semibold uppercase tracking-wide opacity-70">Education</p>
      {profile.school && <p className="mt-2 font-bold">{profile.school}</p>}
      {profile.course && <p className="text-sm">{profile.course}</p>}
      {profile.year_level && <p className="text-sm opacity-70">{profile.year_level}</p>}
    </div>
  )
}
