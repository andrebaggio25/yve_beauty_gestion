import { createClient } from '@/lib/supabase/client'
import type { CreateEmployeeInput, UpdateEmployeeInput, Employee, EmployeeAttachment } from '@/types/employee'

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
  // Get first branch_id from the company
  const { data: branches } = await supabase
    .from('branch')
    .select('id')
    .limit(1)
  
  if (!branches || branches.length === 0) {
    throw new Error('No branch found. Please create a branch first.')
  }

  const payload = {
    branch_id: branches[0].id,
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone ?? null,
    phone_country: input.phone_country ?? 'BR',
    country_code: input.country_code,
    tax_id: input.tax_id ?? null,
    tax_id_type: input.tax_id_type ?? null,
    contract_type: input.contract_type,
    contract_value: input.contract_value ?? null,
    contract_currency: input.contract_currency ?? 'USD',
    payment_day: input.payment_day ?? null,
    start_date: input.start_date,
    end_date: input.end_date ?? null,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('employee')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  const employee = data as Employee

  // Se há valor de contrato, cria as provisões automaticamente
  if (employee.contract_value && employee.contract_value > 0) {
    try {
      await createEmployeeProvisions(
        employee.id,
        employee.start_date,
        employee.end_date,
        employee.contract_value,
        employee.contract_currency || 'USD',
        employee.payment_day || 5
      )
    } catch (provisionError) {
      console.error('Error creating provisions:', provisionError)
      // Não falha a criação do funcionário se as provisões falharem
    }
  }

  return employee
}

export async function updateEmployee(input: UpdateEmployeeInput): Promise<Employee> {
  const { id, ...rest } = input
  
  // Busca o funcionário atual para comparar
  const { data: currentEmployee } = await supabase
    .from('employee')
    .select('*')
    .eq('id', id)
    .single()

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

  const updatedEmployee = data as Employee

  // Se o valor do contrato mudou, as provisões futuras serão atualizadas automaticamente pelo trigger
  // Mas se não havia provisões antes e agora há um valor, cria as provisões
  if (
    updatedEmployee.contract_value && 
    updatedEmployee.contract_value > 0 &&
    (!currentEmployee?.contract_value || currentEmployee.contract_value === 0)
  ) {
    try {
      await createEmployeeProvisions(
        updatedEmployee.id,
        updatedEmployee.start_date,
        updatedEmployee.end_date,
        updatedEmployee.contract_value,
        updatedEmployee.contract_currency || 'USD',
        updatedEmployee.payment_day || 5
      )
    } catch (provisionError) {
      console.error('Error creating provisions:', provisionError)
    }
  }

  return updatedEmployee
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

/**
 * Cria provisões mensais para um funcionário
 * Usa a função do banco de dados para garantir consistência
 */
export async function createEmployeeProvisions(
  employeeId: string,
  startDate: string,
  endDate: string | null,
  contractValue: number,
  currencyCode: string,
  paymentDay: number
): Promise<number> {
  const { data, error } = await supabase.rpc('create_employee_provisions', {
    p_employee_id: employeeId,
    p_start_date: startDate,
    p_end_date: endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    p_contract_value: contractValue,
    p_currency_code: currencyCode,
    p_payment_day: paymentDay,
  })

  if (error) throw error
  return data || 0
}

/**
 * Atualiza provisões futuras quando o valor do contrato muda
 * Chamado automaticamente pelo trigger, mas pode ser chamado manualmente
 */
export async function updateFutureProvisions(
  employeeId: string,
  newContractValue: number,
  currencyCode: string,
  effectiveDate: string
): Promise<number> {
  const { data, error } = await supabase.rpc('update_future_provisions', {
    p_employee_id: employeeId,
    p_new_contract_value: newContractValue,
    p_currency_code: currencyCode,
    p_effective_date: effectiveDate,
  })

  if (error) throw error
  return data || 0
}

/**
 * Lista provisões de um funcionário
 */
export async function listEmployeeProvisions(employeeId: string) {
  const { data, error } = await supabase
    .from('provision')
    .select('*')
    .eq('employee_id', employeeId)
    .order('month_ref', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtém resumo de provisões de um funcionário
 */
export async function getEmployeeProvisionsSummary(employeeId: string) {
  const { data, error } = await supabase
    .from('employee_provisions_summary')
    .select('*')
    .eq('employee_id', employeeId)
    .single()

  if (error) throw error
  return data
}

/**
 * Deleta provisões futuras de um funcionário
 */
export async function deleteFutureProvisions(
  employeeId: string,
  fromDate: string
): Promise<number> {
  const { data, error } = await supabase.rpc('delete_future_provisions', {
    p_employee_id: employeeId,
    p_from_date: fromDate,
  })

  if (error) throw error
  return data || 0
}
