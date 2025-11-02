import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Durante build, retornar cliente dummy para evitar erros
    // O cliente real será criado em runtime quando as variáveis estiverem disponíveis
    if (typeof window === 'undefined') {
      throw new Error(
        'Supabase URL and Key are required. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
      )
    }
  }

  // Use minimal configuration - let Supabase handle storage internally
  return createBrowserClient(
    url || '',
    key || ''
  )
}
