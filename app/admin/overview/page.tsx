'use client'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

// TapVinci Admin - Overview: revenue, what needs doing today, recent orders. Read-only (edits happen in Orders & Sales).
// Package / payment / fulfillment fields come from supabase-orders.sql; rows without them use the same defaults as Orders & Sales.

const AUTH_KEY = 'tapvinci_admin_ok'
const PRICES = { card: 799, digital: 299 } as const
const FUL = ['pending', 'printing', 'shipped', 'completed'] as const
type Ful = (typeof FUL)[number]
type Row = { username: string; name?: string | null; business?: string | null; email?: string | null; phone?: string | null; created_at?: string | null; paid_at?: string | null; is_active?: boolean | null; gcash_qr_url?: string | null; maya_qr_url?: string | null; [k: string]: any }
type Review = { rating: number }

// Demo / test accounts: bulletproof - same rule as Orders & Sales. They stay live and editable
// but never count toward sales, the print queue, the pipeline or the to-do list.
const DEMO_USERNAMES = ['shua', 'tapvinci', 'robert']
const isDemoAccount = (p: any) => {
  const u = (p.username || p.business || '').toString().toLowerCase().trim()
  const e = (p.email || '').toString().toLowerCase().trim()
  const n = (p.name || '').toString().toLowerCase()
  return p.is_demo === true || DEMO_USERNAMES.some(d => u.includes(d)) || DEMO_USERNAMES.some(d => e.includes(d)) || n.includes('tapvinci') || u === 'shua'
}
const isDemo = isDemoAccount
const DEMO_BADGE_STYLE = { background: 'rgba(255,194,28,0.2)', color: '#FFC21C' } as const
const DEMO_PAY_STYLE = { background: '#1E1E1E', color: '#A1A1A1', borderColor: '#2A2A2A' } as const

const isCard = (p: Row) => p.package !== 'digital'
const priceOf = (p: Row) => (isCard(p) ? PRICES.card : PRICES.digital)
const payOf = (p: Row) => (p.payment_status === 'pending' || p.payment_status === 'failed' ? (p.payment_status as string) : 'paid')
const fulOf = (p: Row): Ful => ((FUL as readonly string[]).includes(p.fulfillment) ? p.fulfillment : 'pending')
const nameOf = (p: Row) => (p.name || p.business || p.username).toString()
const money = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const when = (v?: string | null) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null }
const dateText = (v?: string | null) => { const d = when(v); return d ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '-' }
function orderNo(p: Row) {
  let h = 0
  const s = `${p.username}|${p.created_at || ''}`
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return `TV-${p.username.toUpperCase()}-${String(h % 1000000).padStart(6, '0')}` // same format as Orders & Sales
}

