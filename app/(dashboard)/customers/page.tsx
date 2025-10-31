'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/hooks/useAuditLog'
import { Plus, Search, Trash2, Edit2 } from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  legal_name: string
  trade_name: string | null
  country_code: string | null
  tax_id: string | null
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const { logAction } = useAuditLog()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customer')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) return

    try {
      const { error } = await supabase
        .from('customer')
        .delete()
        .eq('id', id)

      if (error) throw error

      await logAction({
        entity: 'customer',
        entity_id: id,
        action: 'delete',
      })

      setCustomers(customers.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.legal_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.trade_name && c.trade_name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Clientes</h1>
        <Link href="/customers/new" className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus size={20} />
          Novo Cliente
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome legal ou fantasia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum cliente encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nome Legal</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nome Fantasia</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">País</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">CNPJ/EIN</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{customer.legal_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.trade_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.country_code || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.tax_id || '-'}</td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <Link href={`/customers/${customer.id}`} className="text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1">
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
