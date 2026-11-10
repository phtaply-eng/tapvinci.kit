import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Dashboard auth is OFF unless explicitly enabled with ENFORCE_DASHBOARD_AUTH=true.
const AUTH_ENFORCED = process.env.ENFORCE_DASHBOARD_AUTH === 'true'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // 1. ALWAYS initialize Supabase to refresh sessions and sync cookies.
  // This is what allows the popup login to communicate with the main page.
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

  // 2. Refresh the session (this triggers the client-side onAuthStateChange)
  const { data, error } = await supabase.auth.getUser()

  // 3. Only apply the dashboard protection IF the env variable is true
  // AND the user is trying to access the dashboard.
  if (AUTH_ENFORCED && request.nextUrl.pathname.startsWith('/dashboard')) {
    if (error || !data.user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/'
      redirectUrl.search = ''
      redirectUrl.searchParams.set('auth_required', '1')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  // Run on all routes except static assets and images
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}