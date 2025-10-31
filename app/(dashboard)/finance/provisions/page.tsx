'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/hooks/useAuditLog'
import { Plus, Search, Trash2, Edit2, Download, CheckCircle, XCircle } from 'lucide-react'
import ProvisionForm from '@/components/forms/ProvisionForm'
import Pagination from '@/components/Pagination'

interface Provision {
  id: string
  employee_id: string
  employee_name: string
  description: string
  amount: number
  currency: string
  provision_date: string
  status: string
  reversed_at: string | null
  created_at: string
}

export default function ProvisionsPage() {
  const [provisions, setProvisions] = useState<Provision[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const supabase = createClient()
  const { logAction } = useAuditLog()

  useEffect(() => {
    fetchProvisions()
  }, [currentPage, itemsPerPage])

  const fetchProvisions = async () => {
    try {
      setLoading(true)
      
      // Get total count
      const { count } = await supabase
        .from('provision')
        .select('*', { count: 'exact', head: true })
      
      setTotalItems(count || 0)

      // Get paginated data
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error } = await supabase
        .from('provision')
        .select(`
          *,
          employee:employee_id (
            first_name,
            last_name
          )
        `)
        .order('provision_date', { ascending: false })
        .range(from, to)

      if (error) throw error
      
      // Transform data to include employee_name
      const transformedData = (data || []).map(p => ({
        ...p,
        employee_name: p.employee ? `${p.employee.first_name} ${p.employee.last_name}` : 'N/A'
      }))
      
      setProvisions(transformedData)
    } catch (error) {
      console.error('Error fetching provisions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReverse = async (id: string) => {
    if (!confirm('Tem certeza que deseja estornar esta provisão?')) return

    try {
      const { error } = await supabase
        .from('provision')
        .update({ 
          status: 'REVERSED',
          reversed_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await logAction({
        entity: 'provision',
        entity_id: id,
        action: 'update',
        changes: { status: 'REVERSED' }
      })

      fetchProvisions()
    } catch (error) {
      console.error('Error reversing provision:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta provisão?')) return

    try {
      const { error } = await supabase
        .from('provision')
        .delete()
        .eq('id', id)

      if (error) throw error

      await logAction({
        entity: 'provision',
        entity_id: id,
        action: 'delete',
      })

      setProvisions(provisions.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting provision:', error)
    }
  }

  const filteredProvisions = provisions.filter(p => {
    const matchesSearch = p.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'ACTIVE': 'bg-green-900 text-green-200',
      'REVERSED': 'bg-red-900 text-red-200',
    }
    return styles[status] || 'bg-slate-700 text-gray-600'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ACTIVE': 'Ativa',
      'REVERSED': 'Estornada',
    }
    return labels[status] || status
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const totalActive = filteredProvisions
    .filter(p => p.status === 'ACTIVE')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalReversed = filteredProvisions
    .filter(p => p.status === 'REVERSED')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Provisões</h1>
          <p className="text-gray-500 mt-1">Gerencie provisões de funcionários terceiros</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-gray-900 px-4 py-2 rounded-lg transition-colors">
            <Download size={20} />
            Exportar
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nova Provisão
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por funcionário ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="ACTIVE">Ativas</option>
            <option value="REVERSED">Estornadas</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Provisões Ativas</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">
            {formatCurrency(totalActive, 'BRL')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Provisões Estornadas</p>
          <p className="text-2xl font-semibold tracking-tight text-red-400 mt-1">
            {formatCurrency(totalReversed, 'BRL')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total de Provisões</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-600 mt-1">
            {filteredProvisions.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProvisions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nenhuma provisão encontrada</p>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeira provisão
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Funcionário</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Descrição</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Data</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredProvisions.map((provision) => (
                  <tr key={provision.id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{provision.employee_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{provision.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                      {formatCurrency(provision.amount, provision.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(provision.provision_date)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(provision.status)}`}>
                        {getStatusLabel(provision.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      {provision.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleReverse(provision.id)}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors inline-flex items-center gap-1"
                          title="Estornar"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      <button className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(provision.id)}
                        className="text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1"
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
        
        {/* Pagination */}
        {filteredProvisions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage)}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      {/* Modal with Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 my-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">Nova Provisão</h2>
            <ProvisionForm
              onSuccess={() => {
                setShowModal(false)
                fetchProvisions()
              }}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

