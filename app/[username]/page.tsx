import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import TaplyTemplate from '../../components/TaplyTemplate'
import type { Profile } from '../../lib/types'
import ViewTracker from '../../components/ViewTracker'
import StudentTapTracker from '../../components/students/StudentTapTracker'
import IntroWrapper from '../../components/IntroWrapper' // <-- IMPORT INTRO WRAPPER

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEMO_USERNAME = (process.env.NEXT_PUBLIC_DEMO_USERNAME || 'shua').toLowerCase()

async function getProfile(username: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle()
  if (!data) return null
  if ((data as { is_active?: boolean | null }).is_active === false) return null

  // Phase 3 Fix: Student data lives in student_profiles, not profiles.
  // Merge it so StudentStats / StudentEducation / StudentSpotify inside TaplyTemplate
  // see the real tap_count, streak_count, school, course, year_level, spotify_url.
  // We only overwrite with non-null values, so a NULL in student_profiles
  // never wipes a real value from profiles.
  if ((data as any)?.tier === 'student') {
    const { data: studentData } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', (data as any).id)
      .maybeSingle()
    if (studentData) {
      const merged: any = { ...(data as any) }
      for (const [key, value] of Object.entries(studentData as any)) {
        if (value !== null && value !== undefined) {
          merged[key] = value
        }
      }
      return merged as Profile
    }
  }

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
  // Phase 3 Part C: Student pages count taps only, professional pages count views only. Never both, so no double-count.
  const isStudent = (profile as any)?.tier === 'student'

  return (
    <IntroWrapper>
      {isStudent ? (
        <StudentTapTracker username={params.username} />
      ) : (
        <ViewTracker username={params.username} />
      )}
      
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
    </IntroWrapper>
  )
}