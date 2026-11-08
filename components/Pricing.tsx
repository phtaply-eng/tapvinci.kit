'use client'

import { useRouter } from 'next/navigation'

// Flip to true once the student checkout (/student-card) is live (Phase 4B).
const SHOW_STUDENT = false
// Founders Club lifetime for students? Set to false if not.
const STUDENT_LIFETIME = true

type PlanFeature = { key: string; desc?: string }

const DIGITAL_FEATURES: PlanFeature[] = [
  { key: 'Profile', desc: 'tapvinci.vercel.app/username' },
  { key: 'All 6 themes', desc: 'Black Gold, Midnight Purple, Ocean Blue, Forest Green, Sunset Pink, Sunrise Orange' },
  { key: 'Social links', desc: 'unlimited' },
  { key: 'Gallery, Contact', desc: '+ Google Maps' },
  { key: 'GCash / Maya QR', desc: 'accept payments instantly' },
  { key: 'QR code', desc: 'to print or share' },
  { key: 'Self-service edit', desc: 'anytime' },
  { key: 'Live Preview', desc: 'see changes before saving' },
]

const CARD_FEATURES: PlanFeature[] = [
  { key: 'Profile — tapvinci.vercel.app/username' },
  { key: 'Lifetime profile', desc: 'Founders Club, no renewal' },
  { key: 'Premium NFC card', desc: 'Black or White + QR on the back' },
  { key: 'All 6 themes', desc: 'Black Gold, Midnight Purple, Ocean Blue, Forest Green, Sunset Pink, Sunrise Orange' },
  { key: 'Social links', desc: 'unlimited' },
  { key: 'Gallery, Contact', desc: '+ Google Maps' },
  { key: 'GCash / Maya QR', desc: 'accept payments instantly' },
  { key: 'QR code', desc: 'to print or share' },
  { key: 'Self-service edit', desc: 'anytime' },
  { key: 'Live Preview', desc: 'see changes before saving' },
  { key: 'Tap + Scan', desc: 'works on all phones' },
  { key: 'No app needed', desc: 'nothing to install' },
  { key: 'Ships anywhere PH', desc: 'Lalamove / J&T / LBC (calculated at checkout)' },
  { key: 'Instant activation', desc: 'tap-ready in minutes' },
]

const STUDENT_FEATURES: PlanFeature[] = [
  { key: 'NFC card', desc: 'tap on any phone, no app needed' },
  { key: 'Claim by tap', desc: 'sign in with Google or email, then enter the code in your pouch' },
  { key: 'Profile', desc: 'tapvinci.vercel.app/username' },
  { key: 'Education', desc: 'school, year level and course' },
  { key: 'Profile song', desc: 'Spotify player right on your card' },
  { key: 'Tap count + streak', desc: 'see your taps and keep your streak' },
  { key: 'All 6 themes', desc: 'Black Gold, Midnight Purple, Ocean Blue, Forest Green, Sunset Pink, Sunrise Orange' },
  { key: 'Social links, Gallery, Contact', desc: '+ Google Maps' },
  { key: 'GCash / Maya QR', desc: 'accept payments instantly' },
  { key: 'Self-service edit', desc: 'anytime, with Live Preview' },
  { key: 'Ships anywhere PH', desc: 'Lalamove / J&T / LBC (calculated at checkout)' },
]

type ComparisonRow = { name: string; digital: boolean; pro: boolean; student: boolean }

