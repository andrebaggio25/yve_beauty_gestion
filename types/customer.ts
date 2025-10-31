import { BaseEntity } from './common'

export interface Customer extends BaseEntity {
  company_id: string
  legal_name: string
  trade_name: string | null
  country_code: string
  state_code: string | null
  city: string | null
  address: string | null
  postal_code: string | null
  tax_id: string | null
  tax_id_type: 'EIN' | 'VAT' | 'NIF' | 'CNPJ' | 'OTHER'
  phone: string | null
  email: string | null
  website: string | null
  preferred_language: 'pt-BR' | 'es-ES' | 'en-US'
  is_active: boolean
}

export interface CustomerContact extends BaseEntity {
  customer_id: string
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  is_primary: boolean
}

export interface CustomerAttachment extends BaseEntity {
  customer_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by: string
}

export interface CreateCustomerInput {
  legal_name: string
  trade_name?: string
  country_code: string
  state_code?: string
  city?: string
  address?: string
  postal_code?: string
  tax_id?: string
  tax_id_type?: 'EIN' | 'VAT' | 'NIF' | 'CNPJ' | 'OTHER'
  phone?: string
  email?: string
  website?: string
  preferred_language: 'pt-BR' | 'es-ES' | 'en-US'
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string
}
