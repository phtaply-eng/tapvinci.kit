import type { ReactNode } from 'react'

// thin-line gold icons (1.5px stroke, 32px grid)
const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
export const ICONS = {
  tap: <Icon><circle cx="9" cy="16" r="1.7" /><path d="M14.5 11.5a6.5 6.5 0 0 1 0 9M19 8a11.5 11.5 0 0 1 0 16M23.5 4.5a16.5 16.5 0 0 1 0 23" /></Icon>,
  open: <Icon><rect x="9" y="3" width="14" height="26" rx="3.5" /><path d="M14 25h4M13 11h6M13 15h6M13 19h3.5" /></Icon>,
  connect: <Icon><circle cx="13" cy="11" r="4.5" /><path d="M4.5 27c.8-5.2 4.3-8 8.5-8s7.7 2.8 8.5 8M25 8v8M21 12h8" /></Icon>,
  page: <Icon><rect x="3.5" y="6" width="25" height="20" rx="3" /><path d="M3.5 12h25M8 9h.01M11.5 9h.01M8 17h9M8 21h6" /><rect x="19" y="16" width="6" height="6" rx="1.5" /></Icon>,
  card: <Icon><rect x="3" y="7" width="26" height="18" rx="3.5" /><path d="M3 13h26M8 20h6M21 17.5a3 3 0 0 1 0 4M24 16a5.5 5.5 0 0 1 0 7" /></Icon>,
  chip: <Icon><rect x="9" y="9" width="14" height="14" rx="2.5" /><rect x="13" y="13" width="6" height="6" rx="1" /><path d="M13 9V4M19 9V4M13 23v5M19 23v5M9 13H4M9 19H4M23 13h5M23 19h5" /></Icon>,
  image: <Icon><rect x="4" y="6" width="24" height="20" rx="3.5" /><circle cx="12" cy="13" r="2.2" /><path d="M5 23l7-6 5 4.5 4-3.5 6 5" /></Icon>,
}
