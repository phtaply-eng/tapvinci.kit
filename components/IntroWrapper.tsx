'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IntroOverlay from './IntroOverlay'

export default function IntroWrapper({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('tapvinci_intro_played')
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (!hasSeen && !prefersReduced) {
      setShowIntro(true)
    }
    setIsMounted(true)
  }, [])

  const handleIntroComplete = () => {
    sessionStorage.setItem('tapvinci_intro_played', 'true')
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
          delay: showIntro ? 2.5 : 0 // Syncs exactly with the curtain opening at 2.5s
        }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </>
  )
}