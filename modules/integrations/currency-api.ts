// Currency Exchange Rate Service
// Uses exchangerate-api.com (free tier: 1500 requests/month)

interface ExchangeRates {
  [key: string]: number
}

interface ExchangeRateResponse {
  result: string
  base_code: string
  conversion_rates: ExchangeRates
  time_last_update_unix: number
}

const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || 'demo'
const BASE_URL = 'https://v6.exchangerate-api.com/v6'

// Cache para evitar muitas requisições
let ratesCache: ExchangeRates | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 3600000 // 1 hour in milliseconds

export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  // Check cache first
  const now = Date.now()
  if (ratesCache && (now - cacheTimestamp < CACHE_DURATION)) {
    return ratesCache
  }

  try {
    const response = await fetch(`${BASE_URL}/${API_KEY}/latest/${baseCurrency}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: ExchangeRateResponse = await response.json()
    
    if (data.result === 'success') {
      ratesCache = data.conversion_rates
      cacheTimestamp = now
      return data.conversion_rates
    } else {
      throw new Error('Failed to fetch exchange rates')
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    
    // Fallback to default rates if API fails
    return {
      USD: 1,
      BRL: 5.0,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.36,
    }
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount
  
  const rates = await getExchangeRates('USD')
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / rates[fromCurrency]
  const convertedAmount = amountInUSD * rates[toCurrency]
  
  return convertedAmount
}

export async function getUSDRate(currency: string): Promise<number> {
  if (currency === 'USD') return 1
  
  const rates = await getExchangeRates('USD')
  return 1 / rates[currency]
}

export async function getBRLRate(currency: string): Promise<number> {
  if (currency === 'BRL') return 1
  
  const rates = await getExchangeRates('USD')
  const brlRate = rates['BRL']
  const currencyRate = rates[currency]
  
  return currencyRate / brlRate
}

// Update all records in database with current USD rate
export async function updateUSDRatesInDatabase() {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  
  try {
    // Update accounts_payable
    const { data: payables } = await supabase
      .from('accounts_payable')
      .select('id, amount, currency')
      .is('amount_usd', null)
    
    if (payables) {
      for (const record of payables) {
        const amountUSD = await convertCurrency(record.amount, record.currency, 'USD')
        await supabase
          .from('accounts_payable')
          .update({ amount_usd: amountUSD })
          .eq('id', record.id)
      }
    }
    
    // Update accounts_receivable
    const { data: receivables } = await supabase
      .from('accounts_receivable')
      .select('id, amount, currency')
      .is('amount_usd', null)
    
    if (receivables) {
      for (const record of receivables) {
        const amountUSD = await convertCurrency(record.amount, record.currency, 'USD')
        await supabase
          .from('accounts_receivable')
          .update({ amount_usd: amountUSD })
          .eq('id', record.id)
      }
    }
    
    console.log('USD rates updated successfully')
    return true
  } catch (error) {
    console.error('Error updating USD rates:', error)
    return false
  }
}

