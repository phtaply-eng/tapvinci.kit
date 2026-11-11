'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Invisible counter used by every public profile.
 * It calls the generic `record_profile_tap` RPC once per page load.
 */
export default function TapTracker({ username }: { username: string }) {
  const hasCounted = useRef(false)

  useEffect(() => {
    if (hasCounted.current) return
    hasCounted.current = true

    const record = async () => {
      const { error } = await supabase.rpc('record_profile_tap', {
        p_username: username.toLowerCase(),
      })
      if (error) {
        console.warn('[TapTracker] record_profile_tap failed:', error.message)
      }
    }

    record()
  }, [username])

  return null
}
