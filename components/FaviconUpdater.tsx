'use client'

import { useEffect } from 'react'
import { useCompanyLogo } from '@/hooks/useCompanyLogo'

/**
 * Componente que atualiza o favicon dinamicamente com a logo da empresa
 * Deve ser usado no layout principal para garantir que o favicon seja atualizado
 */
export function FaviconUpdater() {
  const { logoUrl } = useCompanyLogo()

  useEffect(() => {
    if (!logoUrl || typeof document === 'undefined') return

    // Remover favicon existente
    const existingFavicons = document.querySelectorAll("link[rel*='icon'], link[rel*='apple-touch-icon']")
    existingFavicons.forEach(favicon => favicon.remove())

    // Criar novo favicon
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = logoUrl
    link.sizes = '32x32'
    document.head.appendChild(link)

    // Criar favicon para diferentes tamanhos
    const link16 = document.createElement('link')
    link16.rel = 'icon'
    link16.type = 'image/png'
    link16.href = logoUrl
    link16.sizes = '16x16'
    document.head.appendChild(link16)

    // Apple touch icon para iOS
    const appleLink = document.createElement('link')
    appleLink.rel = 'apple-touch-icon'
    appleLink.href = logoUrl
    appleLink.sizes = '180x180'
    document.head.appendChild(appleLink)

    // Cleanup quando componente desmontar ou logo mudar
    return () => {
      link.remove()
      link16.remove()
      appleLink.remove()
    }
  }, [logoUrl])

  // Este componente não renderiza nada
  return null
}

