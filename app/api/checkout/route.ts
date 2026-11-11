import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_SKUS = ['digital_only', 'card_digital']
const BUCKET = 'payment-proofs'
const MAX_BYTES = 4 * 1024 * 1024 // Vercel rejects bodies over ~4.5 MB

const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status })

function clean(v: FormDataEntryValue | null, max: number) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : ''
}

// Check the real file bytes, not the file name or declared type
function sniff(b: Uint8Array): 'jpg' | 'png' | 'pdf' | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png'
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'pdf'
  return null
}
const CONTENT_TYPE = { jpg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' } as const

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail('Invalid request.')
  }

  // Honeypot: real users never fill this hidden field
  if (clean(form.get('website'), 100)) return NextResponse.json({ ok: true })

  const sku = clean(form.get('sku'), 40)
  if (!ALLOWED_SKUS.includes(sku)) return fail('This product is not available for online checkout.')
  const needsShipping = sku === 'card_digital'

  const buyer_name = clean(form.get('buyer_name'), 80)
  const buyer_email = clean(form.get('buyer_email'), 120).toLowerCase()
  const phoneRaw = clean(form.get('buyer_phone'), 30).replace(/[\s()-]/g, '')
  const ship_name = clean(form.get('ship_name'), 80) || buyer_name
  const ship_address = clean(form.get('ship_address'), 200)
  const ship_city = clean(form.get('ship_city'), 80)
  const ship_province = clean(form.get('ship_province'), 80)
  const ship_zip = clean(form.get('ship_zip'), 10)
  const method = clean(form.get('payment_method'), 10)
  const payment_ref = clean(form.get('payment_ref'), 40)
  const receipt = form.get('receipt')

  if (buyer_name.length < 2) return fail('Enter your full name.')
  if (!/^\S+@\S+\.\S+$/.test(buyer_email)) return fail('Enter a valid email address.')
  if (!/^(\+?63|0)9\d{9}$/.test(phoneRaw)) return fail('Enter a valid PH mobile number (09XX XXX XXXX).')
  if (needsShipping) {
    if (ship_address.length < 8) return fail('Enter your complete delivery address.')
    if (ship_city.length < 2) return fail('Enter your city.')
    if (ship_province.length < 2) return fail('Enter your province.')
    if (!/^\d{4}$/.test(ship_zip)) return fail('Enter a 4-digit ZIP code.')
  }
  if (!['gcash', 'maya'].includes(method)) return fail('Choose GCash or Maya.')
  if (!/^[A-Za-z0-9 -]{6,40}$/.test(payment_ref)) return fail('Enter the reference number from your payment receipt.')
  if (!receipt || typeof receipt === 'string') return fail('Upload your payment receipt.')

  const bytes = new Uint8Array(await receipt.arrayBuffer())
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return fail('Receipt must be under 4 MB.')
  const kind = sniff(bytes)
  if (!kind) return fail('Receipt must be a JPG, PNG or PDF.')

  const buyer_phone = '+63' + phoneRaw.slice(-10)

  try {
    const db = createSupabaseAdmin()

    // Price always comes from the database, never from the browser
    const { data: product } = await db
      .from('products')
      .select('sku, price_php, includes_card, active')
      .eq('sku', sku)
      .maybeSingle()
    if (!product || !product.active) {
      return fail('This product is not available right now.')
    }
    if (needsShipping && !product.includes_card) {
      return fail('This product does not include a physical card.')
    }

    // Light abuse guard: max 3 orders per email per hour
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_email', buyer_email)
      .gte('created_at', since)
    if ((count ?? 0) >= 3) return fail('Too many orders from this email. Please try again later.', 429)

    const { data: order, error: insErr } = await db
      .from('orders')
      .insert({
        sku,
        amount_php: product.price_php,
        buyer_name,
        buyer_email,
        buyer_phone,
        ship_name,
        ship_address,
        ship_city,
        ship_province,
        ship_zip,
        payment_method: method,
        payment_ref,
      })
      .select('id, order_no, amount_php')
      .single()

    if (insErr || !order) {
      if (insErr?.code === '23505') {
        return fail('That payment reference number was already used. Check it, or contact us.', 409)
      }
      console.error('[checkout] insert failed:', insErr)
      return fail('Could not save your order. Please try again.', 500)
    }

    const path = `orders/${order.id}/receipt-${Date.now()}.${kind}`
    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: CONTENT_TYPE[kind], upsert: false })
    if (upErr) {
      console.error('[checkout] receipt upload failed:', upErr)
      await db.from('orders').delete().eq('id', order.id) // don't keep an order without proof
      return fail('Receipt upload failed. Please try again.', 500)
    }

    const receipt_url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    await db.from('orders').update({ receipt_url }).eq('id', order.id)

    return NextResponse.json({
      ok: true,
      orderNo: 'TV-' + String(order.order_no).padStart(6, '0'),
      amount: order.amount_php,
    })
  } catch (err) {
    console.error('[checkout] unexpected error:', err)
    return fail('Something went wrong. Please try again.', 500)
  }
}