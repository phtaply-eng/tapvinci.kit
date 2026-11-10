'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Tiny toast rendered above everything (including the edit drawer).
 * Pass a message to show it, an empty string to hide it. The parent decides
 * how long it stays (see the timers in TaplyTemplate and EditDrawer).
 */
export default function ToastView({ message }: { message: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !message) return null

  return createPortal(
    <>
      <style>{`
        @keyframes tvToastIn {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'max(24px, env(safe-area-inset-bottom))',
          transform: 'translateX(-50%)',
          zIndex: 100000,
          maxWidth: 'min(92vw, 420px)',
          padding: '12px 18px',
          borderRadius: '14px',
          background: 'rgba(18,18,20,0.96)',
          border: '1px solid #2A2A2A',
          color: '#F5F1E8',
          fontSize: '13px',
          lineHeight: 1.4,
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          animation: 'tvToastIn 0.25s ease-out both',
        }}
      >
        {message}
      </div>
    </>,
    document.body
  )
}
