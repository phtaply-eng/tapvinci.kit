export type SpotifyType = 'track' | 'album' | 'playlist' | 'artist' | null

export type ParsedSpotify = {
  type: SpotifyType
  id: string | null
  embedUrl: string | null
  originalUrl: string
}

export function parseSpotifyUrl(url: string): ParsedSpotify {
  const trimmed = (url || '').trim()
  if (!trimmed) {
    return { type: null, id: null, embedUrl: null, originalUrl: url }
  }
  const match = trimmed.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/)
  if (!match) {
    return { type: null, id: null, embedUrl: null, originalUrl: url }
  }
  const type = match[1] as Exclude<SpotifyType, null>
  const id = match[2]
  return {
    type,
    id,
    embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
    originalUrl: url,
  }
}
