'use client'

import { useState, useRef, useEffect } from 'react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (receiptFile: File) => Promise<void>
  gcashQR?: string
  mayaQR?: string
}

export default function PaymentModal({ isOpen, onClose, onConfirm, gcashQR, mayaQR }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'gcash' | 'maya'>('gcash')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFile(null)
        setPreviewUrl(null)
        setError('')
        setIsSubmitting(false)
        setActiveTab('gcash')
      }, 300)
    }
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const handleFile = (selectedFile: File) => {
    setError('')
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
    
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a JPG, PNG, or PDF file.')
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.')
      return
    }

    setFile(selectedFile)
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null) // It's a PDF
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!file) return
    setIsSubmitting(true)
    setError('')
    try {
      await onConfirm(file)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const activeQR = activeTab === 'gcash' ? gcashQR : mayaQR

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div 
        className="bg-[#121214] border border-[#2A2A2A] rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#D4AF37] via-[#FFC21C] to-[#D4AF37]" />

        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#1E1E1E] relative">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#1E1E1E] text-gray-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
          <h2 id="payment-modal-title" className="text-xl font-bold text-white font-serif tracking-wide">
            Activate Your Premium Profile
          </h2>
          <p className="text-[12px] text-gray-400 mt-1">
            Complete your payment to make your profile live.
          </p>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Payment Tabs */}
          <div className="flex bg-[#050505] p-1.5 rounded-xl border border-[#1E1E1E]">
            <button
              onClick={() => setActiveTab('gcash')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'gcash' ? 'bg-[#007DFE] text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              GCash
            </button>
            <button
              onClick={() => setActiveTab('maya')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'maya' ? 'bg-[#00D632] text-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              Maya
            </button>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center py-4 bg-[#0A0A0A] rounded-2xl border border-[#1E1E1E]">
            {activeQR ? (
              <div className="bg-white p-3 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <img src={activeQR} alt={`${activeTab} QR Code`} className="w-48 h-48 object-contain" />
              </div>
            ) : (
              <div className="w-48 h-48 bg-[#1A1A1C] rounded-xl flex items-center justify-center text-gray-500 text-sm text-center px-4 border border-dashed border-[#3a3a3c]">
                No {activeTab} QR configured in profile settings.
              </div>
            )}
            <p className="text-[11px] text-[#D4AF37] font-semibold tracking-widest uppercase mt-4 flex items-center gap-2">
              <i className="fa-solid fa-qrcode"></i> Scan to Pay
            </p>
          </div>

          {/* Upload Proof */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold tracking-widest text-[#D4AF37] uppercase">Proof of Payment</p>
            
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full rounded-xl border-2 border-dashed p-6 cursor-pointer text-center transition-all ${
                isDragging ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#3a3a3c] bg-[#1A1A1C] hover:border-[#555]'
              } ${file ? 'border-solid border-[#22c55e]/50 bg-[#22c55e]/5' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/png, application/pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Receipt preview" className="w-20 h-20 object-cover rounded-lg border border-[#2A2A2A]" />
                  ) : (
                    <div className="w-20 h-20 bg-[#2A2A2A] rounded-lg flex items-center justify-center text-2xl text-red-400">
                      <i className="fa-solid fa-file-pdf"></i>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[11px] text-[#D4AF37] mt-1">Click to replace</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-3">
                    <i className="fa-solid fa-cloud-arrow-up text-gray-400 text-lg"></i>
                  </div>
                  <p className="text-sm font-semibold text-white">Upload Receipt</p>
                  <p className="text-[11px] text-gray-500 mt-1">JPG, PNG or PDF (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center animate-in slide-in-from-top-2">
              <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!file || isSubmitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide bg-[#D4AF37] text-black hover:bg-[#FFC21C] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Uploading Proof...
              </>
            ) : (
              'Submit Proof & Activate Account'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}