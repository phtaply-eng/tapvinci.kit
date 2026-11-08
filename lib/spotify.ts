const RE =
  /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{22})(?:[?#/].*)?$/

export function parseSpotifyUrl(url: string) {
  const m = url.trim().match(RE)
  if (!m) return null
  const [, type, id] = m
  return { type, id, embedUrl: `https://open.spotify.com/embed/${type}/${id}?theme=0` }
}