import { createClient } from '@/lib/supabase/client'

export interface Vendor {
  id: string
  branch_id: string
  legal_name: string
  trade_name?: string | null
  country_code?: string | null
  tax_id?: string | null
  tax_id_type?: string | null
  state_code?: string | null
  city?: string | null
  address?: string | null
  postal_code?: string | null
  phone?: string | null
  phone_country?: string | null
  emails?: string[] | null
  website?: string | null
  preferred_language?: string | null
  is_active?: boolean
  requires_invoice_pdf?: boolean | null
  created_at: string
  updated_at?: string | null
}

export interface CreateVendorInput {
  legal_name: string
  trade_name?: string
  country_code?: string
  state_code?: string
  city?: string
  address?: string
  postal_code?: string
  tax_id?: string | null
  tax_id_type?: string
  phone?: string | null
  phone_country?: string
  emails?: string[]
  website?: string | null
  preferred_language?: string
  is_active?: boolean
  requires_invoice_pdf?: boolean
}

export interface UpdateVendorInput {
  id: string
  legal_name?: string
  trade_name?: string
  country_code?: string
  state_code?: string
  city?: string
  address?: string
  postal_code?: string
  tax_id?: string | null
  tax_id_type?: string
  phone?: string | null
  phone_country?: string
  emails?: string[]
  website?: string | null
  preferred_language?: string
  is_active?: boolean
  requires_invoice_pdf?: boolean
}

const supabase = createClient()

export async function listVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendor')
    .select('*')
    .order('legal_name')
  if (error) throw error
  return data || []
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendor')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createVendor(input: CreateVendorInput & { emails?: string[] }): Promise<Vendor> {
  // Get branch_id from user profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not found')

  const { data: profile } = await supabase
    .from('user_profile')
    .select('branch_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile?.branch_id) {
    throw new Error('Branch not found. Please ensure user has a branch assigned.')
  }

  const payload = {
    branch_id: profile.branch_id,
    legal_name: input.legal_name,
    trade_name: input.trade_name ?? null,
    country_code: input.country_code ?? null,
    state_code: input.state_code ?? null,
    city: input.city ?? null,
    address: input.address ?? null,
    postal_code: input.postal_code ?? null,
    tax_id: input.tax_id ?? null,
    tax_id_type: input.tax_id_type ?? null,
    phone: input.phone ?? null,
    phone_country: input.phone_country ?? null,
    emails: input.emails && input.emails.length > 0 ? input.emails : null,
    website: input.website ?? null,
    preferred_language: input.preferred_language ?? 'pt-BR',
    is_active: input.is_active ?? true,
    requires_invoice_pdf: input.requires_invoice_pdf ?? false,
  }

  const { data, error } = await supabase
    .from('vendor')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as Vendor
}

export async function updateVendor(input: UpdateVendorInput): Promise<Vendor> {
  const { id, ...rest } = input
  const payload: Partial<Vendor> = {
    ...rest,
    emails: rest.emails && rest.emails.length > 0 ? rest.emails : null,
  }

  const { data, error } = await supabase
    .from('vendor')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Vendor
}

export async function deleteVendor(id: string): Promise<void> {
  const { error } = await supabase
    .from('vendor')
    .delete()
    .eq('id', id)
  if (error) throw error
}

