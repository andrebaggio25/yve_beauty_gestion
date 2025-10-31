'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Save, Upload, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const companySchema = z.object({
  legal_name: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  trade_name: z.string().min(3, 'Nome fantasia deve ter no mínimo 3 caracteres'),
  tax_id: z.string().min(11, 'CNPJ/Tax ID inválido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  website: z.string().url('Website inválido').optional().or(z.literal('')),
  address_line1: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'Cidade deve ter no mínimo 2 caracteres'),
  state: z.string().min(2, 'Estado deve ter no mínimo 2 caracteres'),
  postal_code: z.string().min(5, 'CEP inválido'),
  country: z.string().min(2, 'País deve ter no mínimo 2 caracteres'),
})

type CompanyFormData = z.infer<typeof companySchema>

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  })

  useEffect(() => {
    fetchCompanyData()
  }, [])

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
        reset({
          legal_name: data.legal_name || '',
          trade_name: data.trade_name || '',
          tax_id: data.tax_id || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          address_line1: data.address_line1 || '',
          address_line2: data.address_line2 || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          country: data.country || 'Brasil',
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

      if (companyId) {
        // Update existing
        const { error } = await supabase
          .from('company')
          .update(data)
          .eq('id', companyId)

        if (error) throw error
      } else {
        // Create new
        const { data: newCompany, error } = await supabase
          .from('company')
          .insert([data])
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
      const filePath = `company-logos/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
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
                CNPJ / Tax ID *
              </label>
              <input
                {...register('tax_id')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00.000.000/0000-00"
              />
              {errors.tax_id && (
                <p className="text-red-400 text-xs mt-1">{errors.tax_id.message}</p>
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

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                Telefone *
              </label>
              <input
                {...register('phone')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(11) 98765-4321"
              />
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
              )}
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

            <div>
              <label className="block text-gray-600 text-sm font-medium mb-2">
                País *
              </label>
              <input
                {...register('country')}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brasil"
              />
              {errors.country && (
                <p className="text-red-400 text-xs mt-1">{errors.country.message}</p>
              )}
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
