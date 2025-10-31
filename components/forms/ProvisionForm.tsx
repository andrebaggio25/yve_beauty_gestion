'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const provisionSchema = z.object({
  employee_id: z.string().uuid('Selecione um funcionário').optional(),
  reference_type: z.string().min(1, 'Tipo de referência é obrigatório'),
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  currency_code: z.string().min(3, 'Selecione uma moeda'),
  amount: z.string().min(1, 'Valor é obrigatório').transform(val => parseFloat(val.replace(/[^\d.-]/g, ''))),
  month_ref: z.string().min(1, 'Mês de referência é obrigatório'),
})

type ProvisionFormData = z.infer<typeof provisionSchema>

interface Employee {
  id: string
  first_name: string
  last_name: string
  contract_type: string
}

interface Currency {
  code: string
  name: string
}

interface ProvisionFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
}

export default function ProvisionForm({ onSuccess, onCancel, initialData }: ProvisionFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProvisionFormData>({
    resolver: zodResolver(provisionSchema),
    defaultValues: initialData || {
      currency_code: 'BRL',
      reference_type: 'employee',
      month_ref: new Date().toISOString().slice(0, 7),
    },
  })

  const referenceType = watch('reference_type')

  useEffect(() => {
    fetchEmployees()
    fetchCurrencies()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee')
        .select('id, first_name, last_name, contract_type')
        .eq('is_active', true)
        .order('first_name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('currency')
        .select('code, name')
        .order('code')

      if (error) throw error
      setCurrencies(data || [])
    } catch (error) {
      console.error('Error fetching currencies:', error)
    }
  }

  const onSubmit = async (data: ProvisionFormData) => {
    try {
      setLoading(true)

      // Get branch_id from user profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { data: profile } = await supabase
        .from('user_profile')
        .select('branch_id')
        .eq('auth_user_id', user.id)
        .single()

      if (!profile?.branch_id) throw new Error('Branch not found')

      const payload = {
        branch_id: profile.branch_id,
        reference_type: data.reference_type,
        description: data.description,
        currency_code: data.currency_code,
        amount: data.amount,
        month_ref: data.month_ref + '-01', // Add day to make it a valid date
        status: 'booked',
      }

      if (initialData?.id) {
        const { error } = await supabase
          .from('provision')
          .update(payload)
          .eq('id', initialData.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('provision')
          .insert(payload)

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving provision:', error)
      alert('Erro ao salvar provisão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reference Type */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Tipo de Referência *
          </label>
          <select
            {...register('reference_type')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="employee">Funcionário (Terceiro)</option>
            <option value="contract">Contrato</option>
            <option value="other">Outro</option>
          </select>
          {errors.reference_type && (
            <p className="text-red-400 text-sm mt-1">{errors.reference_type.message}</p>
          )}
        </div>

        {/* Employee (if reference_type is employee) */}
        {referenceType === 'employee' && (
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Funcionário
            </label>
            <select
              {...register('employee_id')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um funcionário (opcional)</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} ({employee.contract_type})
                </option>
              ))}
            </select>
            {errors.employee_id && (
              <p className="text-red-400 text-sm mt-1">{errors.employee_id.message}</p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Descrição *
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descreva a provisão..."
          />
          {errors.description && (
            <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Valor *
          </label>
          <input
            type="number"
            step="0.01"
            {...register('amount')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Moeda *
          </label>
          <select
            {...register('currency_code')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione</option>
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
          {errors.currency_code && (
            <p className="text-red-400 text-sm mt-1">{errors.currency_code.message}</p>
          )}
        </div>

        {/* Month Reference */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Mês de Referência *
          </label>
          <input
            type="month"
            {...register('month_ref')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.month_ref && (
            <p className="text-red-400 text-sm mt-1">{errors.month_ref.message}</p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          💡 <strong>Dica:</strong> Provisões são lançamentos contábeis para reconhecer despesas futuras.
          Use para terceiros, férias, 13º salário e outras obrigações.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary hover:bg-primary-hover font-medium disabled:bg-slate-700 text-white rounded-lg transition-colors"
        >
          {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

