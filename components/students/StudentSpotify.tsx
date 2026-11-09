'use client'

import SpotifyPlayer from '../SpotifyPlayer'

/**
 * Compact student Spotify card. The regular professional player stays large;
 * this variant uses a smaller album art, tighter padding and a blue student
 * skin so it can sit between Education and Quick Actions.
 */
export default function StudentSpotify({
  spotifyUrl,
}: {
  spotifyUrl: string | null | undefined
}) {
  if (!spotifyUrl) return null

  return (
    <SpotifyPlayer
      spotifyUrl={spotifyUrl}
      accentColor="#38bdf8"
      compact
      variant="student"
    />
  )
}
