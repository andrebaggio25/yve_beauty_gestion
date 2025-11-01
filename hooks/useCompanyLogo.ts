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

  // Atualizar favicon quando a logo é carregada
  useEffect(() => {
    if (logoUrl && typeof document !== 'undefined') {
      updateFavicon(logoUrl)
    }
  }, [logoUrl])

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

  const updateFavicon = (url: string) => {
    if (typeof document === 'undefined') return

    // Remove favicon existente
    const existingFavicon = document.querySelector("link[rel*='icon']")
    if (existingFavicon) {
      existingFavicon.remove()
    }

    // Criar novo link para favicon
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = url
    document.head.appendChild(link)

    // Também atualizar apple-touch-icon para dispositivos iOS
    const appleIcon = document.querySelector("link[rel*='apple-touch-icon']")
    if (appleIcon) {
      appleIcon.remove()
    }
    
    const appleLink = document.createElement('link')
    appleLink.rel = 'apple-touch-icon'
    appleLink.href = url
    document.head.appendChild(appleLink)
  }

  return {
    logoUrl,
    companyName,
    loading,
    refetch: fetchCompanyLogo,
  }
}

