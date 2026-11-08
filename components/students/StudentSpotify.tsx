'use client'

import { parseSpotifyUrl } from '../../lib/students/spotify'

export default function StudentSpotify({
  spotifyUrl,
}: {
  spotifyUrl: string | null | undefined
}) {
  if (!spotifyUrl) return null

  const parsed = parseSpotifyUrl(spotifyUrl)
  if (!parsed.embedUrl) return null

  return (
    <div className="rounded-2xl border p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide opacity-70">Now playing</p>
      <iframe
        src={parsed.embedUrl}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-xl"
      />
    </div>
  )
}
