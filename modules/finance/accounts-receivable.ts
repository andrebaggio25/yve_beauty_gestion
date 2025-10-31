import { createClient } from '@/lib/supabase/client'
import { convertToUSD } from '@/lib/utils/fx-service'
import type { AccountsReceivable, ARReceipt, CreateARInput, UpdateARInput, ARStatus } from '@/types/finance'

const supabase = createClient()

export async function listAccountsReceivable(filters?: {
  status?: ARStatus
  currency?: string
  customerId?: string
}): Promise<AccountsReceivable[]> {
  let query = supabase
    .from('accounts_receivable')
    .select('*')
    .order('due_date', { ascending: true })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.currency) {
    query = query.eq('original_currency', filters.currency)
  }
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getARById(id: string): Promise<AccountsReceivable | null> {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createAR(input: CreateARInput): Promise<AccountsReceivable> {
  const { usdAmount, fxRate } = await convertToUSD(input.original_amount, input.original_currency)

  const payload = {
    customer_id: input.customer_id,
    invoice_id: input.invoice_id ?? null,
    description: input.description,
    status: 'ABERTA' as const,
    original_amount: input.original_amount,
    original_currency: input.original_currency,
    usd_equiv_amount: usdAmount,
    fx_rate_used: fxRate,
    fx_rate_source: 'exchangerate.host',
    fx_rate_timestamp: new Date().toISOString(),
    due_date: input.due_date,
    issue_date: input.issue_date,
    invoice_number: input.invoice_number ?? null,
    notes: input.notes ?? null,
  }

  const { data, error } = await supabase
    .from('accounts_receivable')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as AccountsReceivable
}

export async function updateAR(input: UpdateARInput): Promise<AccountsReceivable> {
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
    .from('accounts_receivable')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as AccountsReceivable
}

export async function recordARReceipt(arId: string, amount: number, currency: string, paymentMethod: string): Promise<ARReceipt> {
  const { usdAmount, fxRate } = await convertToUSD(amount, currency)

  const payload = {
    ar_id: arId,
    receipt_date: new Date().toISOString().split('T')[0],
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
    .from('ar_receipt')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  // Update AR status based on total received
  const { data: totalReceived } = await supabase
    .from('ar_receipt')
    .select('usd_equiv_amount')
    .eq('ar_id', arId)

  const ar = await getARById(arId)
  if (ar) {
    const total = totalReceived?.reduce((sum, r) => sum + r.usd_equiv_amount, 0) || 0
    let newStatus: ARStatus = 'ABERTA'

    if (total >= ar.usd_equiv_amount) {
      newStatus = 'PAGA'
    } else if (total > 0) {
      newStatus = 'PARCIAL'
    }

    if (newStatus !== ar.status) {
      await updateAR({ id: arId, status: newStatus })
    }
  }

  return data as ARReceipt
}

export async function listARReceipts(arId: string): Promise<ARReceipt[]> {
  const { data, error } = await supabase
    .from('ar_receipt')
    .select('*')
    .eq('ar_id', arId)
    .order('receipt_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function cancelAR(id: string): Promise<void> {
  const { error } = await supabase
    .from('accounts_receivable')
    .update({ status: 'CANCELADA' })
    .eq('id', id)

  if (error) throw error
}
