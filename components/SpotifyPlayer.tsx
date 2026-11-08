'use client'

import { Component, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from 'react'

/**
 * Spotify media card used on the public profile.
 *
 * Safety notes:
 * - This is a client component; the oEmbed request only runs inside useEffect,
 *   so it never touches `window`/`fetch` during server-side rendering.
 * - The server and the first client render both show the same skeleton, which
 *   keeps hydration deterministic.
 * - All async work is aborted on unmount, guarded with try/catch, and has a
 *   timeout + fallback UI.
 * - An error boundary wraps the card so a bad payload or render error can only
 *   hide the player, never crash/blank the parent profile page.
 * - If the URL is empty or not a supported Spotify link, nothing is rendered.
 */

const SPOTIFY_TYPES = ['track', 'album', 'playlist', 'episode', 'show', 'artist'] as const
type SpotifyType = (typeof SPOTIFY_TYPES)[number]

type ParsedSpotify = { type: SpotifyType; id: string; url: string }

type SpotifyOEmbed = {
  title?: unknown
  thumbnail_url?: unknown
}

const SPOTIFY_URL_RE =
  /^https?:\/\/(?:open|play)\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?(track|album|playlist|episode|show|artist)\/([a-zA-Z0-9]+)/i
const SPOTIFY_URI_RE = /^spotify:(track|album|playlist|episode|show|artist):([a-zA-Z0-9]+)$/i

const OEMBED_TIMEOUT_MS = 8000

/** Normalizes any standard Spotify URL / URI into an embeddable reference. */
export function parseSpotifyUrl(raw?: string | null): ParsedSpotify | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const value = raw.trim()

  const uriMatch = value.match(SPOTIFY_URI_RE)
  if (uriMatch) {
    const type = uriMatch[1].toLowerCase() as SpotifyType
    return { type, id: uriMatch[2], url: `https://open.spotify.com/${type}/${uriMatch[2]}` }
  }

  const urlMatch = value.match(SPOTIFY_URL_RE)
  if (!urlMatch) return null

  const type = urlMatch[1].toLowerCase() as SpotifyType
  const id = urlMatch[2]
  return { type, id, url: `https://open.spotify.com/${type}/${id}` }
}

function contentTypeLabel(type: SpotifyType) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function asSafeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

type SpotifyPlayerProps = {
  spotifyUrl?: string | null
  /** Matches the profile theme. Defaults to TapVinci gold. */
  accentColor?: string
  className?: string
}

export default function SpotifyPlayer({ spotifyUrl, accentColor = '#D4AF37', className }: SpotifyPlayerProps) {
  const parsed = useMemo(() => parseSpotifyUrl(spotifyUrl), [spotifyUrl])

  // useMemo above always runs, so this early return is hooks-safe.
  if (!parsed) return null

  return (
    <SpotifyBoundary key={parsed.url}>
      <SpotifyPlayerCard parsed={parsed} accentColor={accentColor || '#D4AF37'} className={className} />
    </SpotifyBoundary>
  )
}

function SpotifyPlayerCard({
  parsed,
  accentColor,
  className,
}: {
  parsed: ParsedSpotify
  accentColor: string
  className?: string
}) {
  const [meta, setMeta] = useState<SpotifyOEmbed | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [artFailed, setArtFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Never fetch during SSR. This effect runs in the browser only.
    const controller = new AbortController()
    let active = true
    let timedOut = false

    setLoading(true)
    setFailed(false)

    // Small debounce so typing/pasting in the dashboard preview does not spam oEmbed.
    const debounceTimer = setTimeout(async () => {
      const timeoutTimer = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, OEMBED_TIMEOUT_MS)

      try {
        const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.url)}`, {
          signal: controller.signal,
          // oEmbed is a public endpoint and requires no auth/token.
          headers: { Accept: 'application/json' },
        })

        if (!res.ok) throw new Error(`Spotify oEmbed responded ${res.status}`)

        const data = (await res.json()) as SpotifyOEmbed
        if (!active) return

        setMeta({
          title: asSafeString(data?.title),
          thumbnail_url: asSafeString(data?.thumbnail_url),
        })
      } catch (err) {
        // Unmount/URL-change aborts are expected and must not update state.
        if (!active) return
        if ((err as Error)?.name === 'AbortError' && !timedOut) return
        setFailed(true)
      } finally {
        clearTimeout(timeoutTimer)
        if (active) setLoading(false)
      }
    }, 350)

    return () => {
      active = false
      clearTimeout(debounceTimer)
      controller.abort()
    }
  }, [parsed, attempt])

  const rawTitle = asSafeString(meta?.title)

  // Some oEmbed titles arrive as "Song Name - Artist", some as just the title.
  let trackTitle = rawTitle
  let artist = ''
  if (rawTitle && parsed.type === 'track') {
    const splitAt = rawTitle.lastIndexOf(' - ')
    if (splitAt > 0) {
      trackTitle = rawTitle.slice(0, splitAt).trim()
      artist = rawTitle.slice(splitAt + 3).trim()
    }
  }

  const displayTitle =
    trackTitle || (parsed.type === 'track' ? 'Spotify Track' : `Spotify ${contentTypeLabel(parsed.type)}`)
  const subtitle = artist || (parsed.type === 'track' ? 'Spotify' : contentTypeLabel(parsed.type))
  const thumbnail = asSafeString(meta?.thumbnail_url)
  const showArt = !!thumbnail && !artFailed
  const embedHeight = parsed.type === 'track' || parsed.type === 'episode' ? 80 : 152

  const shellClass = [
    'relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/80 p-3 text-left shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')

  if (loading) {
    return (
      <div
        className={shellClass}
        style={{ borderColor: `${accentColor}33` }}
        aria-busy="true"
        aria-label="Loading Spotify track"
      >
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-2 w-16 animate-pulse rounded-full bg-white/10" />
            <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-white/10" />
            <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={shellClass}
      style={{ borderColor: `${accentColor}33` }}
      aria-label={`Spotify player for ${displayTitle}`}
    >
      {/* Subtle themed glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(140px circle at 0% 0%, ${accentColor}1F, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-3">
        {/* Album art (falls back to the Spotify glyph if the CDN image fails) */}
        {showArt ? (
          <img
            src={thumbnail}
            alt={`${displayTitle} album art`}
            width={56}
            height={56}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setArtFailed(true)}
            className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
          />
        ) : (
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/50"
            aria-hidden="true"
          >
            <SpotifyIcon className="h-6 w-6" />
          </div>
        )}

        {/* Track info */}
        <div className="min-w-0 flex-1">
          <p
            className="mb-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: accentColor }}
          >
            <SpotifyIcon className="h-2.5 w-2.5 shrink-0" />
            {expanded ? 'Now Playing' : 'Spotify'}
          </p>
          <p className="truncate text-[13px] font-bold leading-tight text-white" title={displayTitle}>
            {displayTitle}
          </p>
          <p className="mt-0.5 truncate text-[10px] font-medium text-zinc-400" title={subtitle}>
            {failed ? 'Preview unavailable' : subtitle}
          </p>
        </div>

        {/* Custom play / hide control */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide Spotify player' : `Play ${displayTitle} on Spotify`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-black transition-transform duration-200 hover:scale-105 active:scale-95"
          style={{ background: accentColor, boxShadow: `0 6px 18px ${accentColor}55` }}
        >
          {expanded ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      {/* Fallback actions when the oEmbed preview fails. Playback still works. */}
      {failed && (
        <div className="relative mt-2 flex items-center gap-3 border-t border-white/10 pt-2">
          <a
            href={parsed.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-80"
            style={{ color: accentColor }}
          >
            Open in Spotify <ExternalIcon />
          </a>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="text-[10px] font-semibold text-zinc-400 transition-colors hover:text-white"
          >
            Try again
          </button>
          <span className="ml-auto text-[9px] text-zinc-600">Tap play to listen</span>
        </div>
      )}

      {/* Official Spotify embed: handles the actual (licensed) playback. */}
      {expanded && (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <iframe
            key={parsed.url}
            title={`Spotify player — ${displayTitle}`}
            src={`https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0&autoplay=1`}
            width="100%"
            height={embedHeight}
            frameBorder="0"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="block w-full"
            style={{ border: 0 }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Keeps a Spotify failure isolated from the profile page. Returns null instead
 * of propagating a render error that would blank the whole route.
 */
class SpotifyBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SpotifyPlayer] Render failed and was isolated:', error, info)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px]" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72c0 .78.84 1.26 1.5.86l10.02-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0Zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.1-10.561-1.14-.4.12-.84-.12-.96-.48-.12-.42.12-.84.48-.96 4.56-1.02 8.52-.6 11.641 1.32.36.24.48.66.24 1.02Zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.84-.66 13.561 1.62.361.18.541.78.18 1.2Zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3Z" />
    </svg>
  )
}
