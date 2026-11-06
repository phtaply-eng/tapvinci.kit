import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(req: Request) {
  try {
    const { username } = await req.json()
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

    // 1. Fetch the client's email and name from Supabase
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('username', username)
      .single()

    if (dbError || !profile) {
      console.error('DB Error:', dbError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.email) {
      console.error('No email on profile:', username)
      return NextResponse.json({ error: 'This profile does not have an email address saved.' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 })

    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tapvinci.vercel.app').replace(/\/+$/, '')
    const liveUrl = `${site}/${encodeURIComponent(username)}`

    // 2. Send the "You are live" email to the client
    const html = `
      <div style="font-family:sans-serif;background:#050505;color:#fff;padding:24px;border-radius:16px;max-width:560px;margin:0 auto;border:1px solid #1E1E1E;">
        <h2 style="color:#D4AF37;margin:0 0 8px">Your TapVinci Profile is Live! 🎉</h2>
        <p style="color:#A1A1A1;font-size:14px;line-height:1.6;">Hi ${profile.name || username},</p>
        <p style="color:#A1A1A1;font-size:14px;line-height:1.6;">We have successfully verified your payment. Your premium digital profile is now active and ready to be shared.</p>
        <div style="margin:24px 0;">
          <a href="${liveUrl}" style="background:#E8C766;color:#000;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block;">View Your Live Profile →</a>
        </div>
        <p style="color:#6B7280;font-size:11px;">Your Link: ${liveUrl}<br/>Thank you for choosing TapVinci.</p>
      </div>
    `

    console.log('Attempting to send email to:', profile.email)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'TapVinci <onboarding@resend.dev>',
        to: [profile.email],
        subject: 'Your TapVinci Profile is Now Live! 🎉',
        html,
      }),
    })

    const out = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error('Resend Error Payload:', out)
      // Return the exact Resend error message to the frontend
      return NextResponse.json({ error: out.message || 'Failed to send email via Resend' }, { status: 400 })
    }

    console.log('Email sent successfully:', out.id)
    return NextResponse.json({ success: true, id: out.id })
  } catch (err: any) {
    console.error('Server Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}