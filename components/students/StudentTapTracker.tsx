'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

// Phase 3 Fix: Invisible tracker.
// It only calls record_student_tap and returns null, so it shows NO bar.
// The tap count is displayed by StudentStats inside the card, not here.
// The RPC itself skips owner views, so we don't need a client-side owner check.
export default function StudentTapTracker({ username }: { username: string }) {
  const hasCounted = useRef(false)

  useEffect(() => {
    if (hasCounted.current) return
    hasCounted.current = true

    const record = async () => {
      const { error } = await supabase.rpc('record_student_tap', {
        p_username: username.toLowerCase(),
      })
      if (error) {
        // Don't break the page if tap counting fails, just log it
        console.warn('[StudentTapTracker] record_student_tap failed:', error.message)
      }
    }

    record()
  }, [username])

  return null
}