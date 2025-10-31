'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'
import { USDConversionDisplay } from '@/components/USDConversionDisplay'

const invoiceLineSchema = z.object({
  service_key: z.string().min(1, 'Chave do serviço é obrigatória'),
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  quantity: z.number().min(1, 'Quantidade mínima é 1'),
  unit_price: z.number().min(0, 'Preço unitário deve ser positivo'),
  discount_percent: z.number().min(0).max(100).default(0),
  tax_percent: z.number().min(0).max(100).default(0),
})

const invoiceSchema = z.object({
  customer_id: z.string().uuid('Selecione um cliente'),
  contract_id: z.string().uuid().optional().or(z.literal('')),
  issue_date: z.string().min(1, 'Data de emissão é obrigatória'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  currency_code: z.string().min(3, 'Selecione uma moeda'),
  items: z.array(invoiceLineSchema).min(1, 'Adicione pelo menos um item'),
  payment_recipient_name: z.string().min(3, 'Nome do beneficiário é obrigatório'),
  payment_iban: z.string().min(10, 'IBAN inválido'),
  payment_bic: z.string().min(8, 'BIC/SWIFT inválido'),
  payment_bank_name: z.string().min(3, 'Nome do banco é obrigatório'),
  payment_bank_address: z.string().min(10, 'Endereço do banco é obrigatório'),
  notes: z.string().optional(),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface Customer {
  id: string
  legal_name: string
  trade_name: string | null
}

interface Contract {
  id: string
  start_date: string
  end_date: string | null
  language: string
}

interface Currency {
  code: string
  name: string
}

interface InvoiceFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
}

export default function InvoiceForm({ onSuccess, onCancel, initialData }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const [contractLanguage, setContractLanguage] = useState('pt-BR')
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData || {
      currency_code: 'BRL',
      items: [
        {
          service_key: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          discount_percent: 0,
          tax_percent: 0,
        },
      ],
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const selectedCustomer = watch('customer_id')
  const selectedContract = watch('contract_id')
  const items = watch('items')
  const currency = watch('currency_code')

  useEffect(() => {
    fetchCustomers()
    fetchCurrencies()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchContracts(selectedCustomer)
    } else {
      setContracts([])
    }
  }, [selectedCustomer])

  useEffect(() => {
    if (selectedContract && contracts.length > 0) {
      const contract = contracts.find((c) => c.id === selectedContract)
      if (contract) {
        setContractLanguage(contract.language)
      }
    }
  }, [selectedContract, contracts])

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

  const fetchContracts = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('contract')
        .select('id, start_date, end_date, language')
        .eq('customer_id', customerId)
        .eq('status', 'ativo')
        .order('start_date', { ascending: false })

      if (error) throw error
      setContracts(data || [])
    } catch (error) {
      console.error('Error fetching contracts:', error)
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

  const calculateLineTotal = (item: any) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0)
    const discount = subtotal * ((item.discount_percent || 0) / 100)
    const afterDiscount = subtotal - discount
    const tax = afterDiscount * ((item.tax_percent || 0) / 100)
    return afterDiscount + tax
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const lineSubtotal = (item.quantity || 0) * (item.unit_price || 0)
      const discount = lineSubtotal * ((item.discount_percent || 0) / 100)
      return sum + (lineSubtotal - discount)
    }, 0)
  }

  const calculateTaxTotal = () => {
    return items.reduce((sum, item) => {
      const lineSubtotal = (item.quantity || 0) * (item.unit_price || 0)
      const discount = lineSubtotal * ((item.discount_percent || 0) / 100)
      const afterDiscount = lineSubtotal - discount
      const tax = afterDiscount * ((item.tax_percent || 0) / 100)
      return sum + tax
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxTotal()
  }

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setLoading(true)

      // Get branch_id from user profile
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { data: profile } = await supabase
        .from('user_profile')
        .select('branch_id')
        .eq('auth_user_id', user.id)
        .single()

      if (!profile?.branch_id) throw new Error('Branch not found')

      const subtotal = calculateSubtotal()
      const taxTotal = calculateTaxTotal()
      const total = calculateTotal()

      // Create invoice
      const invoicePayload = {
        branch_id: profile.branch_id,
        customer_id: data.customer_id,
        contract_id: data.contract_id || null,
        issue_date: data.issue_date,
        due_date: data.due_date,
        currency_code: data.currency_code,
        subtotal,
        tax_total: taxTotal,
        total,
        status: 'draft',
        notes: data.notes || null,
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoice')
        .insert([invoicePayload])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice lines
      const linesPayload = data.items.map((item) => ({
        invoice_id: invoice.id,
        service_key: item.service_key,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: calculateLineTotal(item),
        taxable_us: item.tax_percent > 0,
      }))

      const { error: linesError } = await supabase.from('invoice_line').insert(linesPayload)

      if (linesError) throw linesError

      // Store payment details in company table (if they changed)
      const { error: companyError } = await supabase
        .from('company')
        .update({
          bank_account_holder: data.payment_recipient_name,
          iban: data.payment_iban,
          bic_swift: data.payment_bic,
          bank_name: data.payment_bank_name,
          bank_address: data.payment_bank_address,
        })
        .eq('id', profile.branch_id)

      if (companyError) console.warn('Could not update company payment details:', companyError)

      onSuccess()
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Erro ao salvar fatura')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto px-2">
      {/* Customer & Contract */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Cliente *</label>
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
          {errors.customer_id && <p className="text-red-400 text-sm mt-1">{errors.customer_id.message}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Contrato (Opcional)</label>
          <select
            {...register('contract_id')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedCustomer}
          >
            <option value="">Nenhum contrato</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                Contrato: {new Date(contract.start_date).toLocaleDateString('pt-BR')} -{' '}
                {contract.end_date ? new Date(contract.end_date).toLocaleDateString('pt-BR') : 'Indeterminado'}
              </option>
            ))}
          </select>
          {selectedContract && (
            <p className="text-blue-400 text-xs mt-1">Idioma: {contractLanguage}</p>
          )}
        </div>
      </div>

      {/* Dates & Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Data de Emissão *</label>
          <input
            type="date"
            {...register('issue_date')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.issue_date && <p className="text-red-400 text-sm mt-1">{errors.issue_date.message}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Data de Vencimento *</label>
          <input
            type="date"
            {...register('due_date')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.due_date && <p className="text-red-400 text-sm mt-1">{errors.due_date.message}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Moeda *</label>
          <select
            {...register('currency_code')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione</option>
            {currencies.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} - {curr.name}
              </option>
            ))}
          </select>
          {errors.currency_code && <p className="text-red-400 text-sm mt-1">{errors.currency_code.message}</p>}
        </div>
      </div>

      {/* Invoice Items */}
      <div className="border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg p-4 bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Itens da Fatura</h3>
          <button
            type="button"
            onClick={() =>
              append({
                service_key: '',
                description: '',
                quantity: 1,
                unit_price: 0,
                discount_percent: 0,
                tax_percent: 0,
              })
            }
            className="flex items-center gap-2 text-sm bg-primary hover:bg-primary-hover font-medium text-white px-3 py-1.5 rounded transition-colors"
          >
            <Plus size={16} />
            Adicionar Item
          </button>
        </div>

        {errors.items && <p className="text-red-400 text-sm mb-2">{errors.items.message as string}</p>}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg p-4 bg-slate-800 relative">
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300 p-1"
                  title="Remover item"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">Chave do Serviço *</label>
                  <input
                    {...register(`items.${index}.service_key`)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="ex: SVC001"
                  />
                  {errors.items?.[index]?.service_key && (
                    <p className="text-red-400 text-xs mt-1">{errors.items[index]?.service_key?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">Descrição *</label>
                  <input
                    {...register(`items.${index}.description`)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Descrição do serviço"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-red-400 text-xs mt-1">{errors.items[index]?.description?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">Quantidade *</label>
                  <input
                    type="number"
                    step="1"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-red-400 text-xs mt-1">{errors.items[index]?.quantity?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">Preço Unitário *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.items?.[index]?.unit_price && (
                    <p className="text-red-400 text-xs mt-1">{errors.items[index]?.unit_price?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">Desconto (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.discount_percent`, { valueAsNumber: true })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    defaultValue={0}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-xs font-medium mb-1">Imposto (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.tax_percent`, { valueAsNumber: true })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    defaultValue={0}
                  />
                </div>
              </div>

              <div className="mt-2 text-right">
                <span className="text-slate-400 text-xs">Total da Linha: </span>
                <span className="text-white font-semibold">{formatCurrency(calculateLineTotal(items[index]))}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Summary */}
        <div className="mt-4 pt-4 border-t border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal:</span>
            <span className="text-white font-semibold">{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Impostos:</span>
            <span className="text-white font-semibold">{formatCurrency(calculateTaxTotal())}</span>
          </div>
          <div className="flex justify-between text-lg border-t border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 pt-2">
            <span className="text-white font-bold">Total:</span>
            <span className="text-white font-bold">{formatCurrency(calculateTotal())}</span>
          </div>

          {currency && currency !== 'USD' && (
            <div className="pt-2">
              <USDConversionDisplay amount={calculateTotal()} currency={currency} />
            </div>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div className="border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg p-4 bg-slate-900">
        <h3 className="text-lg font-semibold text-white mb-4">Detalhes de Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">Nome do Beneficiário *</label>
            <input
              {...register('payment_recipient_name')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo"
            />
            {errors.payment_recipient_name && (
              <p className="text-red-400 text-sm mt-1">{errors.payment_recipient_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">IBAN *</label>
            <input
              {...register('payment_iban')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="LT78 3250 0508 8703 0052"
            />
            {errors.payment_iban && <p className="text-red-400 text-sm mt-1">{errors.payment_iban.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">BIC/SWIFT *</label>
            <input
              {...register('payment_bic')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="REVOLT21"
            />
            {errors.payment_bic && <p className="text-red-400 text-sm mt-1">{errors.payment_bic.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Nome do Banco *</label>
            <input
              {...register('payment_bank_name')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Revolut Bank UAB"
            />
            {errors.payment_bank_name && <p className="text-red-400 text-sm mt-1">{errors.payment_bank_name.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Endereço do Banco *</label>
            <input
              {...register('payment_bank_address')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Konstitucijos ave. 21B, Vilnius, Lithuania"
            />
            {errors.payment_bank_address && (
              <p className="text-red-400 text-sm mt-1">{errors.payment_bank_address.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-2">Notas (Opcional)</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Informações adicionais..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 sticky bottom-0 bg-slate-800 p-4 -mx-2">
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
          {loading ? 'Salvando...' : initialData ? 'Atualizar Fatura' : 'Criar Fatura'}
        </button>
      </div>
    </form>
  )
}

