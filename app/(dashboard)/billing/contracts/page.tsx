'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/hooks/useAuditLog'
import { Plus, Search, Trash2, Edit2, Download, CheckCircle, XCircle } from 'lucide-react'
import ContractForm from '@/components/forms/ContractForm'
import Pagination from '@/components/Pagination'

interface Contract {
  id: string
  customer_id: string
  customer_name: string
  description: string
  amount: number
  currency: string
  frequency: string
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
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
    fetchContracts()
  }, [currentPage, itemsPerPage])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      
      // Get total count
      const { count } = await supabase
        .from('contract')
        .select('*', { count: 'exact', head: true })
      
      setTotalItems(count || 0)

      // Get paginated data
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error } = await supabase
        .from('contract')
        .select(`
          *,
          customer:customer_id (
            legal_name,
            trade_name
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      
      const transformedData = (data || []).map(c => ({
        ...c,
        customer_name: c.customer?.trade_name || c.customer?.legal_name || 'N/A'
      }))
      
      setContracts(transformedData)
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('contract')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      await logAction({
        entity: 'contract',
        entity_id: id,
        action: 'update',
        old_data: { is_active: currentStatus },
        new_data: { is_active: !currentStatus }
      })

      fetchContracts()
    } catch (error) {
      console.error('Error toggling contract status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este contrato?')) return

    try {
      const { error } = await supabase
        .from('contract')
        .delete()
        .eq('id', id)

      if (error) throw error

      await logAction({
        entity: 'contract',
        entity_id: id,
        action: 'delete',
      })

      setContracts(contracts.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting contract:', error)
    }
  }

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && c.is_active) ||
      (filterStatus === 'inactive' && !c.is_active)
    return matchesSearch && matchesStatus
  })

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      'MONTHLY': 'Mensal',
      'QUARTERLY': 'Trimestral',
      'SEMI_ANNUAL': 'Semestral',
      'ANNUAL': 'Anual',
      'ONE_TIME': 'Único',
    }
    return labels[frequency] || frequency
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

  const totalActive = filteredContracts
    .filter(c => c.is_active)
    .reduce((sum, c) => sum + c.amount, 0)

  const totalInactive = filteredContracts.filter(c => !c.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Contratos</h1>
          <p className="text-gray-500 mt-1">Gerencie contratos recorrentes com clientes</p>
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
            Novo Contrato
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente ou descrição..."
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
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Receita Recorrente Mensal (MRR)</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">
            {formatCurrency(totalActive, 'BRL')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Contratos Ativos</p>
          <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">
            {filteredContracts.filter(c => c.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Contratos Inativos</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-500 mt-1">
            {totalInactive}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nenhum contrato encontrado</p>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeiro contrato
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Cliente</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Descrição</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Frequência</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Início</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{contract.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{contract.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                      {formatCurrency(contract.amount, contract.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{getFrequencyLabel(contract.frequency)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(contract.start_date)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        contract.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-700 text-gray-600'
                      }`}>
                        {contract.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(contract.id, contract.is_active)}
                        className={`transition-colors inline-flex items-center gap-1 ${
                          contract.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'
                        }`}
                        title={contract.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {contract.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(contract.id)}
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
        {filteredContracts.length > 0 && (
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">Novo Contrato</h2>
            <ContractForm
              onSuccess={() => {
                setShowModal(false)
                fetchContracts()
              }}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

