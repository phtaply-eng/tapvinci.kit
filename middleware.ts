import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Dashboard auth is OFF unless explicitly enabled with ENFORCE_DASHBOARD_AUTH=true.
const AUTH_ENFORCED = process.env.ENFORCE_DASHBOARD_AUTH === 'true'

export async function middleware(request: NextRequest) {
  // Phase 1: allow everything through. Dashboard stays open without login.
  if (!AUTH_ENFORCED) {
    return NextResponse.next()
  }

  // Only the dashboard is protected. /auth/callback must stay reachable so the
  // code exchange can complete and write the session cookies.
  if (!request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.search = ''
    redirectUrl.searchParams.set('auth_required', '1')
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard', '/auth/callback'],
}
