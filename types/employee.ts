import { BaseEntity } from './common'

export type ContractType = 'fixed' | 'temporary' | 'intern' | 'contractor'

export interface Employee extends BaseEntity {
  branch_id: string
  user_profile_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  phone_country: string
  country_code: string
  tax_id: string | null
  tax_id_type: string | null
  contract_type: ContractType
  contract_value: number | null
  contract_currency: string | null
  payment_day: number | null
  start_date: string
  end_date: string | null
  is_active: boolean
  address: any
  documents: any
  notes: string | null
}

export interface EmployeeAttachment extends BaseEntity {
  employee_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  attachment_type: 'CONTRACT' | 'DOCUMENT' | 'ID' | 'OTHER'
  uploaded_by: string
}

export interface Provision extends BaseEntity {
  employee_id: string
  company_id: string
  provision_date: string
  amount: number
  currency: string
  description: string | null
  status: 'LANÇADA' | 'ESTORNADA' | 'UTILIZADA'
}

export interface CreateEmployeeInput {
  first_name: string
  last_name: string
  email: string
  phone?: string
  phone_country?: string
  country_code: string
  tax_id?: string
  tax_id_type?: string
  contract_type: ContractType
  contract_value?: number
  contract_currency?: string
  payment_day?: number
  start_date: string
  end_date?: string
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  id: string
}