export default function AdminOverview() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [profiles, setProfiles] = useState<Row[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const sync = () => { try { setAuthed(sessionStorage.getItem(AUTH_KEY) === '1') } catch { setAuthed(false) } }
    sync()
    window.addEventListener('tv-admin-auth', sync)
    return () => window.removeEventListener('tv-admin-auth', sync)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    let { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (err) { const retry = await supabase.from('profiles').select('*'); data = retry.data; err = retry.error }
    if (err) setError(err.message)
    setProfiles((data as Row[]) || [])
    const rv = await supabase.from('reviews').select('rating')
    if (!rv.error) setReviews((rv.data as Review[]) || [])
    setLoading(false)
  }, [])
  useEffect(() => { if (authed) load() }, [authed, load])

  const d = useMemo(() => {
    const active = profiles.filter((p) => p.is_active !== false)
    const demo = active.filter(isDemoAccount)
    const real = active.filter((p) => !isDemoAccount(p))
    const paid = real.filter((p) => payOf(p) === 'paid')
    // totalSalesRevenue MUST be 0 when only shua/tapvinci exist
    const now = new Date()
    const sameMonth = (v?: string | null, back = 0) => { const x = when(v); const t = new Date(now.getFullYear(), now.getMonth() - back, 1); return !!x && x.getFullYear() === t.getFullYear() && x.getMonth() === t.getMonth() }
    const months = Array.from({ length: 6 }, (_, i) => {
      const back = 5 - i
      const label = new Date(now.getFullYear(), now.getMonth() - back, 1).toLocaleDateString('en-US', { month: 'short' })
      const rows = paid.filter((p) => sameMonth(p.created_at, back))
      return { label, orders: rows.length, revenue: rows.reduce((s, p) => s + priceOf(p), 0) }
    })
    const byFul: Record<Ful, number> = { pending: 0, printing: 0, shipped: 0, completed: 0 }
    real.forEach((p) => { byFul[fulOf(p)] += 1 })
    const toPrint = paid.filter((p) => isCard(p) && fulOf(p) === 'pending').length
    return {
      active, real, demo, months, byFul,
      demoToPrint: demo.filter((p) => payOf(p) === 'paid' && isCard(p) && fulOf(p) === 'pending').length,
      revenue: paid.reduce((s, p) => s + priceOf(p), 0),
      monthRevenue: months[5].revenue, monthOrders: months[5].orders,
      avgOrder: paid.length ? paid.reduce((s, p) => s + priceOf(p), 0) / paid.length : 0,
      awaitingPay: real.filter((p) => payOf(p) === 'pending').length,
      failedPay: real.filter((p) => payOf(p) === 'failed').length,
      toPrint,
      printing: paid.filter((p) => isCard(p) && fulOf(p) === 'printing').length,
      toDeliver: paid.filter((p) => isCard(p) && fulOf(p) === 'shipped').length,
      noQr: real.filter((p) => !p.gcash_qr_url && !p.maya_qr_url).length,
      noEmail: real.filter((p) => !p.email).length,
      recent: active.slice(0, 5),
      realRecent: real.slice(0, 5),
    }
  }, [profiles])

  const reviewAvg = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0
  const maxRev = Math.max(1, ...d.months.map((m) => m.revenue))

  if (authed === null) return <div className="min-h-screen bg-[#050505]" />

      {/* DEBUG BANNER - Demo exclusion */}
      {d.demo.length > 0 && (
        <div className="bg-[#FFC21C]/10 border border-[#FFC21C]/20 rounded-xl p-3 text-xs text-[#FFC21C] mb-4 flex items-center gap-2">
          <i className="fa-solid fa-triangle-exclamation" />
          <span>Demo mode: {d.demo.length} demo accounts ({d.demo.map((p:any)=>p.username).join(', ')}) excluded - Real revenue {money(d.revenue)} - No real sales yet</span>
        </div>
      )}

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#121214] border border-[#2A2A2A] rounded-3xl p-6 text-center space-y-4">
          <h1 className="text-xl font-bold">TapVinci Admin</h1>
          <p className="text-xs text-gray-500">Please log in first.</p>
          <Link href="/admin" className="block h-11 leading-[44px] rounded-xl bg-[#E8C766] hover:bg-[#D4AF37] text-black font-bold text-sm">Go to admin login</Link>
        </div>
      </div>
    )
  }

  const todo = [
    { n: d.awaitingPay, text: 'orders waiting for GCash/Maya payment confirmation', icon: 'fa-hourglass-half', tone: '#FFC21C', cta: 'Review payments' },
    { n: d.failedPay, text: 'failed payments to follow up', icon: 'fa-triangle-exclamation', tone: '#f87171', cta: 'Review payments' },
    { n: d.toPrint, text: 'paid cards ready to print', icon: 'fa-print', tone: '#D4AF37', cta: 'Start printing' },
    { n: d.printing, text: 'cards being printed - ready to ship', icon: 'fa-box', tone: '#c084fc', cta: 'Mark shipped' },
    { n: d.toDeliver, text: 'shipped cards - mark completed once delivered', icon: 'fa-truck', tone: '#4da3ff', cta: 'Mark completed' },
    { n: d.noQr, text: 'clients without a GCash/Maya QR uploaded', icon: 'fa-qrcode', tone: '#A1A1A1', cta: 'Open profiles', href: '/admin#profiles' },
    { n: d.noEmail, text: 'clients without an email (cannot send their link)', icon: 'fa-envelope', tone: '#A1A1A1', cta: 'Open profiles', href: '/admin#profiles' },
  ].filter((t) => t.n > 0)

  const badge = (cls: string, text: string, style?: CSSProperties) => <span className={`ac-badge ${cls} !cursor-default`} style={style}>{text}</span>
  const demoCount = d.demo.length
  const demoWord = `${demoCount} demo account${demoCount === 1 ? '' : 's'}`
  const demoNames = d.demo.map((p) => p.username).join(', ')
  const hasRevenue = d.months.some((m) => m.revenue > 0)

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="ac-title text-2xl md:text-[28px] font-bold">Overview</h1>
            <p className="text-[12px] text-[#A1A1A1] mt-1">Revenue, what needs doing today, and your latest orders at a glance</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="ac-pill">Orders &amp; Sales</Link>
            <button onClick={load} className="ac-pill">{loading ? 'Refreshing...' : 'Refresh'}</button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3" role="alert">Could not load profiles: {error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Sales Revenue', value: money(d.revenue), sub: d.real.length === 0 ? `No real sales yet - ${demoWord} excluded` : `Average order ${money(d.avgOrder)}${demoCount ? ` - ${demoCount} demo excluded` : ''}`, icon: 'fa-wallet', tone: '#D4AF37' },
            { label: 'This Month', value: money(d.monthRevenue), sub: `${d.monthOrders} paid order${d.monthOrders === 1 ? '' : 's'} this month - demos excluded`, icon: 'fa-calendar-check', tone: '#00D632' },
            { label: 'Cards To Print', value: String(d.toPrint), sub: `${d.printing} printing now${d.demoToPrint ? ` - ${d.demoToPrint} demo card${d.demoToPrint === 1 ? '' : 's'} not counted` : ''}`, icon: 'fa-print', tone: '#FFC21C' },
            { label: 'Awaiting Payment', value: String(d.awaitingPay), sub: d.failedPay ? `${d.failedPay} failed` : 'No failed payments', icon: 'fa-hourglass-half', tone: '#007DFE' },
          ].map((c) => (
            <div key={c.label} className="ac-stat">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[1.5px] text-[#A1A1A1] font-bold">{c.label}</p>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] shrink-0" style={{ background: `${c.tone}1F`, color: c.tone }}><i className={`fa-solid ${c.icon}`} aria-hidden="true" /></span>
              </div>
              <p className="ac-title text-[28px] font-bold text-white mt-2 leading-none">{c.value}</p>
              <p className="text-[11px] text-[#A1A1A1] mt-2">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          {/* needs attention */}
          <section className="xl:col-span-2 bg-[#121214] border border-[#1E1E1E] rounded-2xl p-5">
            <h2 className="ac-title text-lg font-bold">Needs your attention</h2>
            <p className="text-[11px] text-[#A1A1A1] mt-0.5 mb-4">Your to-do list, built from the current orders</p>
            {todo.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#2A2A2A] p-6 text-center text-sm text-[#A1A1A1]"><i className="fa-solid fa-circle-check text-[#00D632] mr-2" aria-hidden="true" />All caught up - nothing waiting.</p>
            ) : (
              <ul className="space-y-2">
                {todo.map((t) => (
                  <li key={t.text} className="flex items-center gap-3 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] px-3 py-2.5">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] shrink-0" style={{ background: `${t.tone}1F`, color: t.tone }}><i className={`fa-solid ${t.icon}`} aria-hidden="true" /></span>
                    <p className="text-[13px] flex-1"><b className="text-white">{t.n}</b> <span className="text-[#A1A1A1]">{t.text}</span></p>
                    <Link href={t.href || '/admin'} className="ac-mini ac-mini-gold !inline-flex items-center">{t.cta} →</Link>
                  </li>
                ))}
              </ul>
            )}
            {demoCount > 0 && (
              <p className="text-[11px] text-[#A1A1A1] mt-3">
                <span className="demo-badge text-[9px] font-bold px-1.5 py-0.5 rounded-full mr-2 align-middle" style={DEMO_BADGE_STYLE}>DEMO</span>
                {demoWord} ({demoNames}) excluded from this list{d.demoToPrint ? ` - ${d.demoToPrint} demo card${d.demoToPrint === 1 ? '' : 's'} pending, not counted as real` : ''}.
              </p>
            )}
          </section>

          {/* fulfillment pipeline + reviews */}
          <section className="bg-[#121214] border border-[#1E1E1E] rounded-2xl p-5">
            <h2 className="ac-title text-lg font-bold">Fulfillment pipeline</h2>
            <p className="text-[11px] text-[#A1A1A1] mt-0.5 mb-4">{d.real.length} active real orders</p>
            <div className="space-y-3">
              {FUL.map((f) => (
                <div key={f}>
                  <div className="flex justify-between text-[11px] mb-1"><span className="uppercase tracking-[1.2px] text-[#A1A1A1] font-bold">{f}</span><b>{d.byFul[f]}</b></div>
                  <div className="h-2 rounded-full bg-[#1E1E20] overflow-hidden"><div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${d.real.length ? (d.byFul[f] / d.real.length) * 100 : 0}%` }} /></div>
                </div>
              ))}
            </div>
            {demoCount > 0 && <p className="text-[10px] text-[#6B7280] mt-3">{demoCount} demo order{demoCount === 1 ? '' : 's'} hidden from pipeline</p>}
            <div className="mt-5 pt-4 border-t border-[#1E1E1E] flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[1.5px] text-[#A1A1A1] font-bold">Reviews</p>
                <p className="ac-title text-xl font-bold mt-0.5">{reviews.length ? reviewAvg : '-'} <span className="text-[#D4AF37] text-base">★</span> <span className="text-[11px] text-[#A1A1A1] font-normal">({reviews.length})</span></p>
              </div>
              <a href="/reviews" target="_blank" rel="noopener noreferrer" className="ac-mini ac-mini-gold !inline-flex items-center">View page →</a>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* revenue chart */}
          <section className="bg-[#121214] border border-[#1E1E1E] rounded-2xl p-5">
            <h2 className="ac-title text-lg font-bold">Revenue - last 6 months</h2>
            <p className="text-[11px] text-[#A1A1A1] mt-0.5 mb-4">Paid real orders (demos excluded), by the month the client signed up</p>
            <div className="flex items-end gap-3 h-40" role="img" aria-label="Revenue by month">
              {d.months.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${m.label}: ${money(m.revenue)} (${m.orders} orders)`}>
                  <span className="text-[9px] text-[#A1A1A1]">{m.revenue ? '₱' + m.revenue.toLocaleString('en-PH') : ''}</span>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-[#D4AF37]/40 to-[#FFC21C]" style={{ height: `${Math.max(m.revenue ? 6 : 2, (m.revenue / maxRev) * 100)}%`, opacity: m.revenue ? 1 : 0.25 }} />
                  <span className="text-[10px] uppercase tracking-[1px] text-[#A1A1A1]">{m.label}</span>
                </div>
              ))}
            </div>
            {!hasRevenue && <p className="text-[11px] text-[#A1A1A1] text-center mt-3">No real revenue yet</p>}
          </section>

          {/* recent orders */}
          <section className="xl:col-span-2 bg-[#121214] border border-[#1E1E1E] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="ac-title text-lg font-bold">Recent orders</h2>
                <p className="text-[11px] text-[#A1A1A1] mt-0.5">Your 5 newest clients - demo accounts are tagged and not counted in sales</p>
              </div>
              <Link href="/admin" className="ac-mini ac-mini-gold !inline-flex items-center">All orders →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table ac-orders">
                <thead><tr><th scope="col">Order #</th><th scope="col">Customer</th><th scope="col">Amount</th><th scope="col">Payment</th><th scope="col">Fulfillment</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center text-gray-500 !py-8">Loading...</td></tr>
                  ) : d.real.length === 0 ? (
                    <tr><td colSpan={5} className="text-center !py-8"><p className="text-white font-bold">No real orders yet</p><p className="text-[11px] text-[#A1A1A1] mt-1">{d.demo.length} demo accounts ({d.demo.map((p:any)=>p.username).join(', ')}) excluded from sales - Real revenue ₱0.00</p></td></tr>
                  ) : d.recent.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-gray-500 !py-8">No orders yet.</td></tr>
                  ) : d.recent.map((p) => (
                    <tr key={p.username} className="ac-row">
                      <td><p className="font-bold text-[#D4AF37] text-[12px] whitespace-nowrap">{orderNo(p)}{isDemoAccount(p) && <span className="demo-badge ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full align-middle" style={DEMO_BADGE_STYLE}>DEMO</span>}</p><p className="text-[10px] text-[#A1A1A1]">{dateText(p.created_at)}</p></td>
                      <td><p className="font-bold">{nameOf(p)}</p><Link href={`/${p.username}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#D4AF37] hover:underline">/{p.username} →</Link></td>
                      <td className={`font-bold whitespace-nowrap ${isDemoAccount(p) ? 'text-[#A1A1A1]' : ''}`}>{money(priceOf(p))}</td>
                      <td>
                        {isDemoAccount(p)
                          ? <>{badge(`ac-pay-${payOf(p)}`, `DEMO (${payOf(p).toUpperCase()})`, DEMO_PAY_STYLE)}<p className="text-[10px] text-[#A1A1A1] mt-1 whitespace-nowrap">Demo - not counted in sales</p></>
                          : badge(`ac-pay-${payOf(p)}`, payOf(p).toUpperCase())}
                      </td>
                      <td>{badge(`ac-ful-${fulOf(p)}`, fulOf(p).toUpperCase())}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          <Link href="/dashboard" className="h-11 px-5 inline-flex items-center rounded-xl bg-[#FFC21C] text-black font-bold text-sm shadow-[0_8px_28px_rgba(255,194,28,0.35)] hover:brightness-105"><i className="fa-solid fa-plus mr-2" aria-hidden="true" />New client profile</Link>
          <Link href="/admin#profiles" className="ac-pill !h-11 !px-5 !rounded-xl">Business Profiles</Link>
        </div>
      </div>
    </div>
  )
}