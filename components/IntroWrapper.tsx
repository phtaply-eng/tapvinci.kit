'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IntroOverlay from './IntroOverlay'

export default function IntroWrapper({ children }: { children: React.ReactNode }) {
  // Default to true so the intro starts immediately
  const [showIntro, setShowIntro] = useState(true) 
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // We still respect accessibility settings
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReduced) {
      setShowIntro(false)
    }
    setIsMounted(true)
  }, [])

  // BUG FIX: Lock horizontal scroll while intro is visible.
  // IntroOverlay is OUTSIDE .tv-home, so .tv-home overflow-x: clip never applied to it.
  // On Brave Android this let the big TapV text push the page wider for 2-3s.
  useEffect(() => {
    if (!isMounted) return
    const html = document.documentElement
    const body = document.body
    if (showIntro) {
      const prevHtmlOverflow = html.style.overflowX
      const prevBodyOverflow = body.style.overflowX
      const prevBodyPosition = body.style.position
      html.style.overflowX = 'clip'
      body.style.overflowX = 'clip'
      // Keep vertical scroll locked too while intro plays, prevents sideways swipe
      body.style.position = 'relative'
      return () => {
        html.style.overflowX = prevHtmlOverflow
        body.style.overflowX = prevBodyOverflow
        body.style.position = prevBodyPosition
      }
    }
  }, [showIntro, isMounted])

  const handleIntroComplete = () => {
    // Just hide the intro, no session storage saved
    setShowIntro(false)
  }

  if (!isMounted) return null 

  return (
    <>
      <AnimatePresence>
        {showIntro && <IntroOverlay onComplete={handleIntroComplete} />}
      </AnimatePresence>
      
      <motion.div
        initial={{ scale: showIntro ? 0.98 : 1, opacity: showIntro ? 0 : 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 1.2, 
          ease: [0.22, 1, 0.36, 1], 
          delay: showIntro ? 2.5 : 0 // Syncs with the curtain opening
        }}
        className="min-h-screen"
        style={{ overflowX: 'clip', width: '100%', maxWidth: '100vw' }}
      >
        {children}
      </motion.div>
    </>
  )
}
