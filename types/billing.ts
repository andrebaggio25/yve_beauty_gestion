import { BaseEntity } from './common'

export type BillingModel = 'ÚNICO' | 'RECORRENTE'
export type RecognitionMethod = 'COMPETÊNCIA' | 'VIGÊNCIA'
export type ContractStatus = 'ATIVO' | 'SUSPENSO' | 'ENCERRADO'
export type RecurrenceFrequency = 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'partial' | 'paid' | 'canceled' | 'overdue'

// Contracts
export interface Contract extends BaseEntity {
  company_id: string
  branch_id: string | null
  customer_id: string
  status: ContractStatus
  start_date: string
  end_date: string | null
  billing_model: BillingModel
  recognition_method: RecognitionMethod
  currency: string
  language: string // pt-BR, es-ES, en-US
  notes: string | null
  next_billing_date: string | null
}

export interface ContractItem extends BaseEntity {
  contract_id: string
  description: string
  amount: number
  currency: string
  frequency: RecurrenceFrequency | null
  start_date: string
  end_date: string | null
  is_active: boolean
}

// Invoices
export interface Invoice extends BaseEntity {
  company_id: string
  branch_id: string | null
  customer_id: string
  contract_id: string | null
  status: InvoiceStatus
  invoice_number: string // INV-{YEAR}{SEQ}
  issue_date: string
  due_date: string
  original_currency: string
  subtotal: number
  tax_amount: number // Sales tax for US
  total_amount: number
  usd_equiv_amount: number
  fx_rate_used: number
  fx_rate_source: string
  fx_rate_timestamp: string
  notes: string | null
  template_id: string | null
  pdf_path: string | null
  language: string
}

export interface InvoiceLine extends BaseEntity {
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  line_total: number
  sequence: number
}

export interface InvoiceDelivery extends BaseEntity {
  invoice_id: string
  delivery_method: 'EMAIL' | 'MANUAL'
  recipient_email: string | null
  delivery_date: string
  status: 'ENVIADO' | 'LIDO' | 'DEVOLVIDO'
  notes: string | null
}

// Templates
export interface InvoiceTemplate extends BaseEntity {
  company_id: string
  name: string
  description: string | null
  template_json: Record<string, any>
  language: string
  is_default: boolean
  is_active: boolean
}

// Input Types
export interface CreateContractInput {
  customer_id: string
  start_date: string
  end_date?: string
  billing_model: BillingModel
  recognition_method: RecognitionMethod
  currency: string
  language: string
  notes?: string
  branch_id?: string
}

export interface UpdateContractInput extends Partial<CreateContractInput> {
  id: string
  status?: ContractStatus
}

export interface CreateContractItemInput {
  contract_id: string
  description: string
  amount: number
  currency: string
  frequency?: RecurrenceFrequency
  start_date: string
  end_date?: string
}

export interface UpdateContractItemInput extends Partial<CreateContractItemInput> {
  id: string
}

export interface CreateInvoiceInput {
  customer_id: string
  contract_id?: string
  issue_date: string
  due_date: string
  original_currency: string
  subtotal: number
  tax_amount?: number
  total_amount: number
  notes?: string
  template_id?: string
  language?: string
  branch_id?: string
  lines: CreateInvoiceLineInput[]
}

export interface CreateInvoiceLineInput {
  description: string
  quantity: number
  unit_price: number
  tax_rate?: number
}

export interface UpdateInvoiceInput {
  id: string
  status?: InvoiceStatus
  due_date?: string
  notes?: string
}

export interface CreateInvoiceTemplateInput {
  name: string
  description?: string
  template_json: Record<string, any>
  language: string
  is_default?: boolean
}

export interface UpdateInvoiceTemplateInput extends Partial<CreateInvoiceTemplateInput> {
  id: string
}
