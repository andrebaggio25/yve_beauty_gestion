'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const contractSchema = z.object({
  customer_id: z.string().uuid('Selecione um cliente'),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().optional(),
  billing_model: z.enum(['unique', 'recurring']),
  recognition: z.enum(['competencia', 'vigencia']),
  language: z.string().default('pt-BR'),
  notes: z.string().optional(),
  // Contract Item fields
  service_key: z.string().min(1, 'Serviço é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  currency_code: z.string().min(3, 'Selecione uma moeda'),
  unit_price: z.string().min(1, 'Preço é obrigatório').transform(val => parseFloat(val.replace(/[^\d.-]/g, ''))),
  quantity: z.string().default('1').transform(val => parseFloat(val)),
  recurrence: z.enum(['none', 'monthly', 'quarterly']).default('none'),
})

type ContractFormData = z.infer<typeof contractSchema>

interface Customer {
  id: string
  legal_name: string
  trade_name: string | null
}

interface Currency {
  code: string
  name: string
}

interface ContractFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
}

export default function ContractForm({ onSuccess, onCancel, initialData }: ContractFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: initialData || {
      billing_model: 'recurring',
      recognition: 'competencia',
      language: 'pt-BR',
      currency_code: 'BRL',
      quantity: '1',
      recurrence: 'monthly',
    },
  })

  const billingModel = watch('billing_model')

  useEffect(() => {
    fetchCustomers()
    fetchCurrencies()
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer')
        .select('id, legal_name, trade_name')
        .order('legal_name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
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

  const onSubmit = async (data: ContractFormData) => {
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

      // Create contract
      const contractPayload = {
        branch_id: profile.branch_id,
        customer_id: data.customer_id,
        start_date: data.start_date,
        end_date: data.end_date || null,
        billing_model: data.billing_model,
        recognition: data.recognition,
        status: 'ativo',
        language: data.language,
        notes: data.notes || null,
      }

      if (initialData?.id) {
        // Update existing contract
        const { error: contractError } = await supabase
          .from('contract')
          .update(contractPayload)
          .eq('id', initialData.id)

        if (contractError) throw contractError
      } else {
        // Create new contract
        const { data: newContract, error: contractError } = await supabase
          .from('contract')
          .insert(contractPayload)
          .select()
          .single()

        if (contractError) throw contractError

        // Create contract item
        const itemPayload = {
          contract_id: newContract.id,
          service_key: data.service_key,
          description: data.description,
          currency_code: data.currency_code,
          unit_price: data.unit_price,
          quantity: data.quantity,
          recurrence: data.recurrence,
        }

        const { error: itemError } = await supabase
          .from('contract_item')
          .insert(itemPayload)

        if (itemError) throw itemError
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving contract:', error)
      alert('Erro ao salvar contrato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contract Information */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Informações do Contrato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Cliente *
            </label>
            <select
              {...register('customer_id')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.trade_name || customer.legal_name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-red-400 text-sm mt-1">{errors.customer_id.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Data de Início *
            </label>
            <input
              type="date"
              {...register('start_date')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.start_date && (
              <p className="text-red-400 text-sm mt-1">{errors.start_date.message}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Data de Término
            </label>
            <input
              type="date"
              {...register('end_date')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-slate-500 text-xs mt-1">Deixe em branco para contrato indeterminado</p>
          </div>

          {/* Billing Model */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Modelo de Faturamento *
            </label>
            <select
              {...register('billing_model')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="unique">Único</option>
              <option value="recurring">Recorrente</option>
            </select>
          </div>

          {/* Recognition */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Reconhecimento *
            </label>
            <select
              {...register('recognition')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="competencia">Competência</option>
              <option value="vigencia">Vigência</option>
            </select>
          </div>

          {/* Language */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Idioma
            </label>
            <select
              {...register('language')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pt-BR">Português (BR)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español (ES)</option>
            </select>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Observações
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observações adicionais..."
            />
          </div>
        </div>
      </div>

      {/* Contract Item (Service) */}
      {!initialData && (
        <div className="border-t border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Item do Contrato</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Key */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Código do Serviço *
              </label>
              <input
                type="text"
                {...register('service_key')}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SRV-001"
              />
              {errors.service_key && (
                <p className="text-red-400 text-sm mt-1">{errors.service_key.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Descrição *
              </label>
              <input
                type="text"
                {...register('description')}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição do serviço"
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Preço Unitário *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('unit_price')}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              {errors.unit_price && (
                <p className="text-red-400 text-sm mt-1">{errors.unit_price.message}</p>
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
                    {currency.code}
                  </option>
                ))}
              </select>
              {errors.currency_code && (
                <p className="text-red-400 text-sm mt-1">{errors.currency_code.message}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Quantidade
              </label>
              <input
                type="number"
                step="0.01"
                {...register('quantity')}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>

            {/* Recurrence */}
            {billingModel === 'recurring' && (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Recorrência
                </label>
                <select
                  {...register('recurrence')}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Única</option>
                  <option value="monthly">Mensal</option>
                  <option value="quarterly">Trimestral</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

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
          {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar Contrato'}
        </button>
      </div>
    </form>
  )
}

