'use client'

import { useRouter } from 'next/navigation'
import { VendorForm } from '@/components/VendorForm'
import { createVendor } from '@/modules/vendors/service'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function NewVendorPage() {
  const router = useRouter()

  const handleSubmit = async (values: any) => {
    try {
      const created = await createVendor(values)
      router.push(`/vendors/${created.id}`)
    } catch (error) {
      console.error('Error creating vendor:', error)
      alert('Erro ao criar fornecedor')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Fornecedores', href: '/vendors' },
            { label: 'Novo Fornecedor', href: '/vendors/new' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Novo Fornecedor
            </h1>
            <p className="text-gray-600 mt-1">
              Cadastre um novo fornecedor no sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <VendorForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  )
}

