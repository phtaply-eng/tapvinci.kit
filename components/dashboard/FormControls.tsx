'use client'

import type { ReactNode } from 'react'

/**
 * Shared design-system primitives for the dashboard edit form.
 *
 * The unified editor (`components/dashboard/UnifiedEditForm.tsx`) imports
 * these so inputs, labels and visibility pills can never drift apart.
 */

/** Single input style for every dashboard field. */
export const inputCls =
  'w-full rounded-xl border border-zinc-700 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#D4AF37]/70 focus:ring-2 focus:ring-[#D4AF37]/10'

/** Single label style for every dashboard field. */
export const labelCls =
  'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400'

/**
 * Public-visibility pill shown next to a field label.
 * ON  = gold "Show" (value renders on the public card)
 * OFF = gray  "Hide" (value is saved but not rendered)
 *
 * The classes below are the only approved visibility colors. Do not create
 * per-section variants.
 */
export function VisibilityToggle({
  visible,
  onToggle,
  label,
}: {
  visible: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={visible}
      aria-label={`${visible ? 'Hide' : 'Show'} ${label} on the public profile`}
      title={visible ? `Hide ${label} from the public card` : `Show ${label} on the public card`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition ${
        visible
          ? 'border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20'
          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <i className={`fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'}`} />
      {visible ? 'Show' : 'Hide'}
    </button>
  )
}

/**
 * Label row + optional visibility pill + field body. Use this for every
 * toggleable field so spacing and typography stay identical.
 */
export function Field({
  label,
  visible,
  onToggle,
  hint,
  children,
}: {
  label: string
  visible?: boolean
  onToggle?: () => void
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={labelCls}>{label}</span>
        {onToggle && typeof visible === 'boolean' && (
          <VisibilityToggle visible={visible} onToggle={onToggle} label={label} />
        )}
      </div>
      {children}
      {hint ? <p className="mt-1.5 text-[10px] text-zinc-500">{hint}</p> : null}
    </div>
  )
}
