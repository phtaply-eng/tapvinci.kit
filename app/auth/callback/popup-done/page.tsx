'use client'

import { useEffect, useState } from 'react'

export default function PopupDone() {
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    // 1. Tell the main page that auth is done
    try {
      const channel = new BroadcastChannel('tapvinci-auth')
      channel.postMessage('signed-in')
      channel.close()
    } catch {}

    // 2. Fallback: Tell the main page using window.postMessage
    try {
      window.opener?.postMessage('tapvinci-signed-in', window.location.origin)
    } catch {}

    // 3. Try to close the window
    const closeTimer = setTimeout(() => window.close(), 250)
    
    // 4. If it can't close (common on mobile browsers), show a message
    const stuckTimer = setTimeout(() => setStuck(true), 1200)

    return () => {
      clearTimeout(closeTimer)
      clearTimeout(stuckTimer)
    }
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#0b0b0b',
        color: '#F5F1E8',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <div>
        <div
          style={{
            width: 56,
            height: 56,
            margin: '0 auto 16px',
            borderRadius: '50%',
            border: '1px solid rgba(212,175,55,0.4)',
            background: 'rgba(212,175,55,0.1)',
            color: '#D4AF37',
            fontSize: 24,
            lineHeight: '54px',
          }}
        >
          ✓
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>You&apos;re signed in</h1>
        <p style={{ marginTop: 8, fontSize: 13, color: '#A1A1A1' }}>
          {stuck
            ? 'You can close this window and go back to your card.'
            : 'Taking you back to your card…'}
        </p>
      </div>
    </main>
  )
}