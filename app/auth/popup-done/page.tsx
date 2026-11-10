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

    try {
      window.opener?.postMessage('tapvinci-signed-in', window.location.origin)
    } catch {}

    // 2. Try to close automatically after 1.5 seconds
    const closeTimer = setTimeout(() => {
      window.close()
    }, 1500)

    // 3. If it can't close (mobile block), show the manual close button after 1.8 seconds
    const stuckTimer = setTimeout(() => {
      setStuck(true)
    }, 1800)

    return () => {
      clearTimeout(closeTimer)
      clearTimeout(stuckTimer)
    }
  }, [])

  const handleClose = () => {
    window.close()
    // Fallback if window.close() is completely blocked by the browser
    // We redirect to the root, which will reload their profile
    if (window.opener) {
      window.opener.focus()
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#0b0b0b',
        color: '#F5F1E8',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        position: 'relative',
      }}
    >
      {/* Top Right X Button */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#1E1E20',
          color: '#A1A1A1',
          border: '1px solid #2A2A2A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>

      <div>
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 20px',
            borderRadius: '50%',
            border: '1px solid rgba(212,175,55,0.4)',
            background: 'rgba(212,175,55,0.1)',
            color: '#D4AF37',
            fontSize: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✓
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>You&apos;re signed in</h1>
        
        <p style={{ marginTop: 12, fontSize: 14, color: '#A1A1A1', maxWidth: '300px', margin: '12px auto 0 auto', lineHeight: 1.5 }}>
          {stuck
            ? 'Please tap the button below to close this window and return to your card.'
            : 'Taking you back to your card…'}
        </p>

        {stuck && (
          <button
            onClick={handleClose}
            style={{
              marginTop: '24px',
              padding: '14px 28px',
              borderRadius: '999px',
              background: '#D4AF37',
              color: '#050505',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
            }}
          >
            Close Window
          </button>
        )}
      </div>
    </main>
  )
}