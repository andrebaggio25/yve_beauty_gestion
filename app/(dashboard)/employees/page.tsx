'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/hooks/useAuditLog'
import { Plus, Search, Trash2, Edit2 } from 'lucide-react'
import Link from 'next/link'

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  contract_type: string
  is_active: boolean
  created_at: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const { logAction } = useAuditLog()

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('employee')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este funcionário?')) return

    try {
      const { error } = await supabase
        .from('employee')
        .delete()
        .eq('id', id)

      if (error) throw error

      await logAction({
        entity: 'employee',
        entity_id: id,
        action: 'delete',
      })

      setEmployees(employees.filter(e => e.id !== id))
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  const filteredEmployees = employees.filter(e =>
    e.first_name.toLowerCase().includes(search.toLowerCase()) ||
    e.last_name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  )

  const getContractTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'FIXED': 'Fixo',
      'TEMPORARY': 'Temporário',
      'INTERN': 'Estagiário',
      'CONTRACTOR': 'Terceiro',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Funcionários</h1>
        <Link href="/employees/new" className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus size={20} />
          Novo Funcionário
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum funcionário encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">E-mail</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Tipo de Contrato</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{employee.first_name} {employee.last_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getContractTypeLabel(employee.contract_type)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        employee.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {employee.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <Link href={`/employees/${employee.id}`} className="text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1">
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(employee.id)}
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
