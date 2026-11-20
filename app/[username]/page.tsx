import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { createClient } from '../../lib/supabase-server'
import TaplyTemplate from '../../components/TaplyTemplate'
import { isProfileOwner } from '../../lib/profile-ownership'
import type { Profile } from '../../lib/types'
import ViewTracker from '../../components/ViewTracker'
import TapTracker from '../../components/TapTracker'
import IntroWrapper from '../../components/IntroWrapper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getProfile(username: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle()
  if (!data) return null
  if ((data as { is_active?: boolean | null }).is_active === false) return null

  return data as Profile
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const p = await getProfile(params.username)
  if (!p) return { title: 'Not found — TapVinci' }
  return {
    title: `${p.name} — TapVinci`,
    description: p.bio || p.title || 'Digital card',
    openGraph: { title: p.name, description: p.bio || p.title || undefined, images: p.hero_image ? [p.hero_image] : undefined },
  }
}

export default async function UserPage({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username)
  if (!profile) notFound()

  // Server-side ownership check so the public profile can show owner-only
  // controls (e.g. Reset views) as soon as the page renders.
  let isOwner = false
  try {
    const supabaseServer = createClient()
    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (user) {
      // Strict ownership: the signed-in account must be the profile itself or
      // its recorded owner. A session alone must never unlock editing.
      isOwner = isProfileOwner(user.id, profile, user.email)
    }
  } catch {
    // A failed session read must never break the public profile.
    isOwner = false
  }

  return (
    <IntroWrapper>
      <ViewTracker username={params.username} />
      <TapTracker username={params.username} />

      <TaplyTemplate profile={profile} isOwner={isOwner} />
    </IntroWrapper>
  )
}