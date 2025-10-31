import { createClient } from '@/lib/supabase/client'
import { convertToUSD } from '@/lib/utils/fx-service'
import { createAR } from '@/modules/finance/accounts-receivable'
import type { Invoice, InvoiceLine, CreateInvoiceInput, UpdateInvoiceInput, InvoiceStatus } from '@/types/billing'

const supabase = createClient()

// Auto-increment sequence for invoice numbering
async function getNextInvoiceSequence(): Promise<number> {
  const currentYear = new Date().getFullYear()
  
  const { data: lastInvoice, error } = await supabase
    .from('invoice')
    .select('invoice_number')
    .like('invoice_number', `INV-${currentYear}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !lastInvoice) {
    return 1
  }

  // Extract sequence from INV-YEAR{SEQ}
  const match = lastInvoice.invoice_number.match(/INV-\d+(\d{6})/)
  return match ? parseInt(match[1]) + 1 : 1
}

async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const seq = await getNextInvoiceSequence()
  const paddedSeq = seq.toString().padStart(6, '0')
  return `INV-${currentYear}${paddedSeq}`
}

export async function listInvoices(filters?: {
  status?: InvoiceStatus
  customerId?: string
  currency?: string
}): Promise<Invoice[]> {
  let query = supabase
    .from('invoice')
    .select('*')
    .order('issue_date', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }
  if (filters?.currency) {
    query = query.eq('original_currency', filters.currency)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getInvoiceById(id: string): Promise<(Invoice & { lines?: InvoiceLine[] }) | null> {
  const { data, error } = await supabase
    .from('invoice')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) return null

  // Get lines
  const { data: lines } = await supabase
    .from('invoice_line')
    .select('*')
    .eq('invoice_id', id)
    .order('sequence', { ascending: true })

  return {
    ...data,
    lines: lines || [],
  }
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const invoiceNumber = await generateInvoiceNumber()
  const { usdAmount, fxRate } = await convertToUSD(input.total_amount, input.original_currency)

  // Calculate tax if in US
  const isUS = input.branch_id ? await checkIfBranchIsUS(input.branch_id) : false
  const taxAmount = input.tax_amount ?? (isUS ? input.subtotal * 0.085 : 0) // 8.5% average US tax

  const payload = {
    customer_id: input.customer_id,
    contract_id: input.contract_id ?? null,
    branch_id: input.branch_id ?? null,
    status: 'RASCUNHO' as const,
    invoice_number: invoiceNumber,
    issue_date: input.issue_date,
    due_date: input.due_date,
    original_currency: input.original_currency,
    subtotal: input.subtotal,
    tax_amount: taxAmount,
    total_amount: input.total_amount,
    usd_equiv_amount: usdAmount,
    fx_rate_used: fxRate,
    fx_rate_source: 'exchangerate.host',
    fx_rate_timestamp: new Date().toISOString(),
    notes: input.notes ?? null,
    template_id: input.template_id ?? null,
    pdf_path: null,
    language: input.language ?? 'pt-BR',
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoice')
    .insert(payload)
    .select('*')
    .single()

  if (invoiceError) throw invoiceError

  // Insert lines
  for (let i = 0; i < input.lines.length; i++) {
    const line = input.lines[i]
    const lineTotal = line.quantity * line.unit_price
    const lineTax = lineTotal * (line.tax_rate ?? 0)

    await supabase
      .from('invoice_line')
      .insert({
        invoice_id: invoice.id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate: line.tax_rate ?? 0,
        line_total: lineTotal + lineTax,
        sequence: i + 1,
      })
  }

  return invoice as Invoice
}

export async function updateInvoice(input: UpdateInvoiceInput): Promise<Invoice> {
  const { id, status, ...rest } = input

  const payload = status ? { ...rest, status } : rest

  const { data, error } = await supabase
    .from('invoice')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  // If status changed to EMITIDA, create AR automatically
  if (status === 'EMITIDA') {
    const invoice = data as Invoice
    await createAR({
      customer_id: invoice.customer_id,
      invoice_id: invoice.id,
      description: `Invoice ${invoice.invoice_number}`,
      original_amount: invoice.total_amount,
      original_currency: invoice.original_currency,
      due_date: invoice.due_date,
      issue_date: invoice.issue_date,
      invoice_number: invoice.invoice_number,
    })
  }

  return data as Invoice
}

export async function emitInvoice(invoiceId: string): Promise<Invoice> {
  return updateInvoice({
    id: invoiceId,
    status: 'EMITIDA',
  })
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  const { error } = await supabase
    .from('invoice')
    .update({ status: 'CANCELADA' })
    .eq('id', invoiceId)

  if (error) throw error
}

// Invoice Lines
export async function listInvoiceLines(invoiceId: string): Promise<InvoiceLine[]> {
  const { data, error } = await supabase
    .from('invoice_line')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sequence', { ascending: true })

  if (error) throw error
  return data || []
}

export async function deleteInvoiceLine(lineId: string): Promise<void> {
  const { error } = await supabase
    .from('invoice_line')
    .delete()
    .eq('id', lineId)

  if (error) throw error
}

// Utility: Check if branch is in US
async function checkIfBranchIsUS(branchId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('branch')
    .select('country_code')
    .eq('id', branchId)
    .single()

  if (error) return false
  return data?.country_code === 'US'
}

// Utility: Calculate invoice total from lines
export function calculateInvoiceTotal(lines: { quantity: number; unit_price: number; tax_rate: number }[]): {
  subtotal: number
  taxAmount: number
  total: number
} {
  let subtotal = 0
  let taxAmount = 0

  for (const line of lines) {
    const lineTotal = line.quantity * line.unit_price
    subtotal += lineTotal
    taxAmount += lineTotal * line.tax_rate
  }

  return {
    subtotal,
    taxAmount,
    total: subtotal + taxAmount,
  }
}
