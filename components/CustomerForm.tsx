'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PhoneInput } from '@/components/PhoneInput'
import { TaxIdInput } from '@/components/TaxIdInput'
import type { CreateCustomerInput, UpdateCustomerInput, Customer } from '@/types/customer'

const CustomerSchema = z.object({
  legal_name: z.string().min(2, 'Nome legal obrigatório'),
  trade_name: z.string().optional(),
  country_code: z.string().min(2, 'País é obrigatório'),
  state_code: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  tax_id: z.string().optional().nullable(),
  tax_id_type: z.enum(['EIN', 'VAT', 'NIF', 'CNPJ', 'OTHER']).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')).nullable(),
  website: z.string().url('URL inválida').optional().or(z.literal('')).nullable(),
  preferred_language: z.enum(['pt-BR', 'es-ES', 'en-US']),
})

type CustomerFormValues = z.infer<typeof CustomerSchema>

interface CustomerFormProps {
  defaultValues?: Partial<Customer>
  onSubmit: (values: CustomerFormValues) => Promise<void>
  disabled?: boolean
}

export function CustomerForm({ defaultValues, onSubmit, disabled = false }: CustomerFormProps) {
  const [countryCode, setCountryCode] = useState(defaultValues?.country_code || 'BR')
  const [taxIdType, setTaxIdType] = useState<'EIN' | 'VAT' | 'NIF' | 'CNPJ' | 'OTHER'>(defaultValues?.tax_id_type || 'OTHER')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      legal_name: defaultValues?.legal_name || '',
      trade_name: defaultValues?.trade_name || '',
      country_code: defaultValues?.country_code || 'BR',
      state_code: defaultValues?.state_code || '',
      city: defaultValues?.city || '',
      address: defaultValues?.address || '',
      postal_code: defaultValues?.postal_code || '',
      tax_id: defaultValues?.tax_id || '',
      tax_id_type: defaultValues?.tax_id_type || 'OTHER',
      phone: defaultValues?.phone || '',
      email: defaultValues?.email || '',
      website: defaultValues?.website || '',
      preferred_language: (defaultValues?.preferred_language as any) || 'pt-BR',
    },
  })

  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (name === 'country_code' && values.country_code) {
        setCountryCode(values.country_code)
      }
    })
    return () => sub.unsubscribe()
  }, [watch])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Nome Legal</label>
          <input
            {...register('legal_name')}
            placeholder="Nome legal"
            disabled={disabled || isSubmitting}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
              errors.legal_name ? 'border-red-600 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
            }`}
          />
          {errors.legal_name && <p className="text-red-400 text-sm mt-1">{errors.legal_name.message}</p>}
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Nome Fantasia</label>
          <input
            {...register('trade_name')}
            placeholder="Nome fantasia"
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <label className="block text-slate-300 text-sm font-medium mb-2">Idioma Preferencial</label>
          <select
            {...register('preferred_language')}
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="es-ES">Español</option>
            <option value="en-US">English (US)</option>
          </select>
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

        <div>
          <PhoneInput
            value={watch('phone') as any}
            onChange={(val) => setValue('phone', val as any)}
            countryCode={countryCode}
            disabled={disabled || isSubmitting}
          />
        </div>

        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">E-mail</label>
          <input
            type="email"
            {...register('email')}
            placeholder="email@cliente.com"
            disabled={disabled || isSubmitting}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
              errors.email ? 'border-red-600 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
            }`}
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
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

        <div className="md:col-span-2">
          <label className="block text-slate-300 text-sm font-medium mb-2">Website</label>
          <input
            {...register('website')}
            placeholder="https://empresa.com"
            disabled={disabled || isSubmitting}
            className={`w-full px-4 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
              errors.website ? 'border-red-600 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
            }`}
          />
          {errors.website && <p className="text-red-400 text-sm mt-1">{errors.website.message}</p>}
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
