'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase-browser'

type TapResult = {
  counted?: boolean
  tap_count?: number
  streak_count?: number
}

export default function StudentTapTracker({
  username,
  isOwner = false,
}: {
  username: string
  isOwner?: boolean
}) {
  const [tapCount, setTapCount] = useState<number | null>(null)
  const [streak, setStreak] = useState<number | null>(null)

  useEffect(() => {
    if (!username) return
    if (isOwner) return
    const supabase = createClient()
    supabase
      .rpc('record_student_tap', { p_username: username })
      .then(({ data, error }) => {
        if (error) return
        const row = (Array.isArray(data) ? data[0] : data) as TapResult | null
        if (!row) return
        if (typeof row.tap_count === 'number') setTapCount(row.tap_count)
        if (typeof row.streak_count === 'number') setStreak(row.streak_count)
      })
  }, [username, isOwner])

  if (tapCount === null) return null

  return (
    <div className="rounded-2xl border p-4 text-center">
      <p className="text-2xl font-bold">{tapCount} taps</p>
      <p className="text-sm opacity-70">{streak ?? 0} day streak</p>
    </div>
  )
}
