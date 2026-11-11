import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  const cookieStore = cookies()
  // Prefer the explicit ?next= param. Fall back to the legacy popup cookie.
  const next = safeRedirectPath(
    searchParams.get('next') ?? cookieStore.get('auth_next')?.value
  )

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Clear the legacy cookie now that we've used it
      cookieStore.set('auth_next', '', { maxAge: 0 })

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const baseUrl =
        isLocalEnv || !forwardedHost ? origin : `https://${forwardedHost}`

      return NextResponse.redirect(new URL(next, baseUrl))
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth-failed`)
}

/**
 * Keep redirects on this origin. Accepts a same-origin absolute URL (as sent by
 * the profile sign-in flow) or a path starting with a single "/".
 */
function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw) return '/'
  const value = raw.trim()
  if (!value) return '/'

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      return `${url.pathname}${url.search}${url.hash}` || '/'
    } catch {
      return '/'
    }
  }

  // Reject protocol-relative (//evil.com), backslash tricks, and non-path values.
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001F]/.test(value)
  ) {
    return '/'
  }
  return value
}
