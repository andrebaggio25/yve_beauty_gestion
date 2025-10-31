'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Upload } from 'lucide-react'
import { USDConversionDisplay } from '@/components/USDConversionDisplay'

const accountPayableSchema = z.object({
  vendor_id: z.string().uuid('Selecione um fornecedor'),
  currency_code: z.string().min(3, 'Selecione uma moeda'),
  amount: z.string().min(1, 'Valor é obrigatório').transform(val => parseFloat(val.replace(/[^\d.-]/g, ''))),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  description: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
  document_pdf_url: z.string().url('URL do documento é obrigatória').optional().or(z.literal('')),
  recurrence: z.enum(['none', 'monthly', 'quarterly']).default('none'),
  recurrence_end_date: z.string().optional(),
  installments: z.string().optional(),
})

type AccountPayableFormData = z.infer<typeof accountPayableSchema>

interface Vendor {
  id: string
  legal_name: string
}

interface Currency {
  code: string
  name: string
}

interface AccountPayableFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
}

export default function AccountPayableForm({ onSuccess, onCancel, initialData }: AccountPayableFormProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AccountPayableFormData>({
    resolver: zodResolver(accountPayableSchema),
    defaultValues: initialData || {
      recurrence: 'none',
      currency_code: 'BRL',
    },
  })

  const recurrence = watch('recurrence')

  useEffect(() => {
    fetchVendors()
    fetchCurrencies()
  }, [])

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor')
        .select('id, legal_name')
        .order('legal_name')

      if (error) throw error
      setVendors(data || [])
    } catch (error) {
      console.error('Error fetching vendors:', error)
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione apenas arquivos PDF')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 10MB')
      return
    }

    try {
      setUploadingFile(true)
      const fileExt = 'pdf'
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `accounts-payable/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      setValue('document_pdf_url', publicUrl)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Erro ao fazer upload do arquivo')
    } finally {
      setUploadingFile(false)
    }
  }

  const onSubmit = async (data: AccountPayableFormData) => {
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
        vendor_id: data.vendor_id,
        currency_code: data.currency_code,
        amount: data.amount,
        due_date: data.due_date,
        description: data.description,
        document_pdf_url: data.document_pdf_url || '',
        recurrence: data.recurrence,
        recurrence_end_date: data.recurrence_end_date || null,
        installments: data.installments ? JSON.parse(data.installments) : null,
        status: 'open',
      }

      if (initialData?.id) {
        const { error } = await supabase
          .from('accounts_payable')
          .update(payload)
          .eq('id', initialData.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('accounts_payable')
          .insert(payload)

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving account payable:', error)
      alert('Erro ao salvar conta a pagar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vendor */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Fornecedor *
          </label>
          <select
            {...register('vendor_id')}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um fornecedor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.legal_name}
              </option>
            ))}
          </select>
          {errors.vendor_id && (
            <p className="text-red-400 text-sm mt-1">{errors.vendor_id.message}</p>
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
            placeholder="Descreva a conta a pagar..."
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
        <div>
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

        {/* Recurrence */}
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

        {/* Recurrence End Date */}
        {recurrence !== 'none' && (
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Data Final da Recorrência
            </label>
            <input
              type="date"
              {...register('recurrence_end_date')}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Document Upload */}
        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Documento PDF
          </label>
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors">
              <Upload size={20} />
              <span>{uploadingFile ? 'Enviando...' : 'Selecionar PDF'}</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingFile}
              />
            </label>
          </div>
          {watch('document_pdf_url') && (
            <p className="text-green-400 text-sm mt-2">✓ Documento anexado</p>
          )}
          {errors.document_pdf_url && (
            <p className="text-red-400 text-sm mt-1">{errors.document_pdf_url.message}</p>
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
          disabled={loading || uploadingFile}
          className="px-4 py-2 bg-primary hover:bg-primary-hover font-medium disabled:bg-slate-700 text-white rounded-lg transition-colors"
        >
          {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

