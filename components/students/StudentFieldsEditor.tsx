'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase-browser'
import { parseSpotifyUrl } from '../../lib/students/spotify'
import type { StudentProfile } from '../../lib/students/student'

export default function StudentFieldsEditor({
  profile,
  onSaved,
}: {
  profile: StudentProfile
  onSaved?: () => void
}) {
  const [username, setUsername] = useState(profile.username ?? '')
  const [school, setSchool] = useState(profile.school ?? '')
  const [course, setCourse] = useState(profile.course ?? '')
  const [yearLevel, setYearLevel] = useState(profile.year_level ?? '')
  const [spotifyUrl, setSpotifyUrl] = useState(profile.spotify_url ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    setMessage('')
    if (spotifyUrl.trim()) {
      const parsed = parseSpotifyUrl(spotifyUrl)
      if (!parsed.embedUrl) {
        setMessage('That Spotify link does not look valid. Use a link like https://open.spotify.com/track/...')
        return
      }
    }

    setSaving(true)
    const supabase = createClient()

    if (username.trim() !== profile.username) {
      const { error: usernameError } = await supabase.rpc('set_my_username', {
        p_username: username.trim(),
      })
      if (usernameError) {
        setMessage(usernameError.message)
        setSaving(false)
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        school: school.trim() || null,
        course: course.trim() || null,
        year_level: yearLevel.trim() || null,
        spotify_url: spotifyUrl.trim() || null,
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Saved!')
    onSaved?.()
  }

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <h2 className="font-bold text-lg">Student profile</h2>

      <label className="block">
        <span className="text-sm opacity-70">Username</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 bg-transparent"
          placeholder="your-name"
        />
      </label>

      <label className="block">
        <span className="text-sm opacity-70">School</span>
        <input
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 bg-transparent"
          placeholder="Your school"
        />
      </label>

      <label className="block">
        <span className="text-sm opacity-70">Course</span>
        <input
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 bg-transparent"
          placeholder="e.g. BS Computer Science"
        />
      </label>

      <label className="block">
        <span className="text-sm opacity-70">Year level</span>
        <input
          value={yearLevel}
          onChange={(e) => setYearLevel(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 bg-transparent"
          placeholder="e.g. 2nd Year"
        />
      </label>

      <label className="block">
        <span className="text-sm opacity-70">Spotify link</span>
        <input
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 bg-transparent"
          placeholder="https://open.spotify.com/track/..."
        />
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save student profile'}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  )
}
