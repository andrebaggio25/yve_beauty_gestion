'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PhoneInput } from '@/components/PhoneInput'
import { TaxIdInput } from '@/components/TaxIdInput'
import type { CreateEmployeeInput, UpdateEmployeeInput, Employee } from '@/types/employee'

const EmployeeSchema = z.object({
  first_name: z.string().min(2, 'Primeiro nome obrigatório'),
  last_name: z.string().min(2, 'Sobrenome obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional().nullable(),
  country_code: z.string().min(2, 'País é obrigatório'),
  state_code: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  tax_id: z.string().optional().nullable(),
  tax_id_type: z.enum(['EIN', 'VAT', 'NIF', 'CNPJ', 'OTHER']).optional(),
  contract_type: z.enum(['FIXED', 'TEMPORARY', 'INTERN', 'CONTRACTOR']),
  contract_value: z.number().optional().nullable(),
  contract_currency: z.string().optional(),
  payment_day: z.number().min(1).max(31).optional().nullable(),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
  can_view_all_data: z.boolean().optional(),
})

type EmployeeFormValues = z.infer<typeof EmployeeSchema>

interface EmployeeFormProps {
  defaultValues?: Partial<Employee>
  onSubmit: (values: EmployeeFormValues) => Promise<void>
  disabled?: boolean
}

const CONTRACT_TYPES = [
  { value: 'FIXED', label: 'Fixo' },
  { value: 'TEMPORARY', label: 'Temporário' },
  { value: 'INTERN', label: 'Estagiário' },
  { value: 'CONTRACTOR', label: 'Terceiro' },
]

export function EmployeeForm({ defaultValues, onSubmit, disabled = false }: EmployeeFormProps) {
  const [countryCode, setCountryCode] = useState(defaultValues?.country_code || 'BR')
  const [taxIdType, setTaxIdType] = useState<'EIN' | 'VAT' | 'NIF' | 'CNPJ' | 'OTHER'>(defaultValues?.tax_id_type || 'OTHER')
  const [contractType, setContractType] = useState(defaultValues?.contract_type || 'FIXED')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(EmployeeSchema),
    defaultValues: {
      first_name: defaultValues?.first_name || '',
      last_name: defaultValues?.last_name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      country_code: defaultValues?.country_code || 'BR',
      state_code: defaultValues?.state_code || '',
      city: defaultValues?.city || '',
      address: defaultValues?.address || '',
      postal_code: defaultValues?.postal_code || '',
      tax_id: defaultValues?.tax_id || '',
      tax_id_type: defaultValues?.tax_id_type || 'OTHER',
      contract_type: (defaultValues?.contract_type as any) || 'FIXED',
      contract_value: defaultValues?.contract_value || undefined,
      contract_currency: defaultValues?.contract_currency || 'USD',
      payment_day: defaultValues?.payment_day || undefined,
      start_date: defaultValues?.start_date || '',
      end_date: defaultValues?.end_date || '',
      can_view_all_data: defaultValues?.can_view_all_data || false,
    },
  })

  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (name === 'country_code' && values.country_code) {
        setCountryCode(values.country_code)
      }
      if (name === 'contract_type' && values.contract_type) {
        setContractType(values.contract_type as any)
      }
    })
    return () => sub.unsubscribe()
  }, [watch])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Primeiro Nome</label>
          <input
            {...register('first_name')}
            placeholder="João"
            disabled={disabled || isSubmitting}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
              errors.first_name ? 'border-red-600 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
            }`}
          />
          {errors.first_name && <p className="text-red-400 text-sm mt-1">{errors.first_name.message}</p>}
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Sobrenome</label>
          <input
            {...register('last_name')}
            placeholder="Silva"
            disabled={disabled || isSubmitting}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
              errors.last_name ? 'border-red-600 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
            }`}
          />
          {errors.last_name && <p className="text-red-400 text-sm mt-1">{errors.last_name.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-slate-300 text-sm font-medium mb-2">E-mail</label>
          <input
            type="email"
            {...register('email')}
            placeholder="joao@empresa.com"
            disabled={disabled || isSubmitting}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
              errors.email ? 'border-red-600 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
            }`}
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Tipo de Contrato</label>
          <select
            {...register('contract_type')}
            disabled={disabled || isSubmitting}
            onChange={(e) => {
              register('contract_type').onChange(e)
              setContractType(e.target.value as any)
            }}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CONTRACT_TYPES.map(ct => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">País</label>
          <select
            {...register('country_code')}
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BR">Brasil</option>
            <option value="US">Estados Unidos</option>
            <option value="ES">Espanha</option>
            <option value="IE">Irlanda</option>
          </select>
        </div>

        <div>
          <PhoneInput
            value={watch('phone') as any}
            onChange={(val) => setValue('phone', val as any)}
            countryCode={countryCode}
            disabled={disabled || isSubmitting}
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Estado</label>
          <input
            {...register('state_code')}
            placeholder="Estado/UF"
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Cidade</label>
          <input
            {...register('city')}
            placeholder="Cidade"
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-slate-300 text-sm font-medium mb-2">Endereço</label>
          <input
            {...register('address')}
            placeholder="Rua, número, complemento"
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">CEP/ZIP</label>
          <input
            {...register('postal_code')}
            placeholder="CEP/ZIP"
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <TaxIdInput
            value={(watch('tax_id') as any) || null}
            onChange={(val) => setValue('tax_id', (val as any) || '')}
            taxIdType={taxIdType}
            onTaxIdTypeChange={(t) => {
              setTaxIdType(t)
              setValue('tax_id_type', t)
            }}
            countryCode={countryCode}
            disabled={disabled || isSubmitting}
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Data de Início</label>
          <input
            type="date"
            {...register('start_date')}
            disabled={disabled || isSubmitting}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white focus:outline-none focus:ring-2 ${
              errors.start_date ? 'border-red-600 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
            }`}
          />
          {errors.start_date && <p className="text-red-400 text-sm mt-1">{errors.start_date.message}</p>}
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Data de Fim</label>
          <input
            type="date"
            {...register('end_date')}
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {contractType === 'CONTRACTOR' && (
          <>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Valor do Contrato</label>
              <input
                type="number"
                step="0.01"
                {...register('contract_value', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={disabled || isSubmitting}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Moeda</label>
              <select
                {...register('contract_currency')}
                disabled={disabled || isSubmitting}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Dia do Pagamento</label>
              <input
                type="number"
                min="1"
                max="31"
                {...register('payment_day', { valueAsNumber: true })}
                placeholder="1"
                disabled={disabled || isSubmitting}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        <div className="md:col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            {...register('can_view_all_data')}
            disabled={disabled || isSubmitting}
            className="w-4 h-4 bg-slate-800 border border-slate-700 rounded"
          />
          <label className="text-slate-300 text-sm">Pode visualizar dados de todos os funcionários</label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
