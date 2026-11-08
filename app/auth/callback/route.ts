import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/?auth_error=1', requestUrl.origin))
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(new URL('/?auth_error=1', requestUrl.origin))
    }
  } catch {
    return NextResponse.redirect(new URL('/?auth_error=1', requestUrl.origin))
  }

  // Only allow local paths so ?next= cannot be used as an open redirect.
  const next = requestUrl.searchParams.get('next')
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin))
}