const COMPARISON: ComparisonRow[] = [
  { name: 'Profile on tapvinci.vercel.app/username', digital: true, pro: true, student: true },
  { name: 'All 6 themes', digital: true, pro: true, student: true },
  { name: 'Social links — unlimited', digital: true, pro: true, student: true },
  { name: 'Gallery, Contact + Google Maps', digital: true, pro: true, student: true },
  { name: 'GCash / Maya QR', digital: true, pro: true, student: true },
  { name: 'QR code to print', digital: true, pro: true, student: false },
  { name: 'Self-edit anytime + Live Preview', digital: true, pro: true, student: true },
  { name: 'NFC card', digital: false, pro: true, student: true },
  { name: 'School, year level and course', digital: false, pro: false, student: true },
  { name: 'Spotify profile song', digital: false, pro: false, student: true },
  { name: 'Tap count + streak', digital: false, pro: false, student: true },
  { name: 'Lifetime profile — Founders Club, no renewal', digital: true, pro: true, student: STUDENT_LIFETIME },
  { name: 'Tap + Scan — all phones', digital: false, pro: true, student: true },
  { name: 'No app needed', digital: true, pro: true, student: true },
  { name: 'Ships anywhere PH', digital: false, pro: true, student: true },
]

function FeatureList({ features }: { features: PlanFeature[] }) {
  return (
    <ul className="flex flex-1 flex-col gap-y-3.5">
      {features.map((feature) => (
        <li key={feature.key} className="flex items-start gap-3">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#D4AF37]" aria-hidden="true" />
          <p className="text-[13px] leading-6 text-white/45">
            <span className="font-semibold text-white">{feature.key}</span>
            {feature.desc ? ` — ${feature.desc}` : ''}
          </p>
        </li>
      ))}
    </ul>
  )
}

