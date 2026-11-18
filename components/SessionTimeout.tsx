'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { type AuthChangeEvent, type UserResponse } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-browser'

/** Force a sign-out 20 minutes after the user signed in. */
const SESSION_TIMEOUT_MS = 20 * 60 * 1000

export default function SessionTimeout() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const supabase = createClient()

    const expire = async () => {
      try {
        // signOut() clears the Supabase auth cookies, so the session cannot be
        // reused. App-level flags are cleared as a belt-and-braces measure.
        await supabase.auth.signOut()
      } catch (error) {
        console.error('[SessionTimeout] sign out failed:', error)
      }

      try {
        window.sessionStorage.removeItem('tapvinci_admin_ok')
      } catch {
        // Storage can be unavailable (private mode / blocked cookies).
      }

      router.replace('/login?message=session_expired')
      router.refresh()
    }

    const startTimer = () => {
      if (cancelled) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(expire, SESSION_TIMEOUT_MS)
    }

    // Only count down when there is actually a session to expire.
    void supabase.auth.getUser().then(({ data }: UserResponse) => {
      if (!cancelled && data.user) startTimer()
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (cancelled) return
      if (event === 'SIGNED_IN') startTimer()
      if (event === 'SIGNED_OUT' && timer) {
        clearTimeout(timer)
        timer = undefined
      }
    })

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [router])

  return null
}
