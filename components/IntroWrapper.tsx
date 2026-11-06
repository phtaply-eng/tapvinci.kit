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
      >
        {children}
      </motion.div>
    </>
  )
}