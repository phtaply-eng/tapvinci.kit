'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export async function claimCardAction(code: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/c/${encodeURIComponent(code)}`)
  const { data: result } = await supabase.rpc('claim_student_card', { p_code: code })
  if (result === 'claimed' || result === 'owned_by_you') redirect('/dashboard')
  redirect(`/c/${encodeURIComponent(code)}?msg=${result ?? 'error'}`)
}

export async function signOutAction(code: string) {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect(`/c/${encodeURIComponent(code)}`)
}
