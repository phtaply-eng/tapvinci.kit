import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://tapvinci.vercel.app'
  
  // Initialize Supabase (using the public anon key since this runs on the server)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Fetch all active, public profiles from your database
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, updated_at')
    .eq('is_active', true)
    // .eq('is_demo', false) // Uncomment this if you want to hide demo accounts from Google

  // 2. Map the profiles to sitemap format
  const profileUrls = (profiles || []).map((profile) => ({
    url: `${base}/${profile.username}`,
    lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // 3. Combine static pages with dynamic profiles
  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/card`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...profileUrls, // Spread all the user profiles here
  ]
}