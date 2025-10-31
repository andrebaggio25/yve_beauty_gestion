'use client'

import { useEffect, useState } from 'react'
import { convertCurrency, getUSDRate } from '@/modules/integrations/currency-api'
import { DollarSign, Loader2 } from 'lucide-react'

interface USDConversionDisplayProps {
  amount: number
  currency: string
  className?: string
  showLabel?: boolean
}

export function USDConversionDisplay({ 
  amount, 
  currency, 
  className = '',
  showLabel = true 
}: USDConversionDisplayProps) {
  const [usdAmount, setUsdAmount] = useState<number | null>(null)
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!amount || !currency || currency === 'USD') {
      setUsdAmount(null)
      setRate(null)
      return
    }

    convertToUSD()
  }, [amount, currency])

  const convertToUSD = async () => {
    try {
      setLoading(true)
      setError(false)
      
      const converted = await convertCurrency(amount, currency, 'USD')
      const exchangeRate = await getUSDRate(currency)
      
      setUsdAmount(converted)
      setRate(exchangeRate)
    } catch (err) {
      console.error('Error converting to USD:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (currency === 'USD') {
    return null
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <Loader2 size={16} className="animate-spin" />
        <span>Convertendo...</span>
      </div>
    )
  }

  if (error || usdAmount === null) {
    return null
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <DollarSign size={14} className="text-gray-400" />
        <span className="font-medium">
          {showLabel && '≈ '}
          {formatter.format(usdAmount)}
        </span>
        {rate && (
          <span className="text-xs text-gray-400 ml-1">
            (Taxa: {rate.toFixed(4)})
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Compact version for tables and lists
 */
export function USDConversionCompact({ 
  amount, 
  currency 
}: { amount: number; currency: string }) {
  const [usdAmount, setUsdAmount] = useState<number | null>(null)

  useEffect(() => {
    if (!amount || !currency || currency === 'USD') return
    
    convertCurrency(amount, currency, 'USD')
      .then(setUsdAmount)
      .catch(() => setUsdAmount(null))
  }, [amount, currency])

  if (!usdAmount || currency === 'USD') return null

  return (
    <span className="text-xs text-gray-500">
      ≈ {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdAmount)}
    </span>
  )
}

