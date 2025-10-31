export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string | null
}

export interface Company extends BaseEntity {
  name: string
  ein: string | null
  country_code: string | null
  timezone: string | null
  functional_currency: string
}

export interface Branch extends BaseEntity {
  company_id: string
  name: string
  country_code: string | null
  timezone: string | null
  functional_currency: string
  active: boolean
}

export interface Role extends BaseEntity {
  company_id: string
  name: string
  description: string | null
  can_view_all_employees: boolean
}

export interface Permission extends BaseEntity {
  company_id: string
  resource: string
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'send'
}

export interface AuditLog {
  id: string
  actor_user_id: string | null
  entity: string
  entity_id: string | null
  action: string
  old_data: Record<string, any> | null
  new_data: Record<string, any> | null
  ip: string | null
  user_agent: string | null
  at: string
}

export type Locale = 'pt-BR' | 'es-ES' | 'en-US'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
