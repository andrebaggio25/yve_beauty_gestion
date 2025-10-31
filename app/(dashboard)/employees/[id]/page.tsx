'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EmployeeForm } from '@/components/EmployeeForm'
import { FileUpload } from '@/components/FileUpload'
import { getEmployeeById, updateEmployee, listEmployeeAttachments, addEmployeeAttachment, listEmployeeProvisions } from '@/modules/employees/service'
import type { Employee, EmployeeAttachment, Provision } from '@/types/employee'
import { Trash2 } from 'lucide-react'

export default function EditEmployeePage() {
  const params = useParams()
  const id = params?.id as string
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [attachments, setAttachments] = useState<EmployeeAttachment[]>([])
  const [provisions, setProvisions] = useState<Provision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [employeeData, attachmentsData, provisionsData] = await Promise.all([
          getEmployeeById(id),
          listEmployeeAttachments(id),
          listEmployeeProvisions(id),
        ])
        setEmployee(employeeData)
        setAttachments(attachmentsData)
        setProvisions(provisionsData)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async (values: any) => {
    await updateEmployee({ id, ...values })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!employee) {
    return <p className="text-slate-300">Funcionário não encontrado.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Editar Funcionário</h1>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <EmployeeForm defaultValues={employee} onSubmit={handleSubmit} />
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-white font-semibold mb-4">Documentos</h2>
        <FileUpload
          bucketName="attachments"
          folderPath={`employees/${id}`}
          onFileUploaded={async (fileName, filePath) => {
            await addEmployeeAttachment({
              id: crypto.randomUUID(),
              employee_id: id,
              file_name: fileName,
              file_path: filePath,
              file_type: fileName.split('.').pop() || 'file',
              file_size: 0,
              attachment_type: 'OTHER',
              uploaded_by: 'self',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any)
            setAttachments([...attachments, {
              id: crypto.randomUUID(),
              employee_id: id,
              file_name: fileName,
              file_path: filePath,
              file_type: fileName.split('.').pop() || 'file',
              file_size: 0,
              attachment_type: 'OTHER',
              uploaded_by: 'self',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as EmployeeAttachment])
          }}
        />
        {attachments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-slate-300 text-sm font-medium mb-2">Documentos Carregados:</h3>
            <div className="space-y-2">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center justify-between bg-slate-700 p-3 rounded text-slate-300 text-sm">
                  <span>{att.file_name}</span>
                  <button className="text-red-400 hover:text-red-300">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {provisions.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-white font-semibold mb-4">Provisões</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="text-left px-4 py-2 text-slate-300 font-semibold">Data</th>
                  <th className="text-right px-4 py-2 text-slate-300 font-semibold">Valor</th>
                  <th className="text-left px-4 py-2 text-slate-300 font-semibold">Moeda</th>
                  <th className="text-left px-4 py-2 text-slate-300 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {provisions.map(prov => (
                  <tr key={prov.id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-4 py-2 text-slate-300">{new Date(prov.provision_date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-2 text-right text-slate-300">{prov.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-slate-300">{prov.currency}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        prov.status === 'LANÇADA' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                      }`}>
                        {prov.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
