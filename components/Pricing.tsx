'use client'

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

type ComparisonRow = { name: string; digital: boolean; card: boolean }

const COMPARISON: ComparisonRow[] = [
  { name: 'Profile on tapvinci.vercel.app/username', digital: true, card: true },
  { name: 'All 6 themes', digital: true, card: true },
  { name: 'Social links — unlimited', digital: true, card: true },
  { name: 'Gallery, Contact + Google Maps', digital: true, card: true },
  { name: 'GCash / Maya QR', digital: true, card: true },
  { name: 'QR code to print', digital: true, card: true },
  { name: 'Self-edit anytime + Live Preview', digital: true, card: true },
  { name: 'Premium NFC card', digital: false, card: true },
  { name: 'Lifetime profile — Founders Club, no renewal', digital: true, card: true },
  { name: 'Tap + Scan — all phones', digital: false, card: true },
  { name: 'No app needed', digital: true, card: true },
  { name: 'Ships anywhere PH', digital: false, card: true },
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

export default function Pricing({ contactEmail = 'tapvinci@yahoo.com' }: { contactEmail?: string }) {
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
      <div className="mx-auto mt-16 grid max-w-[900px] justify-center gap-8 md:grid-cols-2">
        {/* Card 1 — Digital Only */}
        <div className="relative mx-auto w-full max-w-[380px]">
          <article className="pricing-card-tall relative flex min-h-[720px] w-full max-w-[380px] flex-col justify-between rounded-[28px] border border-[#1E1E1E] bg-[#121212] p-10 pb-10 pt-12 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-white/20">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="pv-serif text-[22px] font-semibold leading-tight text-white">Digital Only</h3>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
                    Starter Profile
                  </p>
                </div>
                <span
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#2A2A2C]"
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                </span>
              </div>

              <div className="mt-8 flex items-end justify-between gap-4">
                <span className="pv-serif text-[42px] font-bold leading-none text-white">₱399</span>
                <span className="pb-1 text-right text-[11px] font-normal leading-[1.4] text-white/40">
                  one-time • Founders <br/> Lifetime <br/> #200/200 left
                </span>
              </div>

              <div
                className="my-6 h-px w-full bg-gradient-to-r from-[#D4AF37]/10 via-[#222] to-[#222]"
                aria-hidden="true"
              />

              <FeatureList features={DIGITAL_FEATURES} />
            </div>

            <div className="mt-auto pt-8">
              <a
                href={`mailto:${contactEmail}?subject=TapVinci%20Digital%20Only%20%E2%80%94%20Starter%20Profile`}
                className="block w-full rounded-full border border-white/20 py-4 text-center text-[12px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:border-white/35 hover:bg-white/5"
              >
                Start with Digital
              </a>
              <p className="mt-3 text-center text-[10px] font-normal text-white/30">Instant activation</p>
            </div>
          </article>
        </div>

        {/* Card 2 — Card + Digital */}
        <div className="relative mx-auto w-full max-w-[380px]">
          <div
            className="pointer-events-none absolute -inset-[1px] rounded-[28px] bg-gradient-to-b from-[#D4AF37]/20 to-transparent blur-[1px]"
            aria-hidden="true"
          />

          <article className="card-glow pricing-card-tall relative flex min-h-[720px] w-full max-w-[380px] flex-col justify-between rounded-[28px] border border-[#D4AF37]/40 bg-[#131313] p-10 pb-10 pt-12 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_60px_rgba(212,175,55,0.18),0_0_100px_rgba(212,175,55,0.08),inset_0_1px_0_rgba(212,175,55,0.1)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-[#D4AF37]/60 hover:shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_80px_rgba(212,175,55,0.28),0_0_140px_rgba(212,175,55,0.12),inset_0_1px_0_rgba(212,175,55,0.18)]">
            <span className="absolute -top-3 right-6 rounded-full bg-[#D4AF37] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black shadow-[0_8px_24px_rgba(212,175,55,0.45)]">
              Best Seller
            </span>

            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="pv-serif text-[22px] font-semibold leading-tight text-white">Card + Digital</h3>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
                    Complete Studio
                  </p>
                </div>
                <span
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#2A2A2C]"
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.9)]" />
                </span>
              </div>

              <div className="mt-8 flex items-end justify-between gap-4">
                <span className="pv-serif text-[42px] font-bold leading-none text-white">₱899</span>
                <span className="pb-1 text-right text-[11px] font-normal leading-[1.4] text-white/40">
                 one-time • Founders <br/> Lifetime <br/> #200/200 left
                </span>
              </div>

              <div
                className="my-6 h-px w-full bg-gradient-to-r from-[#D4AF37]/40 via-[#D4AF37]/15 to-transparent"
                aria-hidden="true"
              />

              <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/60">
                Everything in Digital Only, plus
              </p>

              <FeatureList features={CARD_FEATURES} />
            </div>

            <div className="mt-auto pt-8">
              <a
                href={`mailto:${contactEmail}?subject=TapVinci%20Card%20%2B%20Digital%20%E2%80%94%20Complete%20Studio`}
                className="block w-full rounded-full bg-[#D4AF37] py-4 text-center text-[12px] font-bold uppercase tracking-[0.15em] text-black shadow-[0_8px_32px_rgba(212,175,55,0.4)] transition-all hover:bg-[#E8C155] hover:shadow-[0_12px_40px_rgba(212,175,55,0.55)]"
              >
                Get Card + Digital
              </a>
              <p className="mt-3 text-center text-[10px] font-normal text-white/30">
                Ships within 2–3 days
              </p>
            </div>
          </article>
        </div>
      </div>

      {/* Comparison table */}
      <div className="comparison-table mx-auto mt-24 max-w-[900px] overflow-hidden rounded-[24px] border border-[#1E1E1E] bg-[#121212]/50 backdrop-blur">
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {/* Header row */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr] items-center gap-4 border-b border-[#1E1E1E] bg-[#0F0F0F] px-6 py-6">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">Feature</span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Digital Only
              </span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                Card + Digital
              </span>
            </div>

            {/* Feature rows */}
            {COMPARISON.map((row, index) => (
              <div
                key={row.name}
                className={`grid grid-cols-[1.5fr_1fr_1fr] items-center gap-4 px-6 py-4 transition-colors hover:bg-[#151515] ${
                  index !== COMPARISON.length - 1 ? 'border-b border-[#1A1A1A]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#D4AF37]/70" aria-hidden="true" />
                  <span className="text-[13px] leading-6 text-white/55">{row.name}</span>
                </div>
                <div className="flex justify-center">
                  <Check on={row.digital} tone="muted" />
                </div>
                <div className="flex justify-center">
                  <Check on={row.card} tone="gold" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* After year one */}
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