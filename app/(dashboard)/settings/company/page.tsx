'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Save, Upload, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PhoneInputWithCountry } from '@/components/PhoneInputWithCountry'
import { TaxIdInput } from '@/components/TaxIdInput'
import { COUNTRIES } from '@/lib/utils/countries'

const companySchema = z.object({
  legal_name: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  trade_name: z.string().min(3, 'Nome fantasia deve ter no mínimo 3 caracteres'),
  tax_id: z.string().optional().nullable(),
  tax_id_type: z.enum(['EIN', 'VAT', 'NIF', 'CNPJ', 'OTHER']).optional(),
  country_code: z.string().min(2, 'País deve ser selecionado'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional().nullable(),
  phone_country: z.string().optional(),
  website: z.string().url('Website inválido').optional().or(z.literal('')),
  address_line1: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'Cidade deve ter no mínimo 2 caracteres'),
  state: z.string().min(2, 'Estado deve ter no mínimo 2 caracteres'),
  postal_code: z.string().min(5, 'CEP inválido'),
})

type CompanyFormData = z.infer<typeof companySchema>

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<string>('BR')
  const [taxIdType, setTaxIdType] = useState<'EIN' | 'VAT' | 'NIF' | 'CNPJ' | 'OTHER'>('CNPJ')
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  })

  useEffect(() => {
    fetchCompanyData()
  }, [])

  // Atualizar tax_id_type quando country_code muda
  const countryCode = watch('country_code')
  useEffect(() => {
    if (countryCode) {
      const types: Record<string, 'EIN' | 'VAT' | 'NIF' | 'CNPJ' | 'OTHER'> = {
        'US': 'EIN',
        'BR': 'CNPJ',
        'ES': 'VAT',
        'IE': 'VAT',
      }
      const defaultType = types[countryCode] || 'OTHER'
      if (taxIdType !== defaultType) {
        setTaxIdType(defaultType)
        setValue('tax_id_type', defaultType)
      }
    }
  }, [countryCode, taxIdType, setValue])

  const fetchCompanyData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

      if (data) {
        setCompanyId(data.id)
        setLogoUrl(data.logo_url)
        const countryCode = data.country_code || 'BR'
        setPhoneCountry(data.phone_country || countryCode)
        setTaxIdType((data.tax_id_type as any) || 'CNPJ')
        reset({
          legal_name: data.legal_name || data.name || '',
          trade_name: data.trade_name || '',
          tax_id: data.ein || data.tax_id || '',
          tax_id_type: (data.tax_id_type as any) || 'CNPJ',
          country_code: countryCode,
          email: data.email || '',
          phone: data.phone || '',
          phone_country: data.phone_country || countryCode,
          website: data.website || '',
          address_line1: data.address_line1 || '',
          address_line2: data.address_line2 || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
        })
      }
    } catch (error) {
      console.error('Error fetching company data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setSaving(true)

      const updateData = {
        name: data.legal_name, // Campo legado
        legal_name: data.legal_name, // Campo novo
        trade_name: data.trade_name,
        ein: data.tax_id, // Campo legado
        tax_id: data.tax_id,
        tax_id_type: data.tax_id_type || taxIdType,
        country_code: data.country_code,
        email: data.email,
        phone: data.phone,
        phone_country: data.phone_country || phoneCountry,
        website: data.website,
        address_line1: data.address_line1,
        address_line2: data.address_line2,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
      }

      if (companyId) {
        // Update existing
        const { error } = await supabase
          .from('company')
          .update(updateData)
          .eq('id', companyId)

        if (error) throw error
      } else {
        // Create new
        const { data: newCompany, error } = await supabase
          .from('company')
          .insert([updateData])
          .select()
          .single()

        if (error) throw error
        setCompanyId(newCompany.id)
      }

      alert('Dados da empresa salvos com sucesso!')
    } catch (error) {
      console.error('Error saving company:', error)
      alert('Erro ao salvar dados da empresa')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !companyId) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${companyId}-logo.${fileExt}`
      // Não incluir o nome do bucket no path, apenas o nome do arquivo
      // O .from('company-logos') já especifica o bucket
      const filePath = fileName

      // Upload to Supabase Storage
      // NOTA: O bucket deve ser criado no Supabase Storage com nome 'company-logos'
      // Permissões: Public read, Authenticated write
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath)

      // Update company with logo URL
      const { error: updateError } = await supabase
        .from('company')
        .update({ logo_url: publicUrl })
        .eq('id', companyId)

      if (updateError) throw updateError

      setLogoUrl(publicUrl)
      alert('Logo atualizado com sucesso!')
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Erro ao fazer upload do logo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configurações da Empresa</h1>
          <p className="text-gray-500 mt-1">Gerencie os dados cadastrais da empresa</p>
        </div>
        <Building2 size={48} className="text-blue-500" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo Upload */}
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Logotipo</h2>
          <div className="flex items-center gap-6">
            {logoUrl ? (
              <div className="relative">
                <img src={logoUrl} alt="Logo" className="w-32 h-32 object-contain bg-white rounded-lg p-2" />
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 bg-slate-700 rounded-lg flex items-center justify-center">
                <Building2 size={48} className="text-slate-500" />
              </div>
            )}
            <div>
              <label className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
                <Upload size={20} />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={!companyId}
                />
              </label>
              <p className="text-gray-500 text-sm mt-2">
                {companyId ? 'PNG, JPG até 2MB' : 'Salve os dados primeiro para fazer upload'}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Razão Social *
              </label>
              <input
                {...register('legal_name')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Empresa LTDA"
              />
              {errors.legal_name && (
                <p className="text-red-400 text-xs mt-1">{errors.legal_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Nome Fantasia *
              </label>
              <input
                {...register('trade_name')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Empresa"
              />
              {errors.trade_name && (
                <p className="text-red-400 text-xs mt-1">{errors.trade_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                País *
              </label>
              <select
                {...register('country_code')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
              {errors.country_code && (
                <p className="text-red-400 text-xs mt-1">{errors.country_code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contato@empresa.com"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="space-y-2">
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Identificação Fiscal
                </label>
                <div className="flex gap-2">
                  <select
                    value={taxIdType}
                    onChange={(e) => {
                      const type = e.target.value as 'EIN' | 'VAT' | 'NIF' | 'CNPJ' | 'OTHER'
                      setTaxIdType(type)
                      setValue('tax_id_type', type)
                    }}
                    disabled={saving}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(() => {
                      const countryCode = watch('country_code') || 'BR'
                      const types: Record<string, Array<'EIN' | 'VAT' | 'NIF' | 'CNPJ' | 'OTHER'>> = {
                        'US': ['EIN', 'OTHER'],
                        'BR': ['CNPJ', 'OTHER'],
                        'ES': ['VAT', 'NIF', 'OTHER'],
                        'IE': ['VAT', 'NIF', 'OTHER'],
                      }
                      const availableTypes = types[countryCode] || ['OTHER']
                      return availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))
                    })()}
                  </select>
                  <input
                    type="text"
                    {...register('tax_id')}
                    placeholder={taxIdType === 'CNPJ' ? '00.000.000/0000-00' : taxIdType === 'EIN' ? '12-3456789' : 'Tax ID'}
                    disabled={saving}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {errors.tax_id && (
                  <p className="text-red-400 text-xs mt-1">{errors.tax_id.message}</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <PhoneInputWithCountry
                value={watch('phone') || null}
                onChange={(val) => {
                  setValue('phone', val || '')
                }}
                phoneCountryCode={phoneCountry}
                onPhoneCountryChange={(country) => {
                  setPhoneCountry(country)
                  setValue('phone_country', country)
                }}
                label="Telefone"
                disabled={saving}
                required={false}
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Website
              </label>
              <input
                {...register('website')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.empresa.com"
              />
              {errors.website && (
                <p className="text-red-400 text-xs mt-1">{errors.website.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Endereço *
              </label>
              <input
                {...register('address_line1')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rua, número"
              />
              {errors.address_line1 && (
                <p className="text-red-400 text-xs mt-1">{errors.address_line1.message}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Complemento
              </label>
              <input
                {...register('address_line2')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apto, sala, etc"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Cidade *
                </label>
                <input
                  {...register('city')}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="São Paulo"
                />
                {errors.city && (
                  <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Estado *
                </label>
                <input
                  {...register('state')}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SP"
                />
                {errors.state && (
                  <p className="text-red-400 text-xs mt-1">{errors.state.message}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  CEP *
                </label>
                <input
                  {...register('postal_code')}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="01234-567"
                />
                {errors.postal_code && (
                  <p className="text-red-400 text-xs mt-1">{errors.postal_code.message}</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save size={20} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
