import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import TaplyTemplate from '../../components/TaplyTemplate'
import type { Profile } from '../../lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getProfile(username: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle()
  if (!data) return null
  // Deactivated from the Admin panel: behave like the profile does not exist
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
  return <TaplyTemplate profile={profile} />
}
