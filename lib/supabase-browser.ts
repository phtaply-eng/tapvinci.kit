import { createBrowserClient } from '@supabase/ssr'

// Create a module-level variable to hold the single instance
let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  // If the client doesn't exist yet, create it
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  
  // Always return the exact same instance
  return client
}