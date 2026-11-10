'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase-browser'
import { isValidSpotifyUrl } from '../../lib/profile-config'

export default function StudentFieldsEditor({
  profile,
  onSaved,
}: {
  profile: any
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
    
    if (spotifyUrl.trim() && !isValidSpotifyUrl(spotifyUrl)) {
      setMessage('That Spotify link does not look valid.')
      return
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
      .from('student_profiles')
      .upsert(
        {
          id: profile.id,
          school: school.trim() || null,
          course: course.trim() || null,
          year_level: yearLevel.trim() || null,
          spotify_url: spotifyUrl.trim() || null,
        },
        { onConflict: 'id' }
      )

    setSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Saved!')
    onSaved?.()
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      <h2 className="font-bold text-lg text-white">Student profile</h2>

      <label className="block">
        <span className="text-sm text-zinc-400">Username</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          placeholder="your-name"
        />
      </label>

      <label className="block">
        <span className="text-sm text-zinc-400">School</span>
        <input
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          placeholder="Your school"
        />
      </label>

      <label className="block">
        <span className="text-sm text-zinc-400">Course</span>
        <input
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          placeholder="e.g. BS Computer Science"
        />
      </label>

      <label className="block">
        <span className="text-sm text-zinc-400">Year level</span>
        <input
          value={yearLevel}
          onChange={(e) => setYearLevel(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          placeholder="e.g. 2nd Year"
        />
      </label>

      <label className="block">
        <span className="text-sm text-zinc-400">Spotify Link</span>
        <input
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          placeholder="https://open.spotify.com/track/..."
        />
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-black font-bold disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save student profile'}
      </button>

      {message && <p className={`text-sm ${message === 'Saved!' ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>}
    </div>
  )
}