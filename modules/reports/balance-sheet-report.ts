import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface BalanceSheetParams {
  endDate: string  // YYYY-MM-DD
  showUSD?: boolean
}

export interface BalanceSheetData {
  assets: {
    current: {
      total: number
      totalUSD: number
      items: Array<{
        account: string
        amount: number
        amountUSD: number
      }>
    }
    nonCurrent: {
      total: number
      totalUSD: number
      items: Array<{
        account: string
        amount: number
        amountUSD: number
      }>
    }
    total: number
    totalUSD: number
  }
  liabilities: {
    current: {
      total: number
      totalUSD: number
      items: Array<{
        account: string
        amount: number
        amountUSD: number
      }>
    }
    nonCurrent: {
      total: number
      totalUSD: number
      items: Array<{
        account: string
        amount: number
        amountUSD: number
      }>
    }
    total: number
    totalUSD: number
  }
  equity: {
    total: number
    totalUSD: number
    items: Array<{
      account: string
      amount: number
      amountUSD: number
    }>
  }
  totalLiabilitiesAndEquity: number
  totalLiabilitiesAndEquityUSD: number
}

export async function generateBalanceSheet(params: BalanceSheetParams): Promise<BalanceSheetData> {
  const { endDate, showUSD = false } = params

  // Fetch accounts receivable (pending and overdue)
  const { data: receivables } = await supabase
    .from('accounts_receivable')
    .select('amount, amount_usd, status')
    .in('status', ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'])
    .lte('due_date', endDate)

  // Fetch accounts payable (pending and overdue)
  const { data: payables } = await supabase
    .from('accounts_payable')
    .select('amount, amount_usd, status')
    .in('status', ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'])
    .lte('due_date', endDate)

  // Calculate Assets
  const cashAndBank = 50000 // Simulated - would come from bank accounts
  const cashAndBankUSD = 10000
  
  const accountsReceivableTotal = (receivables || []).reduce((sum, r) => sum + r.amount, 0)
  const accountsReceivableTotalUSD = (receivables || []).reduce((sum, r) => sum + (r.amount_usd || 0), 0)

  const currentAssets = [
    { account: 'Caixa e Bancos', amount: cashAndBank, amountUSD: cashAndBankUSD },
    { account: 'Contas a Receber', amount: accountsReceivableTotal, amountUSD: accountsReceivableTotalUSD },
    { account: 'Estoques', amount: 30000, amountUSD: 6000 },
  ]

  const currentAssetsTotal = currentAssets.reduce((sum, a) => sum + a.amount, 0)
  const currentAssetsTotalUSD = currentAssets.reduce((sum, a) => sum + a.amountUSD, 0)

  const nonCurrentAssets = [
    { account: 'Imobilizado', amount: 100000, amountUSD: 20000 },
    { account: 'Intangível', amount: 25000, amountUSD: 5000 },
  ]

  const nonCurrentAssetsTotal = nonCurrentAssets.reduce((sum, a) => sum + a.amount, 0)
  const nonCurrentAssetsTotalUSD = nonCurrentAssets.reduce((sum, a) => sum + a.amountUSD, 0)

  const totalAssets = currentAssetsTotal + nonCurrentAssetsTotal
  const totalAssetsUSD = currentAssetsTotalUSD + nonCurrentAssetsTotalUSD

  // Calculate Liabilities
  const accountsPayableTotal = (payables || []).reduce((sum, p) => sum + p.amount, 0)
  const accountsPayableTotalUSD = (payables || []).reduce((sum, p) => sum + (p.amount_usd || 0), 0)

  const currentLiabilities = [
    { account: 'Contas a Pagar', amount: accountsPayableTotal, amountUSD: accountsPayableTotalUSD },
    { account: 'Impostos a Pagar', amount: 15000, amountUSD: 3000 },
    { account: 'Salários a Pagar', amount: 20000, amountUSD: 4000 },
  ]

  const currentLiabilitiesTotal = currentLiabilities.reduce((sum, l) => sum + l.amount, 0)
  const currentLiabilitiesTotalUSD = currentLiabilities.reduce((sum, l) => sum + l.amountUSD, 0)

  const nonCurrentLiabilities = [
    { account: 'Empréstimos Longo Prazo', amount: 50000, amountUSD: 10000 },
  ]

  const nonCurrentLiabilitiesTotal = nonCurrentLiabilities.reduce((sum, l) => sum + l.amount, 0)
  const nonCurrentLiabilitiesTotalUSD = nonCurrentLiabilities.reduce((sum, l) => sum + l.amountUSD, 0)

  const totalLiabilities = currentLiabilitiesTotal + nonCurrentLiabilitiesTotal
  const totalLiabilitiesUSD = currentLiabilitiesTotalUSD + nonCurrentLiabilitiesTotalUSD

  // Calculate Equity
  const totalEquity = totalAssets - totalLiabilities
  const totalEquityUSD = totalAssetsUSD - totalLiabilitiesUSD

  const equityItems = [
    { account: 'Capital Social', amount: totalEquity * 0.6, amountUSD: totalEquityUSD * 0.6 },
    { account: 'Lucros Acumulados', amount: totalEquity * 0.4, amountUSD: totalEquityUSD * 0.4 },
  ]

  return {
    assets: {
      current: {
        total: currentAssetsTotal,
        totalUSD: currentAssetsTotalUSD,
        items: currentAssets,
      },
      nonCurrent: {
        total: nonCurrentAssetsTotal,
        totalUSD: nonCurrentAssetsTotalUSD,
        items: nonCurrentAssets,
      },
      total: totalAssets,
      totalUSD: totalAssetsUSD,
    },
    liabilities: {
      current: {
        total: currentLiabilitiesTotal,
        totalUSD: currentLiabilitiesTotalUSD,
        items: currentLiabilities,
      },
      nonCurrent: {
        total: nonCurrentLiabilitiesTotal,
        totalUSD: nonCurrentLiabilitiesTotalUSD,
        items: nonCurrentLiabilities,
      },
      total: totalLiabilities,
      totalUSD: totalLiabilitiesUSD,
    },
    equity: {
      total: totalEquity,
      totalUSD: totalEquityUSD,
      items: equityItems,
    },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    totalLiabilitiesAndEquityUSD: totalLiabilitiesUSD + totalEquityUSD,
  }
}

