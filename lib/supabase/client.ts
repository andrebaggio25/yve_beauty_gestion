import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Durante build, retornar erro apenas no servidor
    if (typeof window === 'undefined') {
      throw new Error(
        'Supabase URL and Key are required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
      )
    }
    // No cliente, usar valores vazios e deixar que o erro apareça em runtime
    console.warn('Supabase environment variables not configured')
  }

  // Use minimal configuration - let Supabase handle storage internally
  return createBrowserClient(
    url || '',
    key || ''
  )
}
