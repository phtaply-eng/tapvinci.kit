import type { CSSProperties, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import ClaimScreen, { ClaimCardButton } from './ClaimScreen'
import { signOutAction } from './actions'

export const dynamic = 'force-dynamic'

const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "Montserrat, Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
const GOLD = '#D4AF37'

const MESSAGES: Record<string, string> = {
  not_found: 'We could not find that card. Check the code and try again.',
  already_claimed: 'This card has already been claimed.',
  not_authenticated: 'Please sign in to claim this card.',
  owned_by_you: 'This card is already linked to your account.',
  claimed: 'Card claimed successfully.',
  error: 'Something went wrong. Please try again.',
}

type CardRecord = {
  id: string
  card_code: string
  claimed_by: string | null
  claimed_at: string | null
}

type CardPageProps = {
  params: { cardId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

const goldButton: CSSProperties = {
  width: '100%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '15px 20px',
  borderRadius: '999px',
  border: `1px solid ${GOLD}`,
  background: GOLD,
  color: '#0b0b0b',
  fontFamily: SANS,
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textDecoration: 'none',
  cursor: 'pointer',
}

const ghostButton: CSSProperties = {
  width: '100%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '13px 20px',
  borderRadius: '999px',
  border: '1px solid #2c2c2c',
  background: 'transparent',
  color: '#a8a29a',
  fontFamily: SANS,
  fontSize: '12px',
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
}

const titleStyle: CSSProperties = {
  margin: 0,
  color: '#f5f1e8',
  fontFamily: SERIF,
  fontSize: '34px',
  fontWeight: 600,
  lineHeight: 1.1,
  letterSpacing: '-0.015em',
}

const copyStyle: CSSProperties = {
  margin: '14px 0 0',
  color: '#8f8a80',
  fontSize: '13px',
  lineHeight: 1.7,
}

const panelStyle: CSSProperties = {
  padding: '30px 24px 28px',
  textAlign: 'center',
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#0b0b0b',
        color: '#f5f1e8',
        fontFamily: SANS,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '-22%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(760px, 140vw)',
          height: '520px',
          background: 'radial-gradient(circle, rgba(212,175,55,0.13), transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: '#111111',
          border: '1px solid #242424',
          borderRadius: '28px',
          boxShadow: '0 30px 90px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
        <header style={{ padding: '28px 24px 4px', textAlign: 'center' }}>
          <Link href="/" style={{ display: 'inline-block' }}>
            <Image
              src="/tapvinci-logo.png"
              alt="TapVinci"
              width={140}
              height={38}
              priority
              style={{ width: 'auto', height: '34px', objectFit: 'contain' }}
            />
          </Link>
          <p style={{ margin: '10px 0 0', color: '#6f6a5f', fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase' }}>
            Tap &middot; Connect &middot; Remember
          </p>
        </header>
        {children}
      </div>
      <p style={{ position: 'relative', margin: '18px 0 0', color: '#454239', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        TapVinci NFC Card
      </p>
    </main>
  )
}

function CodeChip({ code }: { code: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '22px',
        padding: '7px 13px',
        borderRadius: '999px',
        border: '1px solid rgba(212,175,55,0.28)',
        background: 'rgba(212,175,55,0.08)',
        color: GOLD,
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.22em',
      }}
    >
      <i className="fa-solid fa-wave-square" style={{ fontSize: '9px' }} />
      {code}
    </span>
  )
}

function MessageBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div
      style={{
        margin: '0 0 20px',
        padding: '11px 14px',
        borderRadius: '12px',
        border: '1px solid rgba(212,175,55,0.26)',
        background: 'rgba(212,175,55,0.08)',
        color: '#d9c27a',
        fontSize: '11.5px',
        lineHeight: 1.55,
      }}
    >
      {message}
    </div>
  )
}

function NotFoundPanel() {
  return (
    <div style={panelStyle}>
      <div
        style={{
          width: '58px',
          height: '58px',
          margin: '0 auto 22px',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          border: '1px solid rgba(212,175,55,0.26)',
          background: 'rgba(212,175,55,0.08)',
          color: GOLD,
          fontSize: '20px',
        }}
      >
        <i className="fa-solid fa-link-slash" />
      </div>
      <h1 style={titleStyle}>Card not found</h1>
      <p style={copyStyle}>
        This code doesn&rsquo;t match an active TapVinci card. Check the code printed on your card and try again.
      </p>
      <Link href="/" style={{ ...goldButton, marginTop: '26px' }}>
        Back to TapVinci
      </Link>
    </div>
  )
}

function ClaimedPanel({ code, claimedOn }: { code: string; claimedOn: string | null }) {
  return (
    <div style={panelStyle}>
      <CodeChip code={code} />
      <div
        style={{
          width: '58px',
          height: '58px',
          margin: '0 auto 22px',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          border: '1px solid rgba(212,175,55,0.26)',
          background: 'rgba(212,175,55,0.08)',
          color: GOLD,
          fontSize: '20px',
        }}
      >
        <i className="fa-solid fa-circle-check" />
      </div>
      <h1 style={titleStyle}>Card already claimed</h1>
      <p style={copyStyle}>
        This TapVinci card is already linked to an account. If you believe this is a mistake, please contact TapVinci support.
      </p>
      {claimedOn && (
        <p style={{ ...copyStyle, marginTop: '10px', color: '#635e55', fontSize: '11px' }}>
          Claimed on {claimedOn}
        </p>
      )}
      <Link href="/dashboard" style={{ ...goldButton, marginTop: '26px' }}>
        Go to dashboard
      </Link>
    </div>
  )
}

function ClaimPanel({
  code,
  email,
  message,
  wantsClaim,
}: {
  code: string
  email?: string | null
  message?: string
  wantsClaim: boolean
}) {
  return (
    <div style={panelStyle}>
      <CodeChip code={code} />
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          marginBottom: '18px',
          padding: '6px 12px',
          borderRadius: '999px',
          border: '1px solid rgba(212,175,55,0.22)',
          background: 'rgba(212,175,55,0.06)',
          color: '#b9a35e',
          fontSize: '9.5px',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        <i className="fa-solid fa-lock" style={{ fontSize: '8px' }} />
        Signed in
      </span>
      <h1 style={titleStyle}>{wantsClaim ? 'Finish claiming your card' : 'Claim your card'}</h1>
      <p style={copyStyle}>
        Link card <strong style={{ color: GOLD, letterSpacing: '0.12em' }}>{code}</strong> to your TapVinci account
        {email ? <> as <span style={{ color: '#d6d0c6' }}>{email}</span></> : null}.
      </p>
      <div style={{ marginTop: '22px' }}>
        <MessageBanner message={message} />
        <ClaimCardButton code={code} />
      </div>
      <form action={signOutAction.bind(null, code)} style={{ marginTop: '12px' }}>
        <button type="submit" style={ghostButton}>
          Not you? Sign out
        </button>
      </form>
    </div>
  )
}

export default async function CardPage({ params, searchParams }: CardPageProps) {
  const rawCode = (params.cardId || '').trim()
  const code = rawCode.toUpperCase()
  const supabase = createClient()

  let card: CardRecord | null = null

  if (code) {
    const { data, error } = await supabase
      .from('cards')
      .select('id, card_code, claimed_by, claimed_at')
      .eq('card_code', code)
      .maybeSingle()

    if (error) console.error('[Card page] Card lookup failed:', error.message)
    card = (data as CardRecord | null) ?? null

    // Fall back to the exact casing if the card was stored differently.
    if (!card && rawCode !== code) {
      const { data: exact } = await supabase
        .from('cards')
        .select('id, card_code, claimed_by, claimed_at')
        .eq('card_code', rawCode)
        .maybeSingle()
      card = (exact as CardRecord | null) ?? null
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!card) {
    return (
      <Shell>
        <NotFoundPanel />
      </Shell>
    )
  }

  if (card.claimed_by) {
    const claimedOn = card.claimed_at
      ? new Date(card.claimed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null

    return (
      <Shell>
        <ClaimedPanel code={card.card_code} claimedOn={claimedOn} />
      </Shell>
    )
  }

  const msgParam = typeof searchParams.msg === 'string' ? searchParams.msg : undefined
  const message = msgParam ? MESSAGES[msgParam] || MESSAGES.error : undefined
  const wantsClaim = searchParams.claim === '1'

  if (!user) {
    return (
      <Shell>
        <ClaimScreen code={card.card_code} message={message} />
      </Shell>
    )
  }

  return (
    <Shell>
      <ClaimPanel code={card.card_code} email={user.email} message={message} wantsClaim={wantsClaim} />
    </Shell>
  )
}
