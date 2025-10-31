'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Building2 } from 'lucide-react'

interface CompanyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
}

export function CompanyLogo({ size = 'md', className = '', showFallback = true }: CompanyLogoProps) {
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
        setCompanyName(data.trade_name || data.legal_name || data.name || 'Yve Gestión')
      }
    } catch (error) {
      console.error('Error fetching company logo:', error)
    } finally {
      setLoading(false)
    }
  }

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
 */
export function CompanyLogoWithName({ className = '' }: { className?: string }) {
  const [companyName, setCompanyName] = useState<string>('Yve Gestión')
  const supabase = createClient()

  useEffect(() => {
    fetchCompanyName()
  }, [])

  const fetchCompanyName = async () => {
    try {
      const { data } = await supabase
        .from('company')
        .select('trade_name, legal_name, name')
        .single()

      if (data) {
        setCompanyName(data.trade_name || data.legal_name || data.name || 'Yve Gestión')
      }
    } catch (error) {
      console.error('Error fetching company name:', error)
    }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CompanyLogo size="md" />
      <div className="flex flex-col">
        <span className="font-bold text-gray-900">{companyName}</span>
        <span className="text-xs text-gray-500">Gestão Financeira</span>
      </div>
    </div>
  )
}

