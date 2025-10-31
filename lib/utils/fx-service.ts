import { createClient } from '@/lib/supabase/client'
import type { FxRate } from '@/types/finance'

const FX_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const FX_API_URL = 'https://api.exchangerate.host/latest'

interface CachedFxRate {
  rate: number
  timestamp: number
}

const fxCache = new Map<string, CachedFxRate>()

export async function getFxRate(
  sourceCurrency: string,
  targetCurrency: string = 'USD'
): Promise<number> {
  const supabase = createClient()

  if (sourceCurrency === targetCurrency) {
    return 1
  }

  const cacheKey = `${sourceCurrency}_${targetCurrency}`
  const cached = fxCache.get(cacheKey)

  // Check in-memory cache
  if (cached && Date.now() - cached.timestamp < FX_CACHE_TTL) {
    return cached.rate
  }

  try {
    // Check database cache
    const { data: dbRate, error: dbError } = await supabase
      .from('fx_rate')
      .select('rate, effective_date')
      .eq('source_currency', sourceCurrency)
      .eq('target_currency', targetCurrency)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    if (!dbError && dbRate) {
      const rateTimestamp = new Date(dbRate.effective_date).getTime()
      if (Date.now() - rateTimestamp < FX_CACHE_TTL) {
        fxCache.set(cacheKey, { rate: dbRate.rate, timestamp: Date.now() })
        return dbRate.rate
      }
    }

    // Fetch from API if not in cache or cache expired
    const response = await fetch(`${FX_API_URL}?base=${sourceCurrency}&symbols=${targetCurrency}`)
    
    if (!response.ok) {
      throw new Error(`FX API error: ${response.statusText}`)
    }

    const data = await response.json()
    const rate = data.rates?.[targetCurrency] || 1

    // Save to database
    await supabase
      .from('fx_rate')
      .insert({
        source_currency: sourceCurrency,
        target_currency: targetCurrency,
        rate,
        source: 'exchangerate.host',
        effective_date: new Date().toISOString(),
      })

    // Update memory cache
    fxCache.set(cacheKey, { rate, timestamp: Date.now() })

    return rate
  } catch (error) {
    console.error('Error fetching FX rate:', error)
    // Return fallback rate from DB or 1
    return 1
  }
}

export async function convertToUSD(
  amount: number,
  currency: string
): Promise<{ usdAmount: number; fxRate: number }> {
  const fxRate = await getFxRate(currency, 'USD')
  return {
    usdAmount: amount * fxRate,
    fxRate,
  }
}

export async function refreshAllFxRates(currencies: string[]): Promise<void> {
  const supabase = createClient()

  for (const currency of currencies) {
    if (currency === 'USD') continue

    try {
      const rate = await getFxRate(currency, 'USD')
      
      // Also fetch reverse rate
      await getFxRate('USD', currency)
    } catch (error) {
      console.error(`Error refreshing rate for ${currency}:`, error)
    }
  }
}
