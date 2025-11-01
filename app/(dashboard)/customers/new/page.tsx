'use client'

import { useRouter } from 'next/navigation'
import { CustomerForm } from '@/components/CustomerForm'
import { createCustomer } from '@/modules/customers/service'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function NewCustomerPage() {
  const router = useRouter()

  const handleSubmit = async (values: any) => {
    const created = await createCustomer(values)
    router.push(`/customers/${created.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Clientes', href: '/customers' },
            { label: 'Novo Cliente', href: '/customers/new' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Novo Cliente
            </h1>
            <p className="text-gray-600 mt-1">
              Cadastre um novo cliente no sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <CustomerForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  )
}
