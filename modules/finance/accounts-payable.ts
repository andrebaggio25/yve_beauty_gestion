import { createClient } from '@/lib/supabase/client'
import { convertToUSD } from '@/lib/utils/fx-service'
import type { AccountsPayable, APPayment, CreateAPInput, UpdateAPInput, APStatus } from '@/types/finance'

const supabase = createClient()

export async function listAccountsPayable(filters?: {
  status?: APStatus
  currency?: string
}): Promise<AccountsPayable[]> {
  let query = supabase
    .from('accounts_payable')
    .select('*')
    .order('due_date', { ascending: true })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.currency) {
    query = query.eq('original_currency', filters.currency)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getAPById(id: string): Promise<AccountsPayable | null> {
  const { data, error } = await supabase
    .from('accounts_payable')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createAP(input: CreateAPInput): Promise<AccountsPayable> {
  const { usdAmount, fxRate } = await convertToUSD(input.original_amount, input.original_currency)

  const payload = {
    branch_id: input.branch_id ?? null,
    vendor_id: input.vendor_id,
    document_pdf_url: input.document_pdf_url,
    currency_code: input.original_currency,
    amount: input.original_amount,
    usd_equiv_amount: usdAmount,
    fx_rate_used: fxRate,
    due_date: input.due_date,
    installments: input.installments ?? null,
    recurrence: input.recurrence ?? 'none',
    recurrence_end_date: input.recurrence_end_date ?? null,
    status: 'open' as const,
  }

  const { data, error } = await supabase
    .from('accounts_payable')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as AccountsPayable
}

export async function updateAP(input: UpdateAPInput): Promise<AccountsPayable> {
  const { id, original_amount, original_currency, ...rest } = input

  let updatePayload = { ...rest }

  // Recalculate USD amount if currency or amount changed
  if (original_amount && original_currency) {
    const { usdAmount, fxRate } = await convertToUSD(original_amount, original_currency)
    updatePayload = {
      ...updatePayload,
      original_amount,
      original_currency,
      usd_equiv_amount: usdAmount,
      fx_rate_used: fxRate,
      fx_rate_timestamp: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('accounts_payable')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as AccountsPayable
}

export async function recordAPPayment(apId: string, amount: number, currency: string, paymentMethod: string): Promise<APPayment> {
  const { usdAmount, fxRate } = await convertToUSD(amount, currency)

  const payload = {
    ap_id: apId,
    payment_date: new Date().toISOString().split('T')[0],
    amount,
    currency,
    usd_equiv_amount: usdAmount,
    fx_rate_used: fxRate,
    payment_method: paymentMethod,
    reference_number: null,
    proof_file_path: null,
    notes: null,
  }

  const { data, error } = await supabase
    .from('ap_payment')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  // Update AP status based on total paid
  const { data: totalPaid } = await supabase
    .from('ap_payment')
    .select('usd_equiv_amount')
    .eq('ap_id', apId)

  const ap = await getAPById(apId)
  if (ap) {
    const total = totalPaid?.reduce((sum, p) => sum + p.usd_equiv_amount, 0) || 0
    let newStatus: APStatus = 'open'

    if (total >= ap.usd_equiv_amount) {
      newStatus = 'paid'
    } else if (total > 0) {
      newStatus = 'partial'
    }

    if (newStatus !== ap.status) {
      await updateAP({ id: apId, status: newStatus })
    }
  }

  return data as APPayment
}

export async function listAPPayments(apId: string): Promise<APPayment[]> {
  const { data, error } = await supabase
    .from('ap_payment')
    .select('*')
    .eq('ap_id', apId)
    .order('payment_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function cancelAP(id: string): Promise<void> {
  const { error } = await supabase
    .from('accounts_payable')
    .update({ status: 'canceled' })
    .eq('id', id)

  if (error) throw error
}
