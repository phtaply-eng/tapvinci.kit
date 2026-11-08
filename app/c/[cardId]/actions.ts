'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

// Claiming is handled client-side in ClaimScreen.tsx (ClaimCardButton) so the
// real claim_student_card RPC error is visible in the UI. Only sign-out remains
// as a server action.

export async function signOutAction(code: string) {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect(`/c/${encodeURIComponent(code)}`)
}
