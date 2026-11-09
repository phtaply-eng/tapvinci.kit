'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif"
const PRICE = 499

// EDIT: what buyers are told about the delivery fee
const SHIPPING_NOTE =
  'The ₱499 covers your card and profile. Shipping (Lalamove / J&T / LBC) depends on your address. We will message you the fee before we ship.'

type Method = 'gcash' | 'maya'

// Same accounts as components/PaymentModal.tsx. Keep them in sync.
const ACCOUNTS: Record<Method, { label: string; name: string; number: string; qr: string }> = {
  gcash: { label: 'GCash', name: 'JO***A RA***N V.', number: '+63 908 327 4971', qr: '/gallery/gcash-qr.jpg' },
  maya: { label: 'Maya', name: 'J****A R****N V.', number: '+63 908 327 4971', qr: '/gallery/maya-qr.jpg' },
}

const inputCls =
  'w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#D4AF37]'
const labelCls = 'mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]'

// Shrink phone screenshots so the upload stays under Vercel's request size limit
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.82))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export default function StudentCardCheckout() {
  const [f, setF] = useState({
    buyer_name: '', buyer_email: '', buyer_phone: '',
    ship_address: '', ship_city: '', ship_province: '', ship_zip: '',
    payment_ref: '', website: '', // website = hidden honeypot
  })
  const [method, setMethod] = useState<Method>('gcash')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ orderNo: string } | null>(null)
  const [copied, setCopied] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value })

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch {}
  }

  async function pickFile(list: FileList | null) {
    const picked = list?.[0]
    if (!picked) return
    setError(null)
    if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(picked.type)) {
      return setError('Receipt must be a JPG, PNG or PDF.')
    }
    if (picked.type === 'application/pdf' && picked.size > 3.5 * 1024 * 1024) {
      return setError('PDF is too large (max 3.5 MB). Upload a screenshot instead.')
    }
    // FIX: check real file bytes, not just the name or declared type.
    // A text file renamed to .jpg still has text bytes, not JPG bytes.
    // Without this, the client shows a checkmark for a fake file and only the server rejects it,
    // with a confusing message if the dev server is running old code.
    try {
      const head = new Uint8Array(await picked.slice(0, 4).arrayBuffer())
      const isJpg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
      const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47
      const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46
      if (!isJpg && !isPng && !isPdf) {
        return setError('Receipt must be a JPG, PNG or PDF.')
      }
    } catch {
      return setError('Receipt must be a JPG, PNG or PDF.')
    }
    const ready = await shrinkImage(picked)
    if (ready.size > 4 * 1024 * 1024) return setError('Receipt must be under 4 MB.')
    setFile(ready)
  }

  function validate(): string | null {
    if (f.buyer_name.trim().length < 2) return 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(f.buyer_email.trim())) return 'Enter a valid email address.'
    if (!/^(\+?63|0)9\d{9}$/.test(f.buyer_phone.replace(/[\s()-]/g, ''))) return 'Enter a valid PH mobile number.'
    if (f.ship_address.trim().length < 8) return 'Enter your complete delivery address.'
    if (f.ship_city.trim().length < 2) return 'Enter your city.'
    if (f.ship_province.trim().length < 2) return 'Enter your province.'
    if (!/^\d{4}$/.test(f.ship_zip.trim())) return 'Enter a 4-digit ZIP code.'
    if (!/^[A-Za-z0-9 -]{6,40}$/.test(f.payment_ref.trim())) return 'Enter the reference number from your receipt.'
    if (!file) return 'Upload your payment receipt.'
    return null
  }

  async function submit() {
    const problem = validate()
    if (problem) return setError(problem)
    setBusy(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('sku', 'student_card')
      Object.entries(f).forEach(([k, v]) => fd.append(k, v))
      fd.append('payment_method', method)
      fd.append('receipt', file as File)
      const res = await fetch('/api/checkout', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Something went wrong. Please try again.')
      setDone({ orderNo: data.orderNo ?? '' })
      window.scrollTo({ top: 0 })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const acct = ACCOUNTS[method]
  const shell = 'mx-auto w-full max-w-[460px]'
  const card = 'rounded-2xl border border-white/10 bg-[#111] p-5'

  // ---------- Confirmation ----------
  if (done) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-4 py-10">
        <div className={`${shell} rounded-[28px] border border-white/10 bg-[#111] p-7 text-center shadow-[0_0_80px_rgba(212,175,55,0.12)]`}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-2xl text-[#D4AF37]">✓</div>
          <h1 className="text-2xl text-white" style={{ fontFamily: SERIF }}>Order received</h1>
          {done.orderNo && (
            <p className="mt-3 text-sm text-zinc-400">
              Your order number is <span className="font-bold text-[#D4AF37]">{done.orderNo}</span>. Screenshot this.
            </p>
          )}
          <ol className="mt-6 space-y-3 text-left text-sm text-zinc-300">
            <li className="flex gap-3"><span className="font-bold text-[#D4AF37]">1</span> We check your payment first, then prepare and ship your card.</li>
            <li className="flex gap-3"><span className="font-bold text-[#D4AF37]">2</span> We will message you the shipping fee before it goes out.</li>
            <li className="flex gap-3"><span className="font-bold text-[#D4AF37]">3</span> When it arrives, tap the card on your phone, sign in, and enter the code from the pouch.</li>
          </ol>
          <p className="mt-5 text-xs text-zinc-500">Questions? Message us and mention your order number.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-[#D4AF37] px-6 py-3 text-xs font-bold uppercase tracking-widest text-black">
            Back to home
          </Link>
        </div>
      </main>
    )
  }

  // ---------- Checkout ----------
  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-10">
      <div className={shell}>
        <div className="mb-6 text-center">
          <Image src="/tapvinci-logo.png" alt="TapVinci" width={56} height={56} className="mx-auto mb-4 h-14 w-14 object-contain" />
          <h1 className="text-[28px] leading-tight text-white" style={{ fontFamily: SERIF }}>Student Card + Digital</h1>
          <p className="mt-2 text-sm text-zinc-400">
            <span className="font-bold text-[#D4AF37]">₱{PRICE}</span> one-time · NFC card + your student profile
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Your details */}
          <section className={card}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">1 · Your details</p>
            <div className="space-y-3">
              <div><label className={labelCls}>Full name</label>
                <input className={inputCls} value={f.buyer_name} onChange={set('buyer_name')} autoComplete="name" placeholder="Juan Dela Cruz" /></div>
              <div><label className={labelCls}>Email</label>
                <input className={inputCls} type="email" inputMode="email" value={f.buyer_email} onChange={set('buyer_email')} autoComplete="email" placeholder="you@email.com" /></div>
              <div><label className={labelCls}>Mobile number</label>
                <input className={inputCls} type="tel" inputMode="tel" value={f.buyer_phone} onChange={set('buyer_phone')} autoComplete="tel" placeholder="0917 123 4567" /></div>
            </div>
          </section>

          {/* 2. Delivery */}
          <section className={card}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">2 · Delivery address</p>
            <div className="space-y-3">
              <div><label className={labelCls}>House no., street, barangay</label>
                <input className={inputCls} value={f.ship_address} onChange={set('ship_address')} autoComplete="street-address" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>City</label>
                  <input className={inputCls} value={f.ship_city} onChange={set('ship_city')} autoComplete="address-level2" /></div>
                <div><label className={labelCls}>Province</label>
                  <input className={inputCls} value={f.ship_province} onChange={set('ship_province')} autoComplete="address-level1" /></div>
              </div>
              <div><label className={labelCls}>ZIP code</label>
                <input className={inputCls} inputMode="numeric" maxLength={4} value={f.ship_zip} onChange={set('ship_zip')} autoComplete="postal-code" placeholder="1100" /></div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">{SHIPPING_NOTE}</p>
          </section>

          {/* 3. Payment */}
          <section className={card}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">3 · Pay ₱{PRICE}</p>
            <div className="grid grid-cols-2 gap-2">
              {(['gcash', 'maya'] as Method[]).map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                    method === m ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-white/15 text-zinc-300'
                  }`}>{ACCOUNTS[m].label}</button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={acct.qr} alt={`${acct.label} QR`} className="mx-auto h-44 w-44 rounded-lg bg-white object-contain p-1.5" />
              <p className="mt-3 text-xs text-zinc-400">{acct.name}</p>
              <button type="button" onClick={() => copy(acct.number, 'num')}
                className="mt-1 text-sm font-semibold text-white underline underline-offset-4">
                {copied === 'num' ? 'Copied ✓' : acct.number}
              </button>
              <p className="mt-2 text-[11px] text-zinc-500">Send exactly ₱{PRICE}, then enter the reference number below.</p>
            </div>

            <div className="mt-4 space-y-3">
              <div><label className={labelCls}>Reference number</label>
                <input className={inputCls} value={f.payment_ref} onChange={set('payment_ref')} placeholder="From your payment receipt" autoComplete="off" /></div>
              <div>
                <label className={labelCls}>Payment receipt</label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden"
                  onChange={(e) => pickFile(e.target.files)} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-4 text-sm text-zinc-300 transition hover:border-[#D4AF37]">
                  {file ? `✓ ${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)` : 'Tap to upload screenshot or PDF'}
                </button>
              </div>
            </div>

            {/* honeypot */}
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')}
              className="absolute left-[-9999px] h-0 w-0 opacity-0" name="website" />
          </section>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <button onClick={submit} disabled={busy}
            className="w-full rounded-full bg-[#D4AF37] py-4 text-sm font-bold uppercase tracking-[0.15em] text-black shadow-[0_8px_32px_rgba(212,175,55,0.4)] transition hover:bg-[#FFC21C] disabled:opacity-60">
            {busy ? 'Placing order…' : `Place order · ₱${PRICE}`}
          </button>
          <p className="pb-6 text-center text-[11px] text-zinc-600">
            We verify your payment before shipping. Your card works once you tap it and enter the code in the pouch.
          </p>
        </div>
      </div>
    </main>
  )
}