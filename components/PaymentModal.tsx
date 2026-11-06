'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type PaymentMethod = 'gcash' | 'maya'
export type PlanTier = 'digital' | 'card'
export type PlanAmount = 399 | 799

export interface PaymentSubmission {
  receiptFile: File
  planTier: PlanTier
  planAmount: PlanAmount
  paymentMethod: PaymentMethod
}

type PaymentAccount = {
  label: string
  accountName: string
  accountNumber: string
  qrSrc: string
}

const PLANS = [
  {
    tier: 'digital' as const,
    amount: 399 as const,
    label: 'Digital Only',
    note: 'Landing page + QR profile',
  },
  {
    tier: 'card' as const,
    amount: 799 as const,
    label: 'Card + Digital',
    note: 'NFC card + digital profile',
  },
] as const

// QR images live in public/gallery. Swap the paths here if the files move.
const PAYMENT_ACCOUNTS: Record<PaymentMethod, PaymentAccount> = {
  gcash: {
    label: 'GCash',
    accountName: 'JO***A RA***N V.',
    accountNumber: '+63 908 327 4971',
    qrSrc: '/gallery/gcash-qr.jpg',
  },
  maya: {
    label: 'Maya',
    accountName: 'J****A R****N V.',
    accountNumber: '+63 908 327 4971',
    qrSrc: '/gallery/maya-qr.jpg',
  },
}

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (submission: PaymentSubmission) => Promise<void>
}

function Icon({ className = 'h-4 w-4', children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const CloseIcon = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M18 6 6 18M6 6l12 12" /></Icon>
)
const CopyIcon = ({ className }: { className?: string }) => (
  <Icon className={className}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></Icon>
)
const CheckIcon = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="m5 12 4.5 4.5L19 7" /></Icon>
)
const UploadIcon = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></Icon>
)
const PdfIcon = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h2.5a1.5 1.5 0 0 1 0 3H8v-3Zm0 3v3" /></Icon>
)

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const isImageFile = (file: File) =>
  file.type.startsWith('image/') || /\.(jpe?g|png)$/i.test(file.name)

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

export default function PaymentModal({ isOpen, onClose, onConfirm }: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanAmount>(399)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const submitLockRef = useRef(false)
  const closeRef = useRef(onClose)
  const account = PAYMENT_ACCOUNTS[selectedMethod]
  const selectedPlanDetails = PLANS.find((plan) => plan.amount === selectedPlan) ?? PLANS[0]

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  // Reset the checkout every time it opens.
  useEffect(() => {
    if (!isOpen) return
    setSelectedPlan(399)
    setSelectedMethod('gcash')
    setFile(null)
    setPreviewUrl(null)
    setIsDragging(false)
    setIsSubmitting(false)
    setIsSuccess(false)
    setError('')
    setCopied(false)
    submitLockRef.current = false
    if (fileInputRef.current) fileInputRef.current.value = ''
    const focusTimer = setTimeout(() => dialogRef.current?.focus(), 50)
    return () => clearTimeout(focusTimer)
  }, [isOpen])

  // Release the receipt preview object URL when it changes or the modal unmounts.
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  // Lock the page behind the modal so it does not scroll.
  useEffect(() => {
    if (!isOpen) return
    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousBodyPaddingRight = body.style.paddingRight
    const previousHtmlOverflow = documentElement.style.overflow
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth

    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight = previousBodyPaddingRight
      documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isOpen])

  // Close on Escape, but never while the receipt is being submitted.
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) closeRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isSubmitting])

  // Clear timers when unmounting.
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current)
  }, [])

  // Keep the success message visible briefly, then close automatically.
  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(() => closeRef.current(), 3200)
    return () => clearTimeout(timer)
  }, [isSuccess])

  if (!isOpen) return null

  const selectFile = (nextFile: File | null) => {
    setError('')
    if (!nextFile) return

    const validType =
      ACCEPTED_TYPES.includes(nextFile.type) || /\.(jpe?g|png|pdf)$/i.test(nextFile.name)

    if (!validType) {
      setError('Please upload a JPG, PNG, or PDF file.')
      return
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError('That file is too large. Maximum size is 5 MB.')
      return
    }

    setFile(nextFile)
    if (isImageFile(nextFile)) {
      try {
        setPreviewUrl(URL.createObjectURL(nextFile))
      } catch {
        setPreviewUrl(null)
      }
    } else {
      setPreviewUrl(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = () => {
    setFile(null)
    setPreviewUrl(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCopyNumber = async () => {
    try {
      await copyText(account.accountNumber)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the number. Please copy it manually.')
    }
  }

  const handleSubmit = async () => {
    if (!file || isSubmitting || submitLockRef.current) return
    submitLockRef.current = true
    setError('')
    setIsSubmitting(true)
    try {
      await onConfirm({
        receiptFile: file,
        planTier: selectedPlanDetails.tier,
        planAmount: selectedPlan,
        paymentMethod: selectedMethod,
      })
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      submitLockRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm"
      onClick={() => { if (!isSubmitting) closeRef.current() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          ref={dialogRef}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          className="relative flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111113] shadow-[0_24px_80px_rgba(0,0,0,0.7)] outline-none"
        >
          {isSuccess ? (
            <div className="relative px-6 py-10 text-center">
              <button
                type="button"
                onClick={() => closeRef.current()}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C766]"
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8C766] text-black">
                <CheckIcon className="h-8 w-8" />
              </div>
              <h2 id="payment-modal-title" className="mt-5 text-xl font-semibold text-white">Receipt received!</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
                Your account is now pending activation. We will verify it shortly.
              </p>
              <button
                type="button"
                onClick={() => closeRef.current()}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#E8C766] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C766] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]"
              >
                Done
              </button>
              <p className="mt-2 text-[11px] text-zinc-600">This window will close automatically.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
                <div>
                  <h2 id="payment-modal-title" className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                    Activate Your Profile
                  </h2>
                  <p className="mt-1 text-[13px] text-zinc-400">One-time payment to publish your digital card.</p>
                </div>
                <button
                  type="button"
                  onClick={() => closeRef.current()}
                  disabled={isSubmitting}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C766]"
                  aria-label="Close payment dialog"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {/* Plan selection */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Select plan</p>
                  <div role="radiogroup" aria-label="Select plan" className="grid grid-cols-2 gap-3">
                    {PLANS.map((plan) => {
                      const active = selectedPlan === plan.amount
                      return (
                        <button
                          key={plan.tier}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => { setSelectedPlan(plan.amount); setError('') }}
                          className={`rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C766] ${
                            active
                              ? 'border-[#E8C766] bg-[#E8C766]/10'
                              : 'border-white/10 bg-[#0C0C0E] hover:border-white/25'
                          }`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <span className="min-w-0">
                              <span className="block text-[12px] font-semibold text-white">{plan.label}</span>
                              <span className="mt-0.5 block text-[10px] leading-snug text-zinc-500">{plan.note}</span>
                            </span>
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                active ? 'border-[#E8C766] bg-[#E8C766] text-black' : 'border-zinc-600'
                              }`}
                            >
                              {active && <CheckIcon className="h-3 w-3" />}
                            </span>
                          </span>
                          <span className="mt-2 block text-lg font-bold leading-none text-white">₱{plan.amount}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Payment method</p>
                  <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-3">
                    {(Object.keys(PAYMENT_ACCOUNTS) as PaymentMethod[]).map((id) => {
                      const active = selectedMethod === id
                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => { setSelectedMethod(id); setCopied(false); setError('') }}
                          className={`relative flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C766] ${
                            active
                              ? 'border-[#E8C766] bg-[#E8C766]/10'
                              : 'border-white/10 bg-[#0C0C0E] hover:border-white/25'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                              id === 'gcash' ? 'bg-[#007DFE] text-white' : 'bg-[#00D632] text-black'
                            }`}
                          >
                            {id === 'gcash' ? 'G' : 'M'}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-white">{PAYMENT_ACCOUNTS[id].label}</span>
                            <span className="block text-[10px] text-zinc-500">Instantly scan to pay</span>
                          </span>
                          <span
                            className={`ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              active ? 'border-[#E8C766] bg-[#E8C766] text-black' : 'border-zinc-600'
                            }`}
                          >
                            {active && <CheckIcon className="h-3 w-3" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* QR + account details */}
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0C] p-4 sm:p-5">
                  <div className="flex flex-col items-center">
                    <div className="h-48 w-48 rounded-xl bg-white p-3 shadow-[0_10px_35px_rgba(0,0,0,0.45)] sm:h-52 sm:w-52">
                      <img
                        src={account.qrSrc}
                        alt={`${account.label} QR code`}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    <p className="mt-3 text-[11px] text-zinc-500">Scan the QR code, or send the exact amount to the number below.</p>
                  </div>

                  <div className="mt-4 divide-y divide-white/5 rounded-xl border border-white/10 bg-[#111114] px-3.5">
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Account name</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-white">{account.accountName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Mobile number</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold tracking-tight text-white">{account.accountNumber}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyNumber}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C766] ${
                          copied
                            ? 'border-green-500/30 bg-green-500/10 text-green-400'
                            : 'border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10'
                        }`}
                      >
                        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
                        {copied ? 'Copied' : 'Copy Number'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Receipt upload */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Proof of payment</p>
                    <span className="text-[10px] text-zinc-500">JPG, PNG, PDF</span>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={file ? 'Replace receipt' : 'Upload receipt'}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                    onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
                    onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false)
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      setIsDragging(false)
                      selectFile(event.dataTransfer.files?.[0] ?? null)
                    }}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C766] ${
                      isDragging
                        ? 'border-[#E8C766] bg-[#E8C766]/10'
                        : file
                          ? 'border-green-500/40 bg-green-500/5'
                          : 'border-white/15 bg-[#0C0C0E] hover:border-white/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                    />

                    {file ? (
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Receipt preview"
                              className="h-14 w-14 rounded-lg border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-[#1A1A1E] text-red-400">
                              <PdfIcon className="h-7 w-7" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); removeFile() }}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#18181B] text-zinc-300 shadow-lg transition hover:border-red-500 hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C766]"
                            aria-label="Remove receipt"
                          >
                            <CloseIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-medium text-white">{file.name}</p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">
                            {formatBytes(file.size)} · {isImageFile(file) ? 'Image' : 'PDF'}
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-[#E8C766]">Click to replace</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-2 text-center">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-300">
                          <UploadIcon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-white">
                          <span className="text-[#E8C766]">Click to upload</span> or drag and drop
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">Receipt image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 bg-[#0E0E10] px-5 py-4 sm:px-6">
                {error && (
                  <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-[11px] text-red-400" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!file || isSubmitting}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C766] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10] ${
                    isSubmitting
                      ? 'cursor-wait bg-[#1F1F23] text-white'
                      : !file
                        ? 'cursor-not-allowed bg-[#27272A] text-[#71717A]'
                        : 'bg-[#E8C766] text-black hover:bg-[#D4AF37]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#E8C766]" aria-hidden="true" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Payment for Verification'
                  )}
                </button>
                <p className="mt-2 text-center text-[10px] text-zinc-500">
                  Your receipt is used only to verify this one-time payment.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
