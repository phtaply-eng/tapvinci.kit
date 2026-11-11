'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import ToastView from '@/components/ToastView'
import { useOwnerProfileEditor } from '@/components/dashboard/useOwnerProfileEditor'

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading editor">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-2.5 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-11 w-full animate-pulse rounded-xl bg-white/[0.06]" />
        </div>
      ))}
    </div>
  )
}

const UnifiedEditForm = dynamic(() => import('@/components/dashboard/UnifiedEditForm'), {
  ssr: false,
  loading: () => <FormSkeleton />,
})

const noop = () => {}

export default function EditDrawer({
  isOpen,
  onClose,
  profile,
  onSaved,
  onPreviewChange,
}: {
  isOpen: boolean
  onClose: () => void
  profile: any
  onSaved?: (updatedProfile: any) => void
  onPreviewChange?: (draftProfile: any) => void
}) {
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dragControls = useDragControls()

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3000)
  }, [])

  const editor = useOwnerProfileEditor({
    profileId: profile?.id,
    enabled: isOpen,
    showToast,
  })

  useEffect(() => {
    setMounted(true)
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  // Send real-time updates to the parent page
  useEffect(() => {
    if (isOpen && editor.profile) {
      onPreviewChange?.(editor.profile)
    }
  }, [editor.profile, isOpen, onPreviewChange])

  const requestClose = useCallback(() => {
    if (editor.saving) return
    onClose()
  }, [editor.saving, onClose])

  // Use a ref so the effect below doesn't depend on requestClose
  const requestCloseRef = useRef(requestClose)
  requestCloseRef.current = requestClose

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    
    // Focus close button ONLY when the drawer opens
    const focusTimer = setTimeout(() => closeButtonRef.current?.focus(), 350)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(focusTimer)
    }
  }, [isOpen]) // Only run when isOpen changes

  const handleSave = async () => {
    try {
      const result = await editor.save()
      if (!result.ok) {
        console.error("Save failed inside editor.save().")
        return
      }
      
      if (editor.profile) {
        onSaved?.(editor.profile) 
      }
      
      onClose()

      if (result.newUsername) {
        window.location.assign(`/${encodeURIComponent(result.newUsername)}?edit_profile=1`)
      }
    } catch (err) {
      console.error("Unhandled error during save:", err)
    }
  }

  if (!mounted) return null

  const panelBase = 'absolute flex flex-col bg-[#0c0c0e] text-white'
  const panelClass = isDesktop
    ? `${panelBase} right-0 top-0 h-full w-full max-w-[540px] border-l border-white/10 shadow-[-24px_0_80px_rgba(0,0,0,0.6)]`
    : `${panelBase} inset-x-0 bottom-0 h-[92vh] [@supports(height:1dvh)]:h-[92dvh] rounded-t-[28px] border-t border-white/10 shadow-[0_-24px_80px_rgba(0,0,0,0.6)]`

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="edit-drawer" className="fixed inset-0 z-[99998]">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={requestClose}
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Edit profile"
              className={panelClass}
              initial={isDesktop ? { x: '100%' } : { y: '100%' }}
              animate={isDesktop ? { x: 0 } : { y: 0 }}
              exit={isDesktop ? { x: '100%' } : { y: '100%' }}
              transition={{ type: 'spring', damping: 34, stiffness: 340, mass: 0.9 }}
              drag={isDesktop ? false : 'y'}
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) requestClose()
              }}
            >
              <div
                className="shrink-0 border-b border-white/10 px-5 pb-3 pt-3"
                onPointerDown={(event) => {
                  if (!isDesktop) dragControls.start(event)
                }}
                style={{ touchAction: isDesktop ? 'auto' : 'none' }}
              >
                {!isDesktop && (
                  <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-white/20" aria-hidden="true" />
                )}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      {editor.profile ? 'Professional' : 'Your profile'}
                    </p>
                    <h2 className="truncate text-lg font-bold">Edit profile</h2>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={requestClose}
                    onPointerDown={(event) => event.stopPropagation()}
                    aria-label="Close editor"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-4">
                <div className="rounded-2xl bg-zinc-900 p-5">
                  {editor.loading || (!editor.profile && !editor.error) ? (
                    <FormSkeleton />
                  ) : editor.error || !editor.profile ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-red-300">{editor.error}</p>
                      <button
                        type="button"
                        onClick={editor.reload}
                        className="mt-4 rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    <UnifiedEditForm
                      profile={editor.profile}
                      setProfile={editor.setProfile}
                      onSave={handleSave}
                      saving={editor.saving}
                      isAdminAccount={false}
                      showDemoCode={false}
                      demoCode=""
                      setDemoCode={noop}
                      showToast={showToast}
                      embedded
                      lockUsername={editor.usernameLocked}
                    />
                  )}
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <ToastView message={toast} />
    </>,
    document.body
  )
}