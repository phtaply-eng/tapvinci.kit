'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function IntroOverlay({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0) // 0: logo in, 1: sweep, 2: curtain
  
  useEffect(() => {
    // Master Timeline
    const t1 = setTimeout(() => setPhase(1), 500)   // 0.5s: Start Light Sweep
    const t2 = setTimeout(() => setPhase(2), 2500)  // 2.5s: Curtain opens
    const t3 = setTimeout(() => onComplete(), 3500) // 3.5s: Finish and unmount

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onComplete])

  // Lock the page behind the intro so the site underneath cannot scroll and
  // no body/html scrollbars are visible while the animation is playing.
  useEffect(() => {
    const body = document.body
    const html = document.documentElement
    const previousBodyOverflow = body.style.overflow
    const previousHtmlOverflow = html.style.overflow

    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previousBodyOverflow
      html.style.overflow = previousHtmlOverflow
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[99999] h-[100dvh] w-full overflow-hidden overscroll-none pointer-events-none select-none font-mono bg-transparent">
      
      {/* CURTAIN REVEAL (No more center line) */}
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: phase >= 2 ? '-100%' : 0 }}
        transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        className="absolute top-0 left-0 w-full h-1/2 bg-[#050505] z-30 will-change-transform"
      />
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: phase >= 2 ? '100%' : 0 }}
        transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        className="absolute bottom-0 left-0 w-full h-1/2 bg-[#050505] z-30 will-change-transform"
      />

      {/* MAIN LOGO OVERLAY */}
      <AnimatePresence>
        {phase < 2 && (
          <motion.div 
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 z-40 flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#050505]"
          >
            {/* LOGO CONTAINER */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative mx-auto flex w-[240px] max-w-[70vw] items-center justify-center md:w-[320px]"
            >
              {/* Pulsing Gold Glow */}
              <motion.div 
                animate={{ opacity: phase >= 1 ? 0.4 : 0.15, scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute inset-0 bg-[#FFD700] blur-[60px] rounded-full" 
              />
              
              <Image 
                src="/logo.png" 
                alt="TapVinci" 
                width={320} 
                height={90} 
                className="relative z-10 w-full h-auto object-contain" 
                priority 
              />

              {/* LIGHT SWEEP */}
              {phase === 1 && (
                <motion.div 
                  initial={{ left: '-100%', opacity: 0 }}
                  animate={{ left: '200%', opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-[#FFD700]/90 to-transparent skew-x-[-20deg] z-20 pointer-events-none"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}