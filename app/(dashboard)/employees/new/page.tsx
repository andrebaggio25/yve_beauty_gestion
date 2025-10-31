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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Novo Funcionário</h1>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <EmployeeForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
