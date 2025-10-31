import { createClient } from '@/lib/supabase/client'
import type { BankAccount, CreateBankAccountInput, UpdateBankAccountInput } from '@/types/finance'

const supabase = createClient()

export async function listBankAccounts(): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_account')
    .select('*')
    .eq('is_active', true)
    .order('bank_name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getBankAccountById(id: string): Promise<BankAccount | null> {
  const { data, error } = await supabase
    .from('bank_account')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createBankAccount(input: CreateBankAccountInput): Promise<BankAccount> {
  const payload = {
    bank_name: input.bank_name,
    account_number: input.account_number,
    account_type: input.account_type,
    holder_name: input.holder_name,
    currency: input.currency,
    country_code: input.country_code,
    branch_id: input.branch_id ?? null,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('bank_account')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as BankAccount
}

export async function updateBankAccount(input: UpdateBankAccountInput): Promise<BankAccount> {
  const { id, ...rest } = input
  const payload = { ...rest }

  const { data, error } = await supabase
    .from('bank_account')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as BankAccount
}

export async function deactivateBankAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('bank_account')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}
