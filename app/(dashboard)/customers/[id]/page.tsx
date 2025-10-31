'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CustomerForm } from '@/components/CustomerForm'
import { getCustomerById, updateCustomer, listCustomerAttachments, addCustomerAttachment } from '@/modules/customers/service'
import type { Customer } from '@/types/customer'
import { FileUpload } from '@/components/FileUpload'

export default function EditCustomerPage() {
  const params = useParams()
  const id = params?.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCustomerById(id)
        setCustomer(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async (values: any) => {
    await updateCustomer({ id, ...values })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!customer) {
    return <p className="text-slate-300">Cliente não encontrado.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Editar Cliente</h1>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <CustomerForm defaultValues={customer} onSubmit={handleSubmit} />
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-white font-semibold mb-4">Anexos</h2>
        <FileUpload
          bucketName="attachments"
          folderPath={`customers/${id}`}
          onFileUploaded={async (fileName, filePath) => {
            await addCustomerAttachment({
              id: crypto.randomUUID(),
              customer_id: id,
              file_name: fileName,
              file_path: filePath,
              file_type: fileName.split('.').pop() || 'file',
              file_size: 0,
              uploaded_by: 'self',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any)
          }}
        />
      </div>
    </div>
  )
}
