import { BaseEntity } from './common'

export type APStatus = 'open' | 'partial' | 'paid' | 'canceled' | 'overdue'
export type ARStatus = 'open' | 'partial' | 'paid' | 'canceled' | 'overdue'
export type RecurrenceType = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'

// Bank Accounts
export interface BankAccount extends BaseEntity {
  company_id: string
  branch_id: string | null
  bank_name: string
  account_number: string
  account_type: string // Checking, Savings, etc
  holder_name: string
  currency: string
  country_code: string
  is_active: boolean
}

// Foreign Exchange
export interface FxRate extends BaseEntity {
  source_currency: string
  target_currency: string // Always USD
  rate: number
  source: string // 'exchangerate.host', 'manual', etc
  effective_date: string
}

// Accounts Payable
export interface AccountsPayable extends BaseEntity {
  company_id: string
  branch_id: string | null
  employee_id: string | null // Fornecedor/Employee relacionado
  description: string
  status: APStatus
  original_amount: number
  original_currency: string
  usd_equiv_amount: number
  fx_rate_used: number
  fx_rate_source: string
  fx_rate_timestamp: string
  due_date: string
  document_date: string
  document_number: string | null
  document_file_path: string | null
  payment_method: string | null // BANK_TRANSFER, CHECK, CASH, etc
  bank_account_id: string | null
  notes: string | null
  is_recurring: boolean
  recurrence_type: RecurrenceType | null
  recurrence_end_date: string | null
  parent_ap_id: string | null // Para recurring
}

export interface APPayment extends BaseEntity {
  ap_id: string
  payment_date: string
  amount: number
  currency: string
  usd_equiv_amount: number
  fx_rate_used: number
  payment_method: string
  reference_number: string | null
  proof_file_path: string | null
  notes: string | null
}

// Accounts Receivable
export interface AccountsReceivable extends BaseEntity {
  company_id: string
  branch_id: string | null
  customer_id: string
  invoice_id: string | null
  description: string
  status: ARStatus
  original_amount: number
  original_currency: string
  usd_equiv_amount: number
  fx_rate_used: number
  fx_rate_source: string
  fx_rate_timestamp: string
  due_date: string
  issue_date: string
  invoice_number: string | null
  notes: string | null
}

export interface ARReceipt extends BaseEntity {
  ar_id: string
  receipt_date: string
  amount: number
  currency: string
  usd_equiv_amount: number
  fx_rate_used: number
  payment_method: string
  reference_number: string | null
  proof_file_path: string | null
  notes: string | null
}

// Input Types
export interface CreateAPInput {
  employee_id?: string
  description: string
  original_amount: number
  original_currency: string
  due_date: string
  document_date: string
  document_number?: string
  document_file_path?: string
  payment_method?: string
  bank_account_id?: string
  notes?: string
  is_recurring?: boolean
  recurrence_type?: RecurrenceType
  recurrence_end_date?: string
}

export interface UpdateAPInput extends Partial<CreateAPInput> {
  id: string
  status?: APStatus
}

export interface CreateARInput {
  customer_id: string
  invoice_id?: string
  description: string
  original_amount: number
  original_currency: string
  due_date: string
  issue_date: string
  invoice_number?: string
  notes?: string
}

export interface UpdateARInput extends Partial<CreateARInput> {
  id: string
  status?: ARStatus
}

export interface CreateBankAccountInput {
  bank_name: string
  account_number: string
  account_type: string
  holder_name: string
  currency: string
  country_code: string
  branch_id?: string
}

export interface UpdateBankAccountInput extends Partial<CreateBankAccountInput> {
  id: string
}
