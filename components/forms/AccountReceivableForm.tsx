'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { USDConversionDisplay } from '@/components/USDConversionDisplay'

const accountReceivableSchema = z.object({
  customer_id: z.string().uuid('Selecione um cliente'),
  invoice_id: z.string().uuid('Selecione uma fatura'),
  currency_code: z.string().min(3, 'Selecione uma moeda'),
  amount: z.string().min(1, 'Valor é obrigatório').transform(val => parseFloat(val.replace(/[^\d.-]/g, ''))),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  description: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
})

type AccountReceivableFormData = z.infer<typeof accountReceivableSchema>

interface Customer {
  id: string
  legal_name: string
  trade_name: string | null
}

interface Invoice {
  id: string
  number: string
  total: number
}

interface Currency {
  code: string
  name: string
}

interface AccountReceivableFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
}

export default function AccountReceivableForm({ onSuccess, onCancel, initialData }: AccountReceivableFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AccountReceivableFormData>({
    resolver: zodResolver(accountReceivableSchema),
    defaultValues: initialData || {
      currency_code: 'BRL',
    },
  })

  const selectedCustomer = watch('customer_id')
  const selectedInvoice = watch('invoice_id')

  useEffect(() => {
    fetchCustomers()
    fetchCurrencies()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchInvoices(selectedCustomer)
    } else {
      setInvoices([])
    }
  }, [selectedCustomer])

  useEffect(() => {
    if (selectedInvoice && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === selectedInvoice)
      if (invoice) {
        setValue('amount', invoice.total.toString())
      }
    }
  }, [selectedInvoice, invoices])

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

  const fetchInvoices = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('invoice')
        .select('id, number, total')
        .eq('customer_id', customerId)
        .in('status', ['issued', 'sent'])
        .order('issue_date', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching invoices:', error)
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

  const onSubmit = async (data: AccountReceivableFormData) => {
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
        customer_id: data.customer_id,
        invoice_id: data.invoice_id,
        currency_code: data.currency_code,
        amount: data.amount,
        due_date: data.due_date,
        description: data.description,
        status: 'open',
      }

      if (initialData?.id) {
        const { error } = await supabase
          .from('accounts_receivable')
          .update(payload)
          .eq('id', initialData.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('accounts_receivable')
          .insert(payload)

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving account receivable:', error)
      alert('Erro ao salvar conta a receber')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

        {/* Invoice */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Fatura *
          </label>
          <select
            {...register('invoice_id')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedCustomer}
          >
            <option value="">
              {selectedCustomer ? 'Selecione uma fatura' : 'Selecione um cliente primeiro'}
            </option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.number} - {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(invoice.total)}
              </option>
            ))}
          </select>
          {errors.invoice_id && (
            <p className="text-red-400 text-sm mt-1">{errors.invoice_id.message}</p>
          )}
          {selectedCustomer && invoices.length === 0 && (
            <p className="text-yellow-400 text-sm mt-1">Nenhuma fatura disponível para este cliente</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Descrição *
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descreva a conta a receber..."
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
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-gray-900 focus:outline-none"
          >
            <option value="">Selecione a moeda</option>
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
          {errors.currency_code && (
            <p className="text-red-600 text-sm mt-1">{errors.currency_code.message}</p>
          )}
        </div>

        {/* USD Conversion Display */}
        {watch('amount') && watch('currency_code') && (
          <div className="md:col-span-2">
            <USDConversionDisplay 
              amount={parseFloat(watch('amount') as unknown as string) || 0} 
              currency={watch('currency_code')} 
            />
          </div>
        )}

        {/* Due Date */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Data de Vencimento *
          </label>
          <input
            type="date"
            {...register('due_date')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.due_date && (
            <p className="text-red-400 text-sm mt-1">{errors.due_date.message}</p>
          )}
        </div>
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

