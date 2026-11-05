import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(req: Request) {
  try {
    const { username } = await req.json()
    if (!username) return NextResponse.json({ error: 'No username' }, { status: 400 })

    // Call the SQL function we created to safely increment the view count
    const { error } = await supabase.rpc('increment_view', { profile_username: username })

    if (error) {
      console.error('SUPABASE RPC ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`View tracked successfully for: ${username}`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('API ERROR:', err)
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}