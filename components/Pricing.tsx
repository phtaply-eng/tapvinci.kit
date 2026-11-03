'use client'
import Link from 'next/link'

export default function Pricing({ contactEmail }: { contactEmail: string }) {
  return (
    <section id="pricing" className="bg-[#050505] py-24 px-6">
      <div className="max-w-[1100px] mx-auto">
        {/* Header - exact from Image 1 */}
        <div className="text-center mb-16">
          <p className="text-[10px] tracking-[0.3em] text-[#D4AF37]/60 mb-6 flex items-center justify-center gap-3">
            <span className="w-8 h-[1px] bg-[#2A2A2C]"></span> PRICING <span className="w-8 h-[1px] bg-[#2A2A2C]"></span>
          </p>
          <h2 className="text-[40px] md:text-[48px] font-bold text-white leading-[0.95] tracking-tight" style={{fontFamily: 'Fraunces, serif'}}>
            Simple, premium,<br />
            <span className="italic font-light">no monthly.</span>
          </h2>
          <p className="mt-6 text-[12px] leading-[1.6] text-zinc-500 max-w-[320px] mx-auto">
            One tap. Lifetime profile. No subscriptions.<br />
            Built for those who value permanence.
          </p>
        </div>

        {/* Cards grid - 2 cols, gap-6, max-w 700px centered like Image 1 */}
        <div className="grid md:grid-cols-2 gap-6 max-w-[700px] mx-auto">
          {/* LEFT - Digital Only ₱299 */}
          <div className="bg-[#121212] border border-[#1E1E1E] rounded-[20px] p-8 flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-[15px] font-semibold text-white">Digital Only</h3>
                <p className="text-[9px] tracking-[0.15em] text-zinc-500 mt-1">START WITH DIGITAL</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#1A1A1A] border border-[#2A2A2C] flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-zinc-600"></div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-white tracking-tight">₱299</span>
                <span className="text-[10px] text-zinc-500 leading-[1.1]">one-year<br/></span>
              </div>
            </div>

            <div className="space-y-[10px] mb-8 flex-1">
              <div className="flex gap-2 text-[12px] leading-[1.4]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px]">●</span>
                <span className="text-white">Profile on <span className="text-[#D4AF37]">tapvinci.vercel.app/username</span></span>
              </div>
              <div className="flex gap-2 text-[12px] leading-[1.4]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px]">●</span>
                <div>
                  <span className="text-white font-medium">All 6 themes</span>
                  <span className="text-zinc-400"> — Black Gold, Midnight Purple, Ocean Blue, Forest Green, Sunset Pink, Sunrise Orange</span>
                  <div className="text-[10px] text-zinc-500 opacity-50 mt-1 leading-[1.3]">Black Gold, Midnight Purple, Ocean Blue, Forest Green, Sunset Pink, Sunrise Orange</div>
                </div>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px]">●</span>
                <span><span className="text-white font-medium">Social links</span> <span className="text-zinc-400"></span></span>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px]">●</span>
                <span className="text-white font-medium">Gallery, Contact + Google Maps</span>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px]">●</span>
                <span className="text-white font-medium">GCash / Maya QR</span>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px]">●</span>
                <span className="text-white font-medium">QR code to print</span>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px]">●</span>
                <span><span className="text-white font-medium">Self-service edit</span> <span className="text-zinc-500">— anytime</span></span>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px]">●</span>
                <span className="text-white font-medium">Live Preview</span>
              </div>
            </div>

            <button className="w-full py-3.5 px-6 rounded-full border border-[#2A2A2C] text-[10px] font-bold tracking-[0.15em] text-white hover:bg-white hover:text-black transition-all">START WITH DIGITAL</button>
            <p className="text-[9px] text-[#D4AF37]/40 text-center mt-3 tracking-wide">Instant activation</p>
          </div>

          {/* RIGHT - Card + Digital ₱799 - GLOWING */}
          <div className="bg-[#121212] border border-[#D4AF37]/30 rounded-[20px] p-8 flex flex-col relative overflow-hidden shadow-[0_0_60px_rgba(212,175,55,0.15),_0_0_100px_rgba(212,175,55,0.08),_inset_0_1px_0_rgba(212,175,55,0.15)]">
            {/* Glow aura */}
            <div className="absolute -inset-[1px] rounded-[20px] bg-gradient-to-b from-[#D4AF37]/20 via-[#D4AF37]/5 to-transparent opacity-60 blur-[0.5px] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.18)_0%,_transparent_70%)] blur-[20px] pointer-events-none" />
            <div className="absolute top-4 right-4 bg-[#D4AF37] text-black text-[8px] font-bold tracking-widest px-2.5 py-1 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.5)]">MOST POPULAR</div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-[15px] font-semibold text-white">Card + Digital</h3>
                <p className="text-[9px] tracking-[0.15em] text-[#D4AF37]/70 mt-1">COMPLETE STUDIO</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#1A1A1A] border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                <div className="w-1 h-1 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] animate-pulse"></div>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(212,175,55,0.15)]">₱799</span>
                <span className="text-[10px] text-zinc-500 leading-[1.1]">one-time<br/>with card</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 my-6">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-[#222]"></div>
              <p className="text-[8px] tracking-[0.2em] text-[#D4AF37]/70 whitespace-nowrap font-semibold">EVERYTHING IN DIGITAL ONLY PLUS</p>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#D4AF37]/20 to-[#222]"></div>
            </div>

            <div className="space-y-[10px] mb-8 flex-1">
              <div className="flex gap-2 text-[12px] leading-[1.4]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px] drop-shadow-[0_0_6px_#D4AF37]">●</span>
                <span><span className="text-white font-medium">Premium NFC card</span> <span className="text-zinc-400">— Black or White + QR printed on back for non-NFC phones</span></span>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px] drop-shadow-[0_0_6px_#D4AF37]">●</span>
                <span><span className="text-white font-medium">1 Year hosting</span> <span className="text-zinc-400">— unlimited self-edits</span></span>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px] drop-shadow-[0_0_6px_#D4AF37]">●</span>
                <span><span className="text-white font-medium">Tap + Scan</span> <span className="text-zinc-400">— works on NFC-enabled phones</span></span>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px] drop-shadow-[0_0_6px_#D4AF37]">●</span>
                <span className="text-white font-medium">No app needed</span>
              </div>
              <div className="flex gap-2 text-[12px]">
                <span className="text-[#D4AF37] text-[8px] mt-[5px] drop-shadow-[0_0_6px_#D4AF37]">●</span>
                <span className="text-white font-medium">Ships anywhere PH</span>
              </div>
            </div>

            <button className="w-full py-3.5 px-6 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold tracking-[0.15em] shadow-[0_0_30px_rgba(212,175,55,0.4),_0_8px_24px_rgba(212,175,55,0.3),_inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">GET CARD + DIGITAL</button>
            <p className="text-[9px] text-[#D4AF37]/40 text-center mt-3 tracking-wide">Ships within 2-3 days - Free delivery</p>
          </div>
        </div>

        {/* After year one bar */}
        <div className="mt-8 max-w-[700px] mx-auto bg-[#151515] border border-[#222] rounded-[16px] p-4 flex gap-3 items-start">
          <div className="flex items-center gap-2 text-[9px] text-zinc-500 bg-[#1A1A1A] border border-[#2A2A2C] rounded-full px-3 py-1.5 whitespace-nowrap shrink-0">
            <span className="text-[10px]">ⓘ</span> AFTER YEAR ONE
          </div>
          <p className="text-[11px] leading-[1.5] text-zinc-400">
            After 1 year, <span className="text-white font-semibold">₱299/year</span> to keep profile live or <span className="text-white font-semibold">₱1,299 lifetime</span>. Optional lifetime upgrade. No lock-in. Your data stays yours.
          </p>
        </div>

        {/* Footer */}
        <p className="text-[9px] tracking-[0.2em] text-zinc-600 text-center mt-16">SECURE · PRIVATE · NO APP</p>
      </div>
    </section>
  )
}