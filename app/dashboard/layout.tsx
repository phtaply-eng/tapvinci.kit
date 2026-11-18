import type { ReactNode } from 'react'
import SessionTimeout from '@/components/SessionTimeout'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionTimeout />
      {children}
    </>
  )
}
