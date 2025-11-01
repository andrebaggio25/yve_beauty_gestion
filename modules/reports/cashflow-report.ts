import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns'

const supabase = createClient()

export interface CashFlowParams {
  startDate: string  // YYYY-MM-DD
  months: number     // Number of months to project
  showUSD?: boolean
}

export interface CashFlowMonth {
  month: string
  openingBalance: number
  receipts: number
  payments: number
  netFlow: number
  closingBalance: number
  openingBalanceUSD: number
  receiptsUSD: number
  paymentsUSD: number
  netFlowUSD: number
  closingBalanceUSD: number
}

export interface CashFlowData {
  months: CashFlowMonth[]
  totalReceipts: number
  totalPayments: number
  totalNet: number
  totalReceiptsUSD: number
  totalPaymentsUSD: number
  totalNetUSD: number
}

export async function generateCashFlowReport(params: CashFlowParams): Promise<CashFlowData> {
  const { startDate, months, showUSD = false } = params
  
  const monthsData: CashFlowMonth[] = []
  let runningBalance = 0
  let runningBalanceUSD = 0
  
  // Get initial balance (could be from a cash account)
  const initialBalance = 50000 // Simulated - in real app would come from bank accounts
  const initialBalanceUSD = 10000
  
  runningBalance = initialBalance
  runningBalanceUSD = initialBalanceUSD
  
  for (let i = 0; i < months; i++) {
    const monthStart = startOfMonth(addMonths(new Date(startDate), i))
    const monthEnd = endOfMonth(addMonths(new Date(startDate), i))
    
    // Get receipts for this month (from accounts_receivable)
    const { data: receipts } = await supabase
      .from('accounts_receivable')
      .select('amount, usd_equiv_amount')
      .in('status', ['paid', 'open'])
      .gte('due_date', monthStart.toISOString().split('T')[0])
      .lte('due_date', monthEnd.toISOString().split('T')[0])
    
    // Get payments for this month (from accounts_payable)
    const { data: payments } = await supabase
      .from('accounts_payable')
      .select('amount, usd_equiv_amount')
      .in('status', ['paid', 'open'])
      .gte('due_date', monthStart.toISOString().split('T')[0])
      .lte('due_date', monthEnd.toISOString().split('T')[0])
    
    const receiptsTotal = receipts?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0
    const paymentsTotal = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    
    const receiptsTotalUSD = receipts?.reduce((sum, r) => sum + (r.usd_equiv_amount || 0), 0) || 0
    const paymentsTotalUSD = payments?.reduce((sum, p) => sum + (p.usd_equiv_amount || 0), 0) || 0
    
    const netFlow = receiptsTotal - paymentsTotal
    const netFlowUSD = receiptsTotalUSD - paymentsTotalUSD
    
    const closingBalance = runningBalance + netFlow
    const closingBalanceUSD = runningBalanceUSD + netFlowUSD
    
    monthsData.push({
      month: format(monthStart, 'MMM yyyy'),
      openingBalance: runningBalance,
      receipts: receiptsTotal,
      payments: paymentsTotal,
      netFlow,
      closingBalance,
      openingBalanceUSD: runningBalanceUSD,
      receiptsUSD: receiptsTotalUSD,
      paymentsUSD: paymentsTotalUSD,
      netFlowUSD,
      closingBalanceUSD,
    })
    
    runningBalance = closingBalance
    runningBalanceUSD = closingBalanceUSD
  }
  
  // Calculate totals
  const totalReceipts = monthsData.reduce((sum, m) => sum + m.receipts, 0)
  const totalPayments = monthsData.reduce((sum, m) => sum + m.payments, 0)
  const totalNet = totalReceipts - totalPayments
  
  const totalReceiptsUSD = monthsData.reduce((sum, m) => sum + m.receiptsUSD, 0)
  const totalPaymentsUSD = monthsData.reduce((sum, m) => sum + m.paymentsUSD, 0)
  const totalNetUSD = totalReceiptsUSD - totalPaymentsUSD
  
  return {
    months: monthsData,
    totalReceipts,
    totalPayments,
    totalNet,
    totalReceiptsUSD,
    totalPaymentsUSD,
    totalNetUSD,
  }
}

