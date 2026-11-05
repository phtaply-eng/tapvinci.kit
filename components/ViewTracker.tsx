'use client'

import { useEffect } from 'react'

export default function ViewTracker({ username }: { username: string }) {
  useEffect(() => {
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    }).catch(() => {})
  }, [username])
  
  return null
}

