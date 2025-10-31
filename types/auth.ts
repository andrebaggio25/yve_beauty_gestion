import { Session, User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  auth_user_id: string | null
  company_id: string
  branch_id: string | null
  preferred_locale: 'pt-BR' | 'es-ES' | 'en-US'
  is_master: boolean
  created_at: string
  updated_at: string | null
}

export interface AuthContext {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
}
