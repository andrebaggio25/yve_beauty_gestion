'use client'

import { useState } from 'react'
import { DollarSign } from 'lucide-react'

interface MoneyDisplayProps {
  amount: number
  currency: string
  usdAmount?: number
  showUSD?: boolean
  fxRate?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function MoneyDisplay({
  amount,
  currency,
  usdAmount,
  showUSD = false,
  fxRate,
  className = '',
  size = 'md',
}: MoneyDisplayProps) {
  const [showConversion, setShowConversion] = useState(showUSD)

  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const usdFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`font-semibold text-white ${sizeClass}`}>
        {formatter.format(amount)}
      </div>

      {(usdAmount || fxRate) && (
        <button
          onClick={() => setShowConversion(!showConversion)}
          className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors"
          title={`Taxa: ${fxRate?.toFixed(4) || 'N/A'}`}
        >
          <DollarSign size={14} />
          {showConversion && usdAmount ? (
            usdFormatter.format(usdAmount)
          ) : (
            <span className="text-slate-400">USD</span>
          )}
        </button>
      )}
    </div>
  )
}
