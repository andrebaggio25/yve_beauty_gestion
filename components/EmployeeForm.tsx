'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PhoneInputWithCountry } from '@/components/PhoneInputWithCountry'
import { COUNTRIES } from '@/lib/utils/countries'
import { getTaxIdTypesByCountry } from '@/lib/utils/tax-id-types'
import type { CreateEmployeeInput, UpdateEmployeeInput, Employee } from '@/types/employee'

const EmployeeSchema = z.object({
  first_name: z.string().min(2, 'Primeiro nome obrigatório'),
  last_name: z.string().min(2, 'Sobrenome obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional().nullable(),
  phone_country: z.string().optional(),
  country_code: z.string().min(2, 'País é obrigatório'),
  tax_id: z.string().optional().nullable(),
  tax_id_type: z.string().optional(),
  contract_type: z.enum(['fixed', 'temporary', 'intern', 'contractor']),
  contract_value: z.number().optional().nullable(),
  contract_currency: z.string().optional(),
  payment_day: z.number().min(1).max(31).optional().nullable(),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
})

type EmployeeFormValues = z.infer<typeof EmployeeSchema>

interface EmployeeFormProps {
  defaultValues?: Partial<Employee>
  onSubmit: (values: EmployeeFormValues) => Promise<void>
  disabled?: boolean
}

const CONTRACT_TYPES = [
  { value: 'fixed', label: 'Fixo', description: 'Contrato por tempo indeterminado' },
  { value: 'temporary', label: 'Temporário', description: 'Contrato por tempo determinado' },
  { value: 'intern', label: 'Estagiário', description: 'Contrato de estágio' },
  { value: 'contractor', label: 'Terceiro', description: 'Prestador de serviços' },
]

export function EmployeeForm({ defaultValues, onSubmit, disabled = false }: EmployeeFormProps) {
  const [countryCode, setCountryCode] = useState(defaultValues?.country_code || 'BR')
  const [phoneCountry, setPhoneCountry] = useState(defaultValues?.phone_country || 'BR')
  const [contractType, setContractType] = useState(defaultValues?.contract_type || 'fixed')
  const [taxIdType, setTaxIdType] = useState(defaultValues?.tax_id_type || '')

  // Obtém os tipos de identificação fiscal disponíveis para o país selecionado
  const availableTaxIdTypes = getTaxIdTypesByCountry(countryCode)

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
      phone_country: defaultValues?.phone_country || 'BR',
      country_code: defaultValues?.country_code || 'BR',
      tax_id: defaultValues?.tax_id || '',
      tax_id_type: defaultValues?.tax_id_type || '',
      contract_type: (defaultValues?.contract_type as any) || 'fixed',
      contract_value: defaultValues?.contract_value || undefined,
      contract_currency: defaultValues?.contract_currency || 'USD',
      payment_day: defaultValues?.payment_day || undefined,
      start_date: defaultValues?.start_date || '',
      end_date: defaultValues?.end_date || '',
    },
  })

  // Atualiza os tipos de tax_id quando o país muda
  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (name === 'country_code' && values.country_code) {
        setCountryCode(values.country_code)
        
        // Reseta o tax_id_type quando o país muda
        const newTaxIdTypes = getTaxIdTypesByCountry(values.country_code)
        if (newTaxIdTypes.length > 0) {
          const firstType = newTaxIdTypes[0].value
          setTaxIdType(firstType)
          setValue('tax_id_type', firstType)
        }
      }
      if (name === 'contract_type' && values.contract_type) {
        setContractType(values.contract_type as any)
      }
    })
    return () => sub.unsubscribe()
  }, [watch, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações Pessoais */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Primeiro Nome <span className="text-red-500">*</span>
            </label>
            <input
              {...register('first_name')}
              placeholder="João"
              disabled={disabled || isSubmitting}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                errors.first_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.first_name && <p className="text-red-600 text-sm mt-1">{errors.first_name.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Sobrenome <span className="text-red-500">*</span>
            </label>
            <input
              {...register('last_name')}
              placeholder="Silva"
              disabled={disabled || isSubmitting}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                errors.last_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.last_name && <p className="text-red-600 text-sm mt-1">{errors.last_name.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="joao.silva@email.com"
              disabled={disabled || isSubmitting}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              País <span className="text-red-500">*</span>
            </label>
            <select
              {...register('country_code')}
              disabled={disabled || isSubmitting}
              className={`w-full px-4 py-2 bg-white border rounded-lg text-gray-900 focus:outline-none focus:ring-2 ${
                errors.country_code ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
            {errors.country_code && <p className="text-red-600 text-sm mt-1">{errors.country_code.message}</p>}
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
              💡 A fatura pode ser emitida tanto para pessoa física quanto jurídica
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

      {/* Informações Contratuais */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Contratuais</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Tipo de Contrato <span className="text-red-500">*</span>
            </label>
            <select
              {...register('contract_type')}
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CONTRACT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Data de Início <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('start_date')}
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Data de Fim (opcional)
            </label>
            <input
              type="date"
              {...register('end_date')}
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Dia de Pagamento (1-31)
            </label>
            <input
              type="number"
              {...register('payment_day', { valueAsNumber: true })}
              min="1"
              max="31"
              placeholder="Ex: 5"
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              Dia do mês em que o pagamento deve ser realizado
            </p>
          </div>
        </div>
      </div>

      {/* Valores e Provisões */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Valores e Provisões</h3>
        <p className="text-gray-600 text-sm mb-4">
          💡 Configure o valor do contrato para gerar provisões automáticas mensais
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Valor do Contrato Mensal
            </label>
            <input
              type="number"
              {...register('contract_value', { valueAsNumber: true })}
              step="0.01"
              placeholder="Ex: 5000.00"
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              Disponível para todos os tipos de contrato
            </p>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Moeda do Contrato
            </label>
            <select
              {...register('contract_currency')}
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD - Dólar Americano</option>
              <option value="BRL">BRL - Real Brasileiro</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - Libra Esterlina</option>
              <option value="ARS">ARS - Peso Argentino</option>
              <option value="CLP">CLP - Peso Chileno</option>
              <option value="COP">COP - Peso Colombiano</option>
              <option value="MXN">MXN - Peso Mexicano</option>
            </select>
          </div>
        </div>

        {watch('contract_value') && watch('contract_value')! > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>📊 Provisões Automáticas:</strong> Ao salvar, serão criadas provisões mensais de{' '}
              <strong>{watch('contract_currency')} {watch('contract_value')?.toFixed(2)}</strong> a partir da data de início.
            </p>
            <p className="text-blue-700 text-xs mt-2">
              ⚠️ Ao alterar o valor do contrato, todas as provisões futuras (não pagas) serão atualizadas automaticamente.
            </p>
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Funcionário'}
        </button>
      </div>
    </form>
  )
}