function Check({ on, tone }: { on: boolean; tone: 'muted' | 'gold' }) {
  if (!on) {
    return (
      <span className="text-[13px] leading-none text-white/20" aria-label="Not included">
        —
      </span>
    )
  }

  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
        tone === 'gold' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-white/[0.04] text-white/35'
      }`}
      aria-label="Included"
    >
      ✓
    </span>
  )
}

type CtaStyle = 'outline' | 'gold-outline' | 'solid'

const CTA_CLASS: Record<CtaStyle, string> = {
  outline:
    'border border-white/20 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-white/5',
  'gold-outline':
    'border border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]',
  solid:
    'bg-[#D4AF37] text-black shadow-[0_8px_32px_rgba(212,175,55,0.4)] hover:bg-[#FFC21C] hover:shadow-[0_0_20px_rgba(212,175,55,0.3),0_12px_40px_rgba(212,175,55,0.55)]',
}

function PlanCard({
  featured = false,
  badge,
  title,
  kicker,
  price,
  priceNote,
  intro,
  features,
  cta,
  ctaStyle,
  onSelect,
  footnote,
}: {
  featured?: boolean
  badge?: string
  title: string
  kicker: string
  price: string
  priceNote: string[]
  intro?: string
  features: PlanFeature[]
  cta: string
  ctaStyle: CtaStyle
  onSelect: () => void
  footnote: string
}) {
  const shell = featured
    ? 'card-glow border-[#D4AF37]/40 bg-[#131313] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_60px_rgba(212,175,55,0.18),0_0_100px_rgba(212,175,55,0.08),inset_0_1px_0_rgba(212,175,55,0.1)] hover:border-[#D4AF37]/60 hover:shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_80px_rgba(212,175,55,0.28),0_0_140px_rgba(212,175,55,0.12),inset_0_1px_0_rgba(212,175,55,0.18)]'
    : 'border-[#1E1E1E] bg-[#121212] shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:border-white/20'

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      {featured && (
        <div
          className="pointer-events-none absolute -inset-[1px] rounded-[28px] bg-gradient-to-b from-[#D4AF37]/20 to-transparent blur-[1px]"
          aria-hidden="true"
        />
      )}

      <article
        className={`pricing-card-tall relative flex min-h-[720px] w-full max-w-[380px] flex-col justify-between rounded-[28px] border p-10 pb-10 pt-12 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 ${shell}`}
      >
        {badge && (
          <span className="absolute -top-3 right-6 rounded-full bg-[#D4AF37] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black shadow-[0_8px_24px_rgba(212,175,55,0.45)]">
            {badge}
          </span>
        )}

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="pv-serif text-[22px] font-semibold leading-tight text-white">{title}</h3>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#D4AF37]">{kicker}</p>
            </div>
            <span
              className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#2A2A2C]"
              aria-hidden="true"
            >
              <span
                className={
                  featured
                    ? 'h-1.5 w-1.5 animate-pulse rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.9)]'
                    : 'h-1.5 w-1.5 rounded-full bg-white/25'
                }
              />
            </span>
          </div>

          <div className="mt-8 flex items-end justify-between gap-4">
            <span className="pv-serif text-[42px] font-bold leading-none text-white">{price}</span>
            <span className="pb-1 text-right text-[11px] font-normal leading-[1.4] text-white/40">
              {priceNote.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </span>
          </div>

          <div
            className={`my-6 h-px w-full bg-gradient-to-r ${
              featured
                ? 'from-[#D4AF37]/40 via-[#D4AF37]/15 to-transparent'
                : 'from-[#D4AF37]/10 via-[#222] to-[#222]'
            }`}
            aria-hidden="true"
          />

          {intro && (
            <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/60">{intro}</p>
          )}

          <FeatureList features={features} />
        </div>

        <div className="mt-auto pt-8">
          <button
            onClick={onSelect}
            className={`block w-full cursor-pointer rounded-full py-4 text-center text-[12px] font-bold uppercase tracking-[0.15em] transition-all ${CTA_CLASS[ctaStyle]}`}
          >
            {cta}
          </button>
          <p className="mt-3 text-center text-[10px] font-normal text-white/30">{footnote}</p>
        </div>
      </article>
    </div>
  )
}

export default function Pricing({ contactEmail = 'tapvinci@yahoo.com' }: { contactEmail?: string }) {
  const router = useRouter()

  // Professional flow: unchanged (goes through the dashboard + PaymentModal)
  const handleSelect = (pkg: 'digital_only' | 'card_digital', price: '399' | '799') => {
    try {
      localStorage.setItem('selected_package', pkg)
      localStorage.setItem('selected_price', price)
    } catch {}
    router.push(`/dashboard?package=${pkg}&price=${price}&new=true`)
  }

  // Student flow: its own checkout page (built in Phase 4B)
  const handleStudent = () => router.push('/student-card')

  const digitalCard = (
    <PlanCard
      key="digital"
      title="Digital Only"
      kicker="Starter Profile · Professionals"
      price="₱399"
      priceNote={['one-time • Founders', 'Lifetime', '#200/200 left']}
      features={DIGITAL_FEATURES}
      cta="Start with Digital"
      ctaStyle="outline"
      onSelect={() => handleSelect('digital_only', '399')}
      footnote="Instant activation"
    />
  )

  const proCard = (
    <PlanCard
      key="pro"
      featured
      badge="Best Seller"
      title="Card + Digital"
      kicker="Professional · Complete Studio"
      price="₱799"
      priceNote={['one-time • Founders', 'Lifetime', '#200/200 left']}
      intro="Everything in Digital Only, plus"
      features={CARD_FEATURES}
      cta="Get Card + Digital"
      ctaStyle="solid"
      onSelect={() => handleSelect('card_digital', '799')}
      footnote="Ships within 2–3 days"
    />
  )

  const studentCard = (
    <PlanCard
      key="student"
      title="Student Card + Digital"
      kicker="For students"
      price="₱499"
      priceNote={['one-time', 'card + profile', STUDENT_LIFETIME ? 'Founders Lifetime' : 'student price']}
      features={STUDENT_FEATURES}
      cta="Get my Student Card"
      ctaStyle="gold-outline"
      onSelect={handleStudent}
      footnote="Ships within 2–3 days"
    />
  )

  const plans = SHOW_STUDENT ? [studentCard, proCard, digitalCard] : [digitalCard, proCard]

  const columns = [
    { key: 'digital' as const, label: 'Digital Only', tone: 'muted' as const },
    { key: 'pro' as const, label: 'Card + Digital', tone: 'gold' as const },
    ...(SHOW_STUDENT ? [{ key: 'student' as const, label: 'Student Card', tone: 'gold' as const }] : []),
  ]
  const rows = SHOW_STUDENT
    ? COMPARISON
    : COMPARISON.filter((r) => !(r.student && !r.digital && !r.pro)) // hide student-only rows until launch
  const gridCols = { gridTemplateColumns: `1.5fr repeat(${columns.length}, 1fr)` }

  return (
    <section id="pricing" className="pv-mont bg-[#050505] px-6 py-24">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-5 bg-[#D4AF37]/30" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-[3px] text-[#D4AF37]">Pricing</span>
          <span className="h-px w-5 bg-[#D4AF37]/30" aria-hidden="true" />
        </div>

        <h2 className="pv-serif mt-6 text-[36px] font-normal leading-tight text-[#F5F1E8] md:text-[48px]">
          Simple, premium,
          <br />
          <span className="pv-serif-italic">no monthly.</span>
        </h2>

        <p className="mt-5 text-[14px] font-normal leading-[1.7] text-[#F5F1E8]/60">
          ✦ FOUNDERS CLUB — Lifetime for first 200 customers
        </p>
      </div>

      {/* Cards */}
      <div
        className={`mx-auto mt-16 grid justify-center gap-8 md:grid-cols-2 ${
          SHOW_STUDENT ? 'max-w-[1240px] lg:grid-cols-3' : 'max-w-[900px]'
        }`}
      >
        {plans}
      </div>

      {/* Comparison table */}
      <div
        className={`comparison-table mx-auto mt-24 overflow-hidden rounded-[24px] border border-[#1E1E1E] bg-[#121212]/50 backdrop-blur ${
          SHOW_STUDENT ? 'max-w-[1000px]' : 'max-w-[900px]'
        }`}
      >
        <div className="overflow-x-auto">
          <div className={SHOW_STUDENT ? 'min-w-[680px]' : 'min-w-[560px]'}>
            {/* Header row */}
            <div className="grid items-center gap-4 border-b border-[#1E1E1E] bg-[#0F0F0F] px-6 py-6" style={gridCols}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">Feature</span>
              {columns.map((c) => (
                <span
                  key={c.key}
                  className={`text-center text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    c.tone === 'gold' ? 'text-[#D4AF37]' : 'text-white/40'
                  }`}
                >
                  {c.label}
                </span>
              ))}
            </div>

            {/* Feature rows */}
            {rows.map((row, index) => (
              <div
                key={row.name}
                className={`grid items-center gap-4 px-6 py-4 transition-colors hover:bg-[#151515] ${
                  index !== rows.length - 1 ? 'border-b border-[#1A1A1A]' : ''
                }`}
                style={gridCols}
              >
                <div className="flex items-center gap-3">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#D4AF37]/70" aria-hidden="true" />
                  <span className="text-[13px] leading-6 text-white/55">{row.name}</span>
                </div>
                {columns.map((c) => (
                  <div key={c.key} className="flex justify-center">
                    <Check on={row[c.key]} tone={c.tone} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Founders note */}
      <div className="mx-auto mt-8 flex max-w-[900px] flex-col gap-4 rounded-[12px] border border-white/5 bg-[#121212]/60 px-6 py-4 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-2 text-[9px] font-semibold uppercase tracking-[1px] text-white/40">
          <span className="h-1 w-1 rounded-full bg-[#D4AF37]/60" aria-hidden="true" />
        </div>
        <p className="text-[11px] font-normal leading-relaxed text-white/50">
          <span className="font-semibold text-white">Founders Club</span>. Lifetime access for the first 200 customers. One payment, your profile stays live forever. No renewal, ever. Your data stays yours.
        </p>
      </div>
    </section>
  )
}