'use client'

import { useRouter } from 'next/navigation'
import { CustomerForm } from '@/components/CustomerForm'
import { createCustomer } from '@/modules/customers/service'

export default function NewCustomerPage() {
  const router = useRouter()

  const handleSubmit = async (values: any) => {
    const created = await createCustomer(values)
    router.push(`/customers/${created.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Novo Cliente</h1>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <CustomerForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
