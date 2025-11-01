import { BaseEntity } from './common'

export interface Customer extends BaseEntity {
  branch_id: string
  legal_name: string
  trade_name: string | null
  country_code: string | null
  state_code: string | null
  city: string | null
  address: string | null
  postal_code: string | null
  tax_id: string | null
  tax_id_type: string
  phone: string | null
  phone_country: string
  email: string | null
  emails: string[] // Array de e-mails
  website: string | null
  default_language: string | null
  preferred_language: 'pt-BR' | 'es-ES' | 'en-US'
  is_active: boolean
  addresses: any // JSONB
  contacts: any // JSONB
}

export interface CustomerContact extends BaseEntity {
  customer_id: string
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  contact_phone_country: string
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
  phone_country?: string
  email?: string
  website?: string
  preferred_language: 'pt-BR' | 'es-ES' | 'en-US'
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string
}
