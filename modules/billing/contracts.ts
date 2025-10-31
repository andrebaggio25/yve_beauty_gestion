import { createClient } from '@/lib/supabase/client'
import { addMonths, addDays, addYears } from 'date-fns'
import type { Contract, ContractItem, CreateContractInput, UpdateContractInput, CreateContractItemInput, UpdateContractItemInput, RecurrenceFrequency } from '@/types/billing'

const supabase = createClient()

export async function listContracts(filters?: {
  status?: string
  customerId?: string
}): Promise<Contract[]> {
  let query = supabase
    .from('contract')
    .select('*')
    .order('start_date', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getContractById(id: string): Promise<Contract | null> {
  const { data, error } = await supabase
    .from('contract')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  const payload = {
    customer_id: input.customer_id,
    branch_id: input.branch_id ?? null,
    status: 'ATIVO' as const,
    start_date: input.start_date,
    end_date: input.end_date ?? null,
    billing_model: input.billing_model,
    recognition_method: input.recognition_method,
    currency: input.currency,
    language: input.language,
    notes: input.notes ?? null,
    next_billing_date: input.start_date, // First billing on start date
  }

  const { data, error } = await supabase
    .from('contract')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as Contract
}

export async function updateContract(input: UpdateContractInput): Promise<Contract> {
  const { id, ...rest } = input
  const { data, error } = await supabase
    .from('contract')
    .update(rest)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Contract
}

export async function deactivateContract(id: string): Promise<void> {
  const { error } = await supabase
    .from('contract')
    .update({ status: 'ENCERRADO' })
    .eq('id', id)

  if (error) throw error
}

// Contract Items
export async function listContractItems(contractId: string): Promise<ContractItem[]> {
  const { data, error } = await supabase
    .from('contract_item')
    .select('*')
    .eq('contract_id', contractId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getContractItemById(id: string): Promise<ContractItem | null> {
  const { data, error } = await supabase
    .from('contract_item')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createContractItem(input: CreateContractItemInput): Promise<ContractItem> {
  const payload = {
    contract_id: input.contract_id,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    frequency: input.frequency ?? null,
    start_date: input.start_date,
    end_date: input.end_date ?? null,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('contract_item')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as ContractItem
}

export async function updateContractItem(input: UpdateContractItemInput): Promise<ContractItem> {
  const { id, ...rest } = input
  const { data, error } = await supabase
    .from('contract_item')
    .update(rest)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as ContractItem
}

export async function deactivateContractItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('contract_item')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}

// Utility: Calculate next billing date
export function calculateNextBillingDate(currentDate: string, frequency: RecurrenceFrequency): string {
  const date = new Date(currentDate)

  switch (frequency) {
    case 'MENSAL':
      return addMonths(date, 1).toISOString().split('T')[0]
    case 'BIMESTRAL':
      return addMonths(date, 2).toISOString().split('T')[0]
    case 'TRIMESTRAL':
      return addMonths(date, 3).toISOString().split('T')[0]
    case 'SEMESTRAL':
      return addMonths(date, 6).toISOString().split('T')[0]
    case 'ANUAL':
      return addYears(date, 1).toISOString().split('T')[0]
    default:
      return addMonths(date, 1).toISOString().split('T')[0]
  }
}

// Utility: Get frequency label
export function getFrequencyLabel(frequency: RecurrenceFrequency): string {
  const labels: Record<RecurrenceFrequency, string> = {
    'MENSAL': 'Mensal',
    'BIMESTRAL': 'Bimestral',
    'TRIMESTRAL': 'Trimestral',
    'SEMESTRAL': 'Semestral',
    'ANUAL': 'Anual',
  }
  return labels[frequency] || frequency
}
