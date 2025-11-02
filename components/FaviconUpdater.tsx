'use client'

import { useEffect, useRef } from 'react'
import { useCompanyLogo } from '@/hooks/useCompanyLogo'

/**
 * Componente que atualiza o favicon dinamicamente com a logo da empresa
 * Deve ser usado no layout principal para garantir que o favicon seja atualizado
 */
export function FaviconUpdater() {
  const { logoUrl } = useCompanyLogo()
  const createdElementsRef = useRef<HTMLLinkElement[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !document.head) return

    // Limpar elementos criados anteriormente de forma segura
    createdElementsRef.current.forEach(element => {
      try {
        if (element && element.isConnected && element.parentNode) {
          element.remove()
        }
      } catch (error) {
        // Ignorar erros ao remover (elemento já foi removido ou não existe mais)
      }
    })
    createdElementsRef.current = []

    if (!logoUrl) return

    try {
      // Primeiro, remover favicons antigos (não dinâmicos) de forma segura
      const allFavicons = document.querySelectorAll("link[rel*='icon'], link[rel*='apple-touch-icon']")
      allFavicons.forEach(favicon => {
        try {
          const isDynamic = favicon.getAttribute('data-dynamic') === 'true'
          if (!isDynamic && favicon.isConnected && favicon.parentNode) {
            favicon.remove()
          }
        } catch (error) {
          // Ignorar erros ao remover elementos antigos
        }
      })

      // Criar novos favicons
      const link = document.createElement('link')
      link.setAttribute('data-dynamic', 'true')
      link.rel = 'icon'
      link.type = 'image/png'
      link.href = logoUrl
      link.sizes = '32x32'
      document.head.appendChild(link)
      createdElementsRef.current.push(link)

      // Criar favicon para diferentes tamanhos
      const link16 = document.createElement('link')
      link16.setAttribute('data-dynamic', 'true')
      link16.rel = 'icon'
      link16.type = 'image/png'
      link16.href = logoUrl
      link16.sizes = '16x16'
      document.head.appendChild(link16)
      createdElementsRef.current.push(link16)

      // Apple touch icon para iOS
      const appleLink = document.createElement('link')
      appleLink.setAttribute('data-dynamic', 'true')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = logoUrl
      appleLink.sizes = '180x180'
      document.head.appendChild(appleLink)
      createdElementsRef.current.push(appleLink)
    } catch (error) {
      console.warn('Error updating favicon:', error)
    }

    // Cleanup quando componente desmontar ou logo mudar
    return () => {
      createdElementsRef.current.forEach(element => {
        try {
          if (element && element.isConnected && element.parentNode) {
            element.remove()
          }
        } catch (error) {
          // Ignorar erros ao remover (elemento já foi removido)
        }
      })
      createdElementsRef.current = []
    }
  }, [logoUrl])

  // Este componente não renderiza nada
  return null
}

