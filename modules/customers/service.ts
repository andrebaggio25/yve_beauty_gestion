import { createClient } from '@/lib/supabase/client'
import type { CreateCustomerInput, UpdateCustomerInput, Customer, CustomerContact, CustomerAttachment } from '@/types/customer'

const supabase = createClient()

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const payload = {
    legal_name: input.legal_name,
    trade_name: input.trade_name ?? null,
    country_code: input.country_code,
    state_code: input.state_code ?? null,
    city: input.city ?? null,
    address: input.address ?? null,
    postal_code: input.postal_code ?? null,
    tax_id: input.tax_id ?? null,
    tax_id_type: input.tax_id_type ?? 'OTHER',
    phone: input.phone ?? null,
    email: input.email ?? null,
    website: input.website ?? null,
    preferred_language: input.preferred_language,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('customer')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as Customer
}

export async function updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
  const { id, ...rest } = input
  const payload = {
    ...rest,
  }

  const { data, error } = await supabase
    .from('customer')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Customer
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase
    .from('customer')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function listCustomerContacts(customerId: string): Promise<CustomerContact[]> {
  const { data, error } = await supabase
    .from('customer_contact')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function upsertCustomerContact(contact: Omit<CustomerContact, 'created_at' | 'updated_at'>): Promise<CustomerContact> {
  const { data, error } = await supabase
    .from('customer_contact')
    .upsert(contact)
    .select('*')
    .single()
  if (error) throw error
  return data as CustomerContact
}

export async function listCustomerAttachments(customerId: string): Promise<CustomerAttachment[]> {
  const { data, error } = await supabase
    .from('customer_attachment')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addCustomerAttachment(attachment: Omit<CustomerAttachment, 'created_at' | 'updated_at'>): Promise<CustomerAttachment> {
  const { data, error } = await supabase
    .from('customer_attachment')
    .insert(attachment)
    .select('*')
    .single()
  if (error) throw error
  return data as CustomerAttachment
}
