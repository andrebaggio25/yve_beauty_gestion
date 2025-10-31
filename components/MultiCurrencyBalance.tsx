'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { convertCurrency } from '@/modules/integrations/currency-api'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface CurrencyBalance {
  currency: string
  amount: number
  usdAmount: number
}

interface MultiCurrencyBalanceProps {
  type: 'receivable' | 'payable'
  className?: string
}

export function MultiCurrencyBalance({ type, className = '' }: MultiCurrencyBalanceProps) {
  const [balances, setBalances] = useState<CurrencyBalance[]>([])
  const [totalUSD, setTotalUSD] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchBalances()
  }, [type])

  const fetchBalances = async () => {
    try {
      setLoading(true)
      const table = type === 'receivable' ? 'accounts_receivable' : 'accounts_payable'
      
      // Fetch all open/partial accounts grouped by currency
      const { data, error } = await supabase
        .from(table)
        .select('currency_code, amount')
        .in('status', ['open', 'partial'])

      if (error) throw error

      if (!data || data.length === 0) {
        setBalances([])
        setTotalUSD(0)
        return
      }

      // Group by currency and sum
      const currencyTotals = data.reduce((acc: Record<string, number>, item: any) => {
        const currency = item.currency_code || 'BRL'
        acc[currency] = (acc[currency] || 0) + (item.amount || 0)
        return acc
      }, {})

      // Convert each currency to USD
      const balancesWithUSD: CurrencyBalance[] = await Promise.all(
        Object.entries(currencyTotals).map(async ([currency, amount]) => {
          const usdAmount = currency === 'USD' 
            ? amount 
            : await convertCurrency(amount, currency, 'USD')
          
          return {
            currency,
            amount,
            usdAmount,
          }
        })
      )

      // Sort by USD amount descending
      balancesWithUSD.sort((a, b) => b.usdAmount - a.usdAmount)

      setBalances(balancesWithUSD)
      setTotalUSD(balancesWithUSD.reduce((sum, b) => sum + b.usdAmount, 0))
    } catch (error) {
      console.error('Error fetching multi-currency balances:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-4 ${className}`}>
        <p className="text-sm text-gray-500">Nenhum saldo {type === 'receivable' ? 'a receber' : 'a pagar'}</p>
      </div>
    )
  }

  const Icon = type === 'receivable' ? TrendingUp : TrendingDown
  const colorClass = type === 'receivable' ? 'text-green-600' : 'text-red-600'

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={20} className={colorClass} />
        <h3 className="text-sm font-semibold text-gray-700">
          {type === 'receivable' ? 'Contas a Receber' : 'Contas a Pagar'}
        </h3>
      </div>

      <div className="space-y-2 mb-3">
        {balances.map(({ currency, amount, usdAmount }) => (
          <div key={currency} className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{currency}</span>
            <div className="text-right">
              <div className="font-semibold text-gray-900">{formatCurrency(amount, currency)}</div>
              {currency !== 'USD' && (
                <div className="text-xs text-gray-500">{formatUSD(usdAmount)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <DollarSign size={16} />
            Total (USD)
          </span>
          <span className={`text-lg font-bold ${colorClass}`}>
            {formatUSD(totalUSD)}
          </span>
        </div>
      </div>
    </div>
  )
}

