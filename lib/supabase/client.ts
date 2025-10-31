import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // Use minimal configuration - let Supabase handle storage internally
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
