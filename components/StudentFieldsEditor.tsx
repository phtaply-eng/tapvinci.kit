'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { parseSpotifyUrl } from '../lib/spotify'
import type { StudentProfile } from '../lib/student'
const LEVELS = ['Junior High', 'Senior High', 'College', "Master's", 'Doctoral']
const USERNAME_MSG: Record<string, string> = {
  invalid: 'Use 3-24 letters, numbers, - or _.',
  reserved: 'That username is reserved.',
  taken: 'That username is taken.',
  no_profile: 'No student profile found for this account.',
}

export default function StudentFieldsEditor({
  initial, username, onSaved,
}: { initial: StudentProfile; username: string; onSaved?: (newUsername: string) => void }) {
  const [sb] = useState(() => createClient())
  const [f, setF] = useState({
    username,
    school: initial.school ?? '',
    course: initial.course ?? '',
    year_level: initial.year_level ?? '',
    spotify_url: initial.spotify_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const spotifyBad = f.spotify_url.trim() !== '' && !parseSpotifyUrl(f.spotify_url)
  const input =
    'w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#D4AF37]'
  const label = 'mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]'

  async function save() {
    if (spotifyBad) return setMsg({ ok: false, text: 'Paste the full Spotify link (open.spotify.com/...).' })
    setSaving(true); setMsg(null)

    let finalUsername = username
    const wanted = f.username.trim().toLowerCase()
    if (wanted !== username) {
      const { data: r, error } = await sb.rpc('set_my_username', { p_username: wanted })
      if (error || r !== 'ok') {
        setSaving(false)
        return setMsg({ ok: false, text: error?.message ?? USERNAME_MSG[r as string] ?? 'Could not change username.' })
      }
      finalUsername = wanted
    }

    const { data, error } = await sb
      .from('student_profiles')
      .update({
        school: f.school.trim() || null,
        course: f.course.trim() || null,
        year_level: f.year_level || null,
        spotify_url: f.spotify_url.trim() || null,
      })
      .eq('id', initial.id)
      .select('id')

    setSaving(false)
    if (error || !data?.length) {
      return setMsg({ ok: false, text: error?.message ?? 'Not saved. Are you signed in as the owner?' })
    }
    setMsg({ ok: true, text: 'Saved. Your card is updated.' })
    onSaved?.(finalUsername)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={label}>Your link</label>
        <div className="flex items-center rounded-xl border border-white/15 bg-black/50 focus-within:border-[#D4AF37]">
          <span className="pl-4 text-xs text-zinc-500">tapvinci.vercel.app/</span>
          <input className="w-full bg-transparent px-1 py-3 text-sm text-white outline-none"
            value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        </div>
      </div>
      <div>
        <label className={label}>School</label>
        <input className={input} value={f.school} placeholder="Sample University"
          onChange={(e) => setF({ ...f, school: e.target.value })} />
      </div>
      <div>
        <label className={label}>Year level</label>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button key={l} type="button"
              onClick={() => setF({ ...f, year_level: f.year_level === l ? '' : l })}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                f.year_level === l ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-white/15 text-zinc-300'
              }`}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        <label className={label}>Course / strand</label>
        <input className={input} value={f.course} placeholder="BS Business Administration"
          onChange={(e) => setF({ ...f, course: e.target.value })} />
      </div>
      <div>
        <label className={label}>Profile song (Spotify link)</label>
        <input className={`${input} ${spotifyBad ? 'border-red-500/60' : ''}`} value={f.spotify_url}
          placeholder="https://open.spotify.com/track/..."
          onChange={(e) => setF({ ...f, spotify_url: e.target.value })} />
        <p className="mt-1 text-[11px] text-zinc-500">In Spotify: Share → Copy link to song.</p>
      </div>

      {msg && <p className={`text-sm ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>}

      <button onClick={save} disabled={saving}
        className="w-full rounded-full bg-[#D4AF37] py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-60">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}