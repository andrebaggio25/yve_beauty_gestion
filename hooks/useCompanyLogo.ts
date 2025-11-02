'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CompanyLogoData {
  logoUrl: string | null
  companyName: string
  loading: boolean
}

/**
 * Hook para buscar e gerenciar a logo da empresa
 * Também atualiza o favicon automaticamente quando a logo é carregada
 */
export function useCompanyLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>('Yve Gestión')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCompanyLogo()
  }, [])

  const fetchCompanyLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('company')
        .select('logo_url, legal_name, trade_name, name')
        .maybeSingle() // Usa maybeSingle ao invés de single para não falhar se não houver dados

      if (error) {
        // Ignorar erro PGRST116 (no rows) e outros erros de permissão
        if (error.code === 'PGRST116' || error.code === '42501') {
          console.log('Company data not available yet')
          return
        }
        console.error('Error fetching company logo:', error)
        return
      }

      if (data) {
        setLogoUrl(data.logo_url || null)
        const name = data.trade_name || data.legal_name || data.name || 'Yve Gestión'
        setCompanyName(name)
      }
    } catch (error) {
      // Silenciar erros de company logo para não quebrar o app
      console.log('Company logo not available:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    logoUrl,
    companyName,
    loading,
    refetch: fetchCompanyLogo,
  }
}

