'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { createClient } from '@/lib/supabase-browser'
import { claimCardAction, type ClaimState } from './actions'

const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "Montserrat, Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
const GOLD = '#D4AF37'

type Mode = 'start' | 'email' | 'sent'

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
  cursor: 'pointer',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid #2e2e2e',
  background: '#0d0d0d',
  color: '#f5f1e8',
  fontFamily: SANS,
  fontSize: '13px',
  outline: 'none',
}

const errorBoxStyle: CSSProperties = {
  marginTop: '16px',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(224,141,141,0.35)',
  background: 'rgba(224,141,141,0.07)',
  color: '#e08d8d',
  fontSize: '11px',
  lineHeight: 1.55,
  textAlign: 'left',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
}

const initialClaimState: ClaimState = { error: null }

function ClaimSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} style={{ ...goldButton, opacity: pending ? 0.65 : 1 }}>
      {pending ? 'Claiming...' : 'Claim this card'}
    </button>
  )
}

/**
 * Claim button. The claim runs in a server action, which atomically sets
 * status = 'claimed' and claimed_by = user.id only while the card is unclaimed.
 */
export function ClaimCardButton({ code, username }: { code: string; username: string | null }) {
  const [state, formAction] = useFormState(
    claimCardAction.bind(null, code, username),
    initialClaimState
  )

  return (
    <form action={formAction}>
      <ClaimSubmitButton />

      {state.error && (
        <div role="alert" style={errorBoxStyle}>
          <p style={{ margin: 0, color: '#f0a8a8', fontSize: '12px', fontWeight: 700 }}>
            Claim failed
          </p>
          <p style={{ margin: '6px 0 0', color: '#efc3c3', fontSize: '11.5px', lineHeight: 1.55 }}>
            {state.error}
          </p>
        </div>
      )}
    </form>
  )
}

export default function ClaimScreen({ code, message }: { code: string; message?: string }) {
  const [supabase] = useState(() => createClient())
  const [mode, setMode] = useState<Mode>('start')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCooldown = () => {
    setCooldown(30)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCooldown((value) => {
        if (value <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return value - 1
      })
    }, 1000)
  }

  const buildCallbackUrl = () => {
    return `${window.location.origin}/auth/callback?next=/c/${encodeURIComponent(code)}`
  }

  const handleGoogle = async () => {
    setBusy(true)
    setError('')
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: buildCallbackUrl() },
      })
      if (oauthError) throw oauthError
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Google sign-in. Please try again.')
      setBusy(false)
    }
  }

  const sendEmailLink = async () => {
    const clean = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Enter a valid email address.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: clean,
        options: { emailRedirectTo: buildCallbackUrl() },
      })
      if (otpError) throw otpError
      setEmail(clean)
      setMode('sent')
      startCooldown()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the sign-in link. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const useDifferentEmail = () => {
    setError('')
    setMode('email')
  }

  return (
    <div style={{ padding: '30px 24px 28px', textAlign: 'center' }}>
      {message && (
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
      )}

      {mode === 'start' && (
        <>
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
          <h1 style={titleStyle}>Claim your card</h1>
          <p style={{ ...copyStyle, marginBottom: '26px' }}>
            Sign in to link this TapVinci NFC card to your profile. One card, one owner &mdash; yours for life.
          </p>

          <button type="button" onClick={handleGoogle} disabled={busy} style={{ ...goldButton, opacity: busy ? 0.65 : 1 }}>
            {busy ? (
              'Connecting...'
            ) : (
              <>
                <i className="fa-brands fa-google" style={{ fontSize: '14px' }} />
                Continue with Google
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <span style={{ flex: 1, height: '1px', background: '#242424' }} />
            <span style={{ color: '#5d5952', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>or</span>
            <span style={{ flex: 1, height: '1px', background: '#242424' }} />
          </div>

          <button type="button" onClick={() => { setError(''); setMode('email') }} disabled={busy} style={ghostButton}>
            <i className="fa-regular fa-envelope" style={{ fontSize: '12px' }} />
            Continue with email
          </button>
        </>
      )}

      {mode === 'email' && (
        <>
          <button
            type="button"
            onClick={() => { setError(''); setMode('start') }}
            style={{ background: 'none', border: 0, color: '#77726a', fontSize: '11px', cursor: 'pointer', marginBottom: '20px' }}
          >
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '7px', fontSize: '9px' }} />
            Back
          </button>
          <h1 style={titleStyle}>Continue with email</h1>
          <p style={{ ...copyStyle, marginBottom: '24px' }}>
            Enter your email and we&rsquo;ll send you a secure sign-in link. No password needed.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void sendEmailLink()
            }}
          >
            <label htmlFor="claim-email" style={{ display: 'block', marginBottom: '8px', color: '#77726a', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', textAlign: 'left' }}>
              Email address
            </label>
            <input
              id="claim-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
            />
            {error && (
              <p role="alert" style={{ margin: '10px 0 0', color: '#e08d8d', fontSize: '11.5px', lineHeight: 1.5, textAlign: 'left' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} style={{ ...goldButton, marginTop: '16px', opacity: busy ? 0.65 : 1 }}>
              {busy ? 'Sending...' : 'Email me a sign-in link'}
            </button>
          </form>
        </>
      )}

      {mode === 'sent' && (
        <>
          <div
            style={{
              width: '62px',
              height: '62px',
              margin: '0 auto 22px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              border: '1px solid rgba(212,175,55,0.28)',
              background: 'rgba(212,175,55,0.08)',
              color: GOLD,
              fontSize: '22px',
            }}
          >
            <i className="fa-regular fa-envelope-open" />
          </div>
          <h1 style={titleStyle}>Check your email</h1>
          <p style={copyStyle}>
            We sent a sign-in link to <strong style={{ color: '#d6d0c6' }}>{email}</strong>. Open it on this device to finish claiming your card.
          </p>

          {error && (
            <p role="alert" style={{ margin: '12px 0 0', color: '#e08d8d', fontSize: '11.5px', lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => void sendEmailLink()}
              disabled={busy || cooldown > 0}
              style={{
                ...ghostButton,
                opacity: busy || cooldown > 0 ? 0.55 : 1,
                cursor: busy || cooldown > 0 ? 'default' : 'pointer',
              }}
            >
              {busy ? 'Sending...' : cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'}
            </button>
            <button
              type="button"
              onClick={useDifferentEmail}
              style={{ background: 'none', border: 0, color: '#77726a', fontSize: '11px', cursor: 'pointer', marginTop: '16px' }}
            >
              Use a different email
            </button>
          </div>
        </>
      )}

      <p style={{ margin: '24px 0 0', color: '#4f4b44', fontSize: '9.5px', lineHeight: 1.6 }}>
        By continuing, you agree to link this card to your TapVinci account.
      </p>
    </div>
  )
}