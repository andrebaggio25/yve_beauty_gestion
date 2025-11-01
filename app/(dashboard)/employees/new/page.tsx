'use client'

import { useRouter } from 'next/navigation'
import { EmployeeForm } from '@/components/EmployeeForm'
import { createEmployee } from '@/modules/employees/service'

export default function NewEmployeePage() {
  const router = useRouter()

  const handleSubmit = async (values: any) => {
    const created = await createEmployee(values)
    router.push(`/employees/${created.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Novo Funcionário</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <EmployeeForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
