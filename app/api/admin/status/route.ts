import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Only reports whether the server has an admin password configured.
// The password value itself is never sent to the browser.
export async function GET() {
  return NextResponse.json(
    { pwSet: !!process.env.ADMIN_PASSWORD },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
