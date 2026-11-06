import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ADMIN_COOKIE = 'tapvinci_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

function passwordMatches(input: string, expected: string) {
  // Hash both values so the comparison is constant-time and does not leak length.
  const a = createHash('sha256').update(input).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

function sessionToken(secret: string) {
  const payload = `${Date.now()}.${randomBytes(16).toString('hex')}`
  const signature = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${signature}`
}

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    return NextResponse.json(
      { error: 'Admin password is not configured on the server. Set ADMIN_PASSWORD.' },
      { status: 500 }
    )
  }

  let password = ''
  try {
    const body = await req.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!password || !passwordMatches(password, expected)) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: sessionToken(expected),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}

// Clears the session cookie on logout.
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
