import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

const supabase = createClient()

export interface DashboardKPIs {
  totalReceivable: number
  totalPayable: number
  invoicesThisMonth: number
  revenueThisMonth: number
  overdueAccounts: number
  cashFlowEstimate: number
  usdTotalReceivable?: number
  usdTotalPayable?: number
  usdRevenueThisMonth?: number
}

export interface RevenueChartData {
  month: string
  revenue: number
  usdRevenue?: number
}

export interface CurrencyDistribution {
  currency: string
  amount: number
  percentage: number
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Get all AR (open receivables)
  const { data: arData } = await supabase
    .from('accounts_receivable')
    .select('amount, usd_equiv_amount')
    .in('status', ['open', 'overdue', 'partial'])

  // Get all AP (open payables)
  const { data: apData } = await supabase
    .from('accounts_payable')
    .select('amount, usd_equiv_amount')
    .in('status', ['open', 'overdue', 'partial'])

  // Get invoices this month
  const { count: invoicesCount } = await supabase
    .from('invoice')
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'issued', 'sent', 'paid'])
    .gte('issue_date', monthStart.toISOString().split('T')[0])
    .lte('issue_date', monthEnd.toISOString().split('T')[0])

  // Get revenue this month (paid AR)
  const { data: revenueData } = await supabase
    .from('accounts_receivable')
    .select('amount, usd_equiv_amount')
    .eq('status', 'paid')

  // Get overdue accounts (both AP and AR)
  const { data: overdueAR } = await supabase
    .from('accounts_receivable')
    .select('id')
    .eq('status', 'overdue')

  const { data: overdueAP } = await supabase
    .from('accounts_payable')
    .select('id')
    .eq('status', 'overdue')

  // Calculate totals
  const totalReceivable = arData?.reduce((sum, ar) => sum + (ar.usd_equiv_amount || ar.amount || 0), 0) || 0
  const totalPayable = apData?.reduce((sum, ap) => sum + (ap.usd_equiv_amount || ap.amount || 0), 0) || 0
  const revenueThisMonth = revenueData?.reduce((sum, r) => sum + (r.usd_equiv_amount || r.amount || 0), 0) || 0
  const overdueAccounts = (overdueAR?.length || 0) + (overdueAP?.length || 0)

  // Cash flow estimate (receivables - payables)
  const cashFlowEstimate = totalReceivable - totalPayable

  return {
    totalReceivable,
    totalPayable,
    invoicesThisMonth: invoicesCount || 0,
    revenueThisMonth,
    overdueAccounts,
    cashFlowEstimate,
    usdTotalReceivable: totalReceivable,
    usdTotalPayable: totalPayable,
    usdRevenueThisMonth: revenueThisMonth,
  }
}

export async function getRevenueChartData(): Promise<RevenueChartData[]> {
  const data: RevenueChartData[] = []

  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i))
    const monthEnd = endOfMonth(subMonths(new Date(), i))

    const { data: revenueData } = await supabase
      .from('accounts_receivable')
      .select('amount, usd_equiv_amount')
      .eq('status', 'paid')

    const revenue = revenueData?.reduce((sum, r) => sum + (r.usd_equiv_amount || r.amount || 0), 0) || 0

    data.push({
      month: format(monthStart, 'MMM yyyy', { locale: require('date-fns/locale/pt-BR') }),
      revenue,
      usdRevenue: revenue,
    })
  }

  return data
}

export async function getCurrencyDistribution(): Promise<CurrencyDistribution[]> {
  // Get all open AR and AP by currency
  const { data: arByCurrency } = await supabase
    .from('accounts_receivable')
    .select('currency_code, amount')
    .in('status', ['open', 'overdue', 'partial'])

  const { data: apByCurrency } = await supabase
    .from('accounts_payable')
    .select('currency_code, amount')
    .in('status', ['open', 'overdue', 'partial'])

  const currencyTotals = new Map<string, number>()

  // Aggregate AR
  arByCurrency?.forEach(ar => {
    const current = currencyTotals.get(ar.currency_code) || 0
    currencyTotals.set(ar.currency_code, current + ar.amount)
  })

  // Aggregate AP
  apByCurrency?.forEach(ap => {
    const current = currencyTotals.get(ap.currency_code) || 0
    currencyTotals.set(ap.currency_code, current + ap.amount) // Add both for distribution
  })

  const total = Array.from(currencyTotals.values()).reduce((sum, amount) => sum + Math.abs(amount), 0)

  return Array.from(currencyTotals.entries())
    .map(([currency, amount]) => ({
      currency,
      amount: Math.abs(amount),
      percentage: total > 0 ? (Math.abs(amount) / total) * 100 : 0,
    }))
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

export async function getRecentActivity(): Promise<Array<{
  id: string
  type: string
  description: string
  date: string
  amount?: number
}>> {
  // Get recent payments (AP)
  const { data: recentAP } = await supabase
    .from('accounts_payable')
    .select('id, amount, status, created_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent receipts (AR)
  const { data: recentAR } = await supabase
    .from('accounts_receivable')
    .select('id, amount, status, created_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent contracts
  const { data: recentContracts } = await supabase
    .from('contract')
    .select('id, notes, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  const activities = [
    ...(recentAP?.map(ap => ({
      id: `ap-${ap.id}`,
      type: 'payment',
      description: `Pagamento realizado`,
      date: ap.created_at,
      amount: ap.amount,
    })) || []),
    ...(recentAR?.map(ar => ({
      id: `ar-${ar.id}`,
      type: 'receipt',
      description: `Recebimento realizado`,
      date: ar.created_at,
      amount: ar.amount,
    })) || []),
    ...(recentContracts?.map(c => ({
      id: `contract-${c.id}`,
      type: 'contract',
      description: `Novo contrato: ${c.notes || 'Sem descrição'}`,
      date: c.created_at,
      amount: 0,
    })) || []),
  ]

  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
}
