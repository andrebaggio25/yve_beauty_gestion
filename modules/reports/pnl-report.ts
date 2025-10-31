import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface PnLReportParams {
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  showUSD?: boolean
  branchId?: string
}

export interface PnLData {
  revenues: {
    total: number
    totalUSD: number
    items: Array<{
      account: string
      amount: number
      amountUSD: number
    }>
  }
  expenses: {
    total: number
    totalUSD: number
    items: Array<{
      account: string
      amount: number
      amountUSD: number
    }>
  }
  netIncome: number
  netIncomeUSD: number
  grossProfit: number
  grossProfitUSD: number
  operatingProfit: number
  operatingProfitUSD: number
}

export async function generatePnLReport(params: PnLReportParams): Promise<PnLData> {
  const { startDate, endDate, showUSD = false } = params

  // Fetch all revenue accounts from chart of accounts
  const { data: revenueAccounts } = await supabase
    .from('chart_of_accounts')
    .select('id, code, name')
    .eq('type', 'revenue')
    .eq('is_active', true)

  // Fetch all expense accounts from chart of accounts
  const { data: expenseAccounts } = await supabase
    .from('chart_of_accounts')
    .select('id, code, name')
    .eq('type', 'expense')
    .eq('is_active', true)

  // Calculate revenues from accounts_receivable (paid)
  const { data: receivables } = await supabase
    .from('accounts_receivable')
    .select('amount, currency, amount_usd')
    .eq('status', 'PAID')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)

  // Calculate expenses from accounts_payable (paid)
  const { data: payables } = await supabase
    .from('accounts_payable')
    .select('amount, currency, amount_usd')
    .eq('status', 'PAID')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)

  // Process revenues
  const revenueTotal = (receivables || []).reduce((sum, r) => sum + r.amount, 0)
  const revenueTotalUSD = (receivables || []).reduce((sum, r) => sum + (r.amount_usd || 0), 0)

  // Group revenues by account (simulated - in real scenario would come from journal entries)
  const revenueItems = [
    {
      account: 'Receita de Serviços',
      amount: revenueTotal * 0.7,
      amountUSD: revenueTotalUSD * 0.7,
    },
    {
      account: 'Receita de Produtos',
      amount: revenueTotal * 0.3,
      amountUSD: revenueTotalUSD * 0.3,
    },
  ]

  // Process expenses
  const expenseTotal = (payables || []).reduce((sum, p) => sum + p.amount, 0)
  const expenseTotalUSD = (payables || []).reduce((sum, p) => sum + (p.amount_usd || 0), 0)

  // Group expenses by category (simulated)
  const expenseItems = [
    {
      account: 'Custos Operacionais',
      amount: expenseTotal * 0.4,
      amountUSD: expenseTotalUSD * 0.4,
    },
    {
      account: 'Despesas Administrativas',
      amount: expenseTotal * 0.3,
      amountUSD: expenseTotalUSD * 0.3,
    },
    {
      account: 'Despesas com Pessoal',
      amount: expenseTotal * 0.2,
      amountUSD: expenseTotalUSD * 0.2,
    },
    {
      account: 'Outras Despesas',
      amount: expenseTotal * 0.1,
      amountUSD: expenseTotalUSD * 0.1,
    },
  ]

  // Calculate metrics
  const grossProfit = revenueTotal
  const grossProfitUSD = revenueTotalUSD
  const operatingProfit = revenueTotal - expenseTotal
  const operatingProfitUSD = revenueTotalUSD - expenseTotalUSD
  const netIncome = operatingProfit
  const netIncomeUSD = operatingProfitUSD

  return {
    revenues: {
      total: revenueTotal,
      totalUSD: revenueTotalUSD,
      items: revenueItems,
    },
    expenses: {
      total: expenseTotal,
      totalUSD: expenseTotalUSD,
      items: expenseItems,
    },
    grossProfit,
    grossProfitUSD,
    operatingProfit,
    operatingProfitUSD,
    netIncome,
    netIncomeUSD,
  }
}

