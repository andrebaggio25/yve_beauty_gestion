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
        .single()

      if (error) {
        console.error('Error fetching company logo:', error)
        return
      }

      if (data) {
        setLogoUrl(data.logo_url)
        const name = data.trade_name || data.legal_name || data.name || 'Yve Gestión'
        setCompanyName(name)
      }
    } catch (error) {
      console.error('Error fetching company logo:', error)
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

