import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

type EventType = 'created' | 'updated' | 'deleted'

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// light per-username throttle (per server instance) so the public endpoint cannot be used to flood your inbox
const lastSent = new Map<string, number>()
const THROTTLE_MS = 15_000

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.ADMIN_EMAIL
    if (!apiKey || !adminEmail) {
      console.error('send-notification: RESEND_API_KEY or ADMIN_EMAIL is not set')
      return NextResponse.json({ error: 'Email is not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const username = String(body.username || '').trim().toLowerCase().slice(0, 60)
    const type: EventType = ['created', 'updated', 'deleted'].includes(body.type) ? body.type : 'created'
    if (!/^[a-z0-9_-]+$/.test(username)) return NextResponse.json({ error: 'Invalid username' }, { status: 400 })

    const key = `${type}:${username}`
    const now = Date.now()
    if (now - (lastSent.get(key) || 0) < THROTTLE_MS) return NextResponse.json({ skipped: 'throttled' })
    lastSent.set(key, now)

    // Details for created/updated come from the database, not from the request,
    // so nobody can make your inbox say something they typed in.
    const { data: row } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle()
    let d: { name?: string; email?: string; phone?: string; theme?: string }
    if (type === 'deleted') {
      if (row) return NextResponse.json({ error: 'Profile still exists' }, { status: 400 })
      d = { name: body.name, email: body.email, phone: body.phone, theme: body.theme }
    } else {
      if (!row) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      d = { name: row.name ?? row.business, email: row.email, phone: row.phone, theme: row.theme }
    }

    const name = String(d.name ?? '').slice(0, 120)
    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tapvinci.vercel.app').replace(/\/+$/, '')
    const live = `${site}/${encodeURIComponent(username)}`

    const subject =
      type === 'deleted' ? `TapVinci profile DELETED: ${username} - ${name}`
      : type === 'updated' ? `TapVinci profile UPDATED: ${username} - ${name}`
      : `New TapVinci profile: ${username} - ${name} - ${d.email || 'no email'}`
    const heading = type === 'deleted' ? 'Profile deleted' : type === 'updated' ? 'Profile updated' : 'New TapVinci Profile Created! 🎉'

    const rows: [string, string][] = [['Username', username], ['Name', name], ['Email', d.email || '-'], ['Phone', d.phone || '-'], ['Theme', d.theme || '-']]
    const html = `
      <div style="font-family:sans-serif;background:#050505;color:#fff;padding:24px;border-radius:16px;max-width:560px">
        <h2 style="color:#D4AF37;margin:0 0 8px">${esc(heading)}</h2>
        <div style="background:#121214;border:1px solid #2A2A2A;border-radius:12px;padding:16px;margin:16px 0">
          ${rows.map(([k, v]) => `<p style="margin:4px 0"><strong style="color:#D4AF37">${k}:</strong> ${esc(v)}</p>`).join('')}
        </div>
        <div style="margin:24px 0">
          ${type === 'deleted' ? '' : `<a href="${esc(live)}" style="background:#E8C766;color:#000;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block;margin:0 8px 8px 0">View Live Profile → /${esc(username)}</a>`}
          <a href="${esc(site)}/admin" style="background:#1E1E20;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;border:1px solid #2A2A2A;display:inline-block;margin:0 8px 8px 0">Open Admin Panel</a>
        </div>
        <p style="color:#6B7280;font-size:11px">Live URL: ${esc(live)}<br/>Admin: ${esc(site)}/admin</p>
      </div>`

    // Resend REST API directly - no `npm install resend` needed
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'TapVinci <onboarding@resend.dev>',
        to: [adminEmail],
        subject,
        html,
      }),
    })
    const out = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('Resend error:', out)
      return NextResponse.json({ error: out }, { status: 400 })
    }
    return NextResponse.json({ success: true, id: out.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
