import { createClient } from '@/lib/supabase/client'
import type { CreateEmployeeInput, UpdateEmployeeInput, Employee, EmployeeAttachment, Provision } from '@/types/employee'

const supabase = createClient()

export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employee')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employee')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const payload = {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone ?? null,
    country_code: input.country_code,
    state_code: input.state_code ?? null,
    city: input.city ?? null,
    address: input.address ?? null,
    postal_code: input.postal_code ?? null,
    tax_id: input.tax_id ?? null,
    tax_id_type: input.tax_id_type ?? 'OTHER',
    contract_type: input.contract_type,
    contract_value: input.contract_value ?? null,
    contract_currency: input.contract_currency ?? 'USD',
    payment_day: input.payment_day ?? null,
    start_date: input.start_date,
    end_date: input.end_date ?? null,
    is_active: true,
    can_view_all_data: input.can_view_all_data ?? false,
  }

  const { data, error } = await supabase
    .from('employee')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  const employee = data as Employee

  // Generate initial provision if contract type is CONTRACTOR
  if (input.contract_type === 'CONTRACTOR' && input.contract_value) {
    await createProvision({
      employee_id: employee.id,
      provision_date: new Date().toISOString().split('T')[0],
      amount: input.contract_value,
      currency: input.contract_currency || 'USD',
      description: `Initial provision for contractor ${employee.first_name} ${employee.last_name}`,
    })
  }

  return employee
}

export async function updateEmployee(input: UpdateEmployeeInput): Promise<Employee> {
  const { id, ...rest } = input
  const payload = {
    ...rest,
  }

  const { data, error } = await supabase
    .from('employee')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Employee
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('employee')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function listEmployeeAttachments(employeeId: string): Promise<EmployeeAttachment[]> {
  const { data, error } = await supabase
    .from('employee_attachment')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addEmployeeAttachment(attachment: Omit<EmployeeAttachment, 'created_at' | 'updated_at'>): Promise<EmployeeAttachment> {
  const { data, error } = await supabase
    .from('employee_attachment')
    .insert(attachment)
    .select('*')
    .single()
  if (error) throw error
  return data as EmployeeAttachment
}

export async function listEmployeeProvisions(employeeId: string): Promise<Provision[]> {
  const { data, error } = await supabase
    .from('provision')
    .select('*')
    .eq('employee_id', employeeId)
    .order('provision_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createProvision(provision: Omit<Provision, 'id' | 'company_id' | 'created_at' | 'updated_at'> & { company_id?: string }): Promise<Provision> {
  const payload = {
    ...provision,
    status: 'LANÇADA',
  }

  const { data, error } = await supabase
    .from('provision')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data as Provision
}

export async function reverseProvision(id: string): Promise<Provision> {
  const { data, error } = await supabase
    .from('provision')
    .update({ status: 'ESTORNADA' })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Provision
}

export async function generateMonthlyProvisionsForContractors(): Promise<void> {
  const { data: employees, error: employeesError } = await supabase
    .from('employee')
    .select('*')
    .eq('contract_type', 'CONTRACTOR')
    .eq('is_active', true)

  if (employeesError) throw employeesError

  for (const employee of employees || []) {
    if (employee.contract_value) {
      await createProvision({
        employee_id: employee.id,
        company_id: employee.company_id,
        provision_date: new Date().toISOString().split('T')[0],
        amount: employee.contract_value,
        currency: employee.contract_currency || 'USD',
        description: `Monthly provision for contractor ${employee.first_name} ${employee.last_name}`,
      })
    }
  }
}
