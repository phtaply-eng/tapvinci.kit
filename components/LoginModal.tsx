'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase-browser'

const CHANNEL = 'tapvinci-auth'
const POLL_MS = 1500
const GIVE_UP_MS = 3 * 60 * 1000

type LoginModalProps = {
  isOpen: boolean
  onClose: () => void
  onSignInStart?: () => void
  onAuthComplete?: () => void
}

export default function LoginModal({
  isOpen,
  onClose,
  onSignInStart,
  onAuthComplete,
}: LoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const giveUpRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneRef = useRef(false)
  const completeRef = useRef(onAuthComplete)
  completeRef.current = onAuthComplete

  const stopWaiting = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (giveUpRef.current) clearTimeout(giveUpRef.current)
    pollRef.current = null
    giveUpRef.current = null
  }

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    stopWaiting()
    setLoading(false)
    completeRef.current?.()
  }
  const finishRef = useRef(finish)
  finishRef.current = finish

  useEffect(() => {
    setMounted(true)
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel(CHANNEL)
      channel.onmessage = (event) => {
        if (event.data === 'signed-in') finishRef.current()
      }
    } catch {}

    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data === 'tapvinci-signed-in') {
        finishRef.current()
      }
    }
    window.addEventListener('message', onMessage)

    return () => {
      channel?.close()
      window.removeEventListener('message', onMessage)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      stopWaiting()
      setLoading(false)
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    return () => stopWaiting()
  }, [])

  if (!mounted || !isOpen) return null

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    doneRef.current = false

    const supabase = createClient()

    // 1. Set a cookie to tell the callback route to redirect to popup-done
    document.cookie = "auth_next=/auth/popup-done; path=/; max-age=600; SameSite=Lax"

    // 2. Clean redirect URL (no query params to confuse Supabase)
    const origin = window.location.origin
    const popupRedirect = `${origin}/auth/callback`

    let startUserId: string | null = null
    try {
      const { data } = await supabase.auth.getUser()
      startUserId = data?.user?.id ?? null
    } catch {}

    onSignInStart?.()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: popupRedirect,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    })

    if (error || !data?.url) {
      setError(error?.message ?? 'Could not start Google sign-in. Please try again.')
      setLoading(false)
      return
    }

    const popup = window.open(
      data.url,
      'tapvinci-google-login',
      'width=500,height=640,scrollbars=yes,resizable=yes'
    )

    if (!popup) {
      // Fallback if popup is blocked
      const backTo = `${window.location.pathname}?edit_profile=1`
      const { error: fallbackError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (fallbackError) {
        setError(fallbackError.message)
        setLoading(false)
      }
      return
    }

    pollRef.current = setInterval(async () => {
      try {
        const { data: current } = await supabase.auth.getUser()
        const id = current?.user?.id ?? null
        if (id && id !== startUserId) finishRef.current()
      } catch {}
    }, POLL_MS)

    giveUpRef.current = setTimeout(() => {
      stopWaiting()
      setLoading(false)
      setError('Sign-in took too long. Please try again.')
    }, GIVE_UP_MS)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#121214] border border-[#2A2A2A] rounded-3xl w-full max-w-[360px] p-6 relative shadow-[0_0_80px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1E1E20] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 bg-[#1E1E20] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#2A2A2A]">
            <i className="fa-solid fa-lock text-2xl text-[#22c55e]"></i>
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Are you the owner?</h2>
          <p className="text-[13px] text-[#A1A1A1] leading-relaxed">
            Sign in to edit your TapVinci profile.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold text-sm py-3.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-70"
        >
          {loading ? (
            <span className="animate-pulse">Opening Google...</span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p className="text-[10px] text-[#71717A] text-center mt-6">
          By signing in, you verify that you are the owner of this card.
        </p>
      </div>
    </div>,
    document.body
  )
}