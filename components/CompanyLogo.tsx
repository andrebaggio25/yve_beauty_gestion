'use client'

import Image from 'next/image'
import { Building2 } from 'lucide-react'
import { useCompanyLogo } from '@/hooks/useCompanyLogo'

interface CompanyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
}

export function CompanyLogo({ size = 'md', className = '', showFallback = true }: CompanyLogoProps) {
  const { logoUrl, companyName, loading } = useCompanyLogo()

  const sizeClasses = {
    sm: { container: 'h-8 w-8', icon: 24, text: 'text-sm' },
    md: { container: 'h-12 w-12', icon: 32, text: 'text-base' },
    lg: { container: 'h-16 w-16', icon: 48, text: 'text-lg' },
    xl: { container: 'h-24 w-24', icon: 64, text: 'text-xl' },
  }

  const currentSize = sizeClasses[size]

  if (loading) {
    return (
      <div className={`${currentSize.container} ${className} bg-gray-200 animate-pulse rounded-lg`} />
    )
  }

  if (logoUrl) {
    return (
      <div className={`${className} relative ${currentSize.container}`}>
        <Image
          src={logoUrl}
          alt={companyName}
          fill
          className="object-contain"
          priority
        />
      </div>
    )
  }

  if (!showFallback) {
    return null
  }

  // Fallback: Show company initials or icon
  return (
    <div className={`${currentSize.container} ${className} bg-black text-white rounded-lg flex items-center justify-center`}>
      <Building2 size={currentSize.icon * 0.6} />
    </div>
  )
}

/**
 * Company logo for use in navigation/header
 * Usa a logo da empresa se disponível, caso contrário mostra fallback
 */
export function CompanyLogoWithName({ className = '' }: { className?: string }) {
  const { logoUrl, companyName, loading } = useCompanyLogo()

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {loading ? (
        <div className="h-12 w-12 bg-gray-200 animate-pulse rounded-lg" />
      ) : logoUrl ? (
        <div className="relative h-12 w-12">
          <Image
            src={logoUrl}
            alt={companyName}
            fill
            className="object-contain rounded-lg"
            priority
          />
        </div>
      ) : (
        <div className="h-12 w-12 bg-black text-white rounded-lg flex items-center justify-center">
          <Building2 size={24} />
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-bold text-gray-900">{companyName}</span>
        <span className="text-xs text-gray-500">Gestão Financeira</span>
      </div>
    </div>
  )
}

