'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { VendorForm } from '@/components/VendorForm'
import { getVendorById, updateVendor, Vendor } from '@/modules/vendors/service'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function EditVendorPage() {
  const params = useParams()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchVendor(params.id as string)
    }
  }, [params.id])

  const fetchVendor = async (id: string) => {
    try {
      setLoading(true)
      const data = await getVendorById(id)
      setVendor(data)
    } catch (error) {
      console.error('Error fetching vendor:', error)
      alert('Erro ao carregar fornecedor')
      router.push('/vendors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    if (!vendor) return

    try {
      await updateVendor({
        id: vendor.id,
        ...values,
      })
      router.push('/vendors')
    } catch (error) {
      console.error('Error updating vendor:', error)
      alert('Erro ao atualizar fornecedor')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando fornecedor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Fornecedor não encontrado</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Fornecedores', href: '/vendors' },
            { label: vendor.legal_name, href: `/vendors/${vendor.id}` },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Editar Fornecedor
            </h1>
            <p className="text-gray-600 mt-1">
              {vendor.legal_name}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <VendorForm defaultValues={vendor} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  )
}

