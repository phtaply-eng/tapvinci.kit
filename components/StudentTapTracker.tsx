'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

// Put this on the public student page. Counts one tap per visitor session.
export default function StudentTapTracker({ username }: { username: string }) {
  useEffect(() => {
    const key = `tv_tap_${username}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {}
    createClient().rpc('record_student_tap', { p_username: username }).then(() => {})
  }, [username])
  return null
}