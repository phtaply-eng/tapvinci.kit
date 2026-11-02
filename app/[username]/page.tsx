import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import TaplyTemplate from '../../components/TaplyTemplate'
import type { Profile } from '../../lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// demo-only username - set NEXT_PUBLIC_DEMO_USERNAME=shua in Vercel env
const DEMO_USERNAME = (process.env.NEXT_PUBLIC_DEMO_USERNAME || 'shua').toLowerCase()

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

  const isDemo = params.username.toLowerCase() === DEMO_USERNAME

  return (
    <>
      {isDemo && (
        <Link
          href="/"
          className="fixed top-4 left-4 z-[60] inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-medium tracking-widest uppercase transition-all hover:scale-[1.02]"
          style={{
            background: 'rgba(18,18,20,0.9)',
            border: '1px solid #2A2A2A',
            backdropFilter: 'blur(12px)',
            color: '#F5F1E8',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}
        >
          <i className="fa-solid fa-house text-[10px]" />
          Home
        </Link>
      )}
      <TaplyTemplate profile={profile} />
    </>
  )
}