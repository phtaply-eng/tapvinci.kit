import { parseSpotifyUrl } from '../lib/spotify'

export default function StudentSpotify({ url }: { url: string | null }) {
  const p = url ? parseSpotifyUrl(url) : null
  if (!p) return null
  const height = p.type === 'track' || p.type === 'episode' ? 152 : 352
  return (
    <section className="px-5 pb-5">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">♪ Now playing</p>
      <iframe
        src={p.embedUrl}
        width="100%"
        height={height}
        loading="lazy"
        title="Spotify player"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        style={{ border: 0, borderRadius: 14 }}
      />
    </section>
  )
}