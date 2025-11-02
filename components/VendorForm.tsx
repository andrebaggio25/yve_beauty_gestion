'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PhoneInputWithCountry } from '@/components/PhoneInputWithCountry'
import { MultiEmailInput } from '@/components/MultiEmailInput'
import { COUNTRIES } from '@/lib/utils/countries'
import { getTaxIdTypesByCountry } from '@/lib/utils/tax-id-types'
import type { Vendor } from '@/modules/vendors/service'

const VendorSchema = z.object({
  legal_name: z.string().min(2, 'Nome legal obrigatório'),
  trade_name: z.string().optional(),
  country_code: z.string().min(2, 'País é obrigatório'),
  state_code: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  tax_id: z.string().optional().nullable(),
  tax_id_type: z.string().optional(),
  phone: z.string().optional().nullable(),
  phone_country: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')).nullable(),
  preferred_language: z.enum(['pt-BR', 'es-ES', 'en-US']),
  requires_invoice_pdf: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

type VendorFormValues = z.infer<typeof VendorSchema>

interface VendorFormProps {
  defaultValues?: Partial<Vendor>
  onSubmit: (values: VendorFormValues & { emails: string[] }) => Promise<void>
  disabled?: boolean
}

export function VendorForm({ defaultValues, onSubmit, disabled = false }: VendorFormProps) {
  const [countryCode, setCountryCode] = useState(defaultValues?.country_code || 'BR')
  const [phoneCountry, setPhoneCountry] = useState(defaultValues?.phone_country || 'BR')
  const [taxIdType, setTaxIdType] = useState(defaultValues?.tax_id_type || '')
  const [emails, setEmails] = useState<string[]>(
    defaultValues?.emails && Array.isArray(defaultValues.emails) ? defaultValues.emails : []
  )

  const availableTaxIdTypes = getTaxIdTypesByCountry(countryCode)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<VendorFormValues>({
    resolver: zodResolver(VendorSchema),
    defaultValues: {
      legal_name: defaultValues?.legal_name || '',
      trade_name: defaultValues?.trade_name || '',
      country_code: defaultValues?.country_code || 'BR',
      state_code: defaultValues?.state_code || '',
      city: defaultValues?.city || '',
      address: defaultValues?.address || '',
      postal_code: defaultValues?.postal_code || '',
      tax_id: defaultValues?.tax_id || '',
      tax_id_type: defaultValues?.tax_id_type || '',
      phone: defaultValues?.phone || '',
      phone_country: defaultValues?.phone_country || 'BR',
      website: defaultValues?.website || '',
      preferred_language: (defaultValues?.preferred_language as any) || 'pt-BR',
      requires_invoice_pdf: defaultValues?.requires_invoice_pdf ?? false,
      is_active: defaultValues?.is_active ?? true,
    },
  })

  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (name === 'country_code' && values.country_code) {
        setCountryCode(values.country_code)
        const newTaxIdTypes = getTaxIdTypesByCountry(values.country_code)
        if (newTaxIdTypes.length > 0) {
          const firstType = newTaxIdTypes[0].value
          setTaxIdType(firstType)
          setValue('tax_id_type', firstType)
        }
      }
    })
    return () => sub.unsubscribe()
  }, [watch, setValue])

  const handleFormSubmit = async (data: VendorFormValues) => {
    await onSubmit({
      ...data,
      emails,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Nome Legal <span className="text-red-500">*</span>
            </label>
            <input
              {...register('legal_name')}
              placeholder="Nome legal do fornecedor"
              disabled={disabled || isSubmitting}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                errors.legal_name ? 'border-red-600 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.legal_name && <p className="text-red-400 text-sm mt-1">{errors.legal_name.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Nome Fantasia</label>
            <input
              {...register('trade_name')}
              placeholder="Nome fantasia"
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              País <span className="text-red-500">*</span>
            </label>
            <select
              {...register('country_code')}
              disabled={disabled || isSubmitting}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-gray-900 focus:outline-none focus:ring-2 ${
                errors.country_code ? 'border-red-600 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
            {errors.country_code && <p className="text-red-400 text-sm mt-1">{errors.country_code.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Idioma Preferido <span className="text-red-500">*</span>
            </label>
            <select
              {...register('preferred_language')}
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pt-BR">🇧🇷 Português (Brasil)</option>
              <option value="es-ES">🇪🇸 Español</option>
              <option value="en-US">🇺🇸 English</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_active')}
                disabled={disabled || isSubmitting}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 text-sm">Fornecedor ativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('requires_invoice_pdf')}
                disabled={disabled || isSubmitting}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 text-sm">Requer PDF da fatura</span>
            </label>
          </div>
        </div>
      </div>

      {/* Identificação Fiscal */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Identificação Fiscal</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Tipo de Identificação Fiscal
            </label>
            <select
              {...register('tax_id_type')}
              value={taxIdType}
              onChange={(e) => {
                setTaxIdType(e.target.value)
                setValue('tax_id_type', e.target.value)
              }}
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableTaxIdTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-xs mt-1">
              Os tipos disponíveis mudam conforme o país selecionado
            </p>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Número de Identificação Fiscal
            </label>
            <input
              {...register('tax_id')}
              placeholder={`Ex: ${availableTaxIdTypes[0]?.label || 'Tax ID'}`}
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">Endereço</label>
            <input
              {...register('address')}
              placeholder="Rua, número, complemento"
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Cidade</label>
            <input
              {...register('city')}
              placeholder="Cidade"
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Estado/Província</label>
            <input
              {...register('state_code')}
              placeholder="Estado ou província"
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">CEP/Código Postal</label>
            <input
              {...register('postal_code')}
              placeholder="CEP ou código postal"
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Contato</h3>
        
        <div className="space-y-4">
          <div className="md:col-span-2">
            <MultiEmailInput
              emails={emails}
              onChange={setEmails}
              label="E-mails"
              placeholder="exemplo@email.com"
              disabled={disabled || isSubmitting}
              required={false}
              maxEmails={5}
            />
          </div>

          <div className="md:col-span-2">
            <PhoneInputWithCountry
              value={watch('phone') as any}
              onChange={(val) => {
                setValue('phone', val as any)
              }}
              phoneCountryCode={phoneCountry}
              onPhoneCountryChange={(country) => {
                setPhoneCountry(country)
                setValue('phone_country', country)
              }}
              label="Telefone"
              disabled={disabled || isSubmitting}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Website</label>
            <input
              {...register('website')}
              type="url"
              placeholder="https://www.exemplo.com"
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.website && <p className="text-red-400 text-sm mt-1">{errors.website.message}</p>}
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
        </button>
      </div>
    </form>
  )
}

