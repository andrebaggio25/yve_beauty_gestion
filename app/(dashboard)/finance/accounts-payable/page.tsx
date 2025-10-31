'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/hooks/useAuditLog'
import { Plus, Search, Trash2, Edit2, Filter, Download, X } from 'lucide-react'
import Link from 'next/link'
import AccountPayableForm from '@/components/forms/AccountPayableForm'
import Pagination from '@/components/Pagination'

interface AccountPayable {
  id: string
  vendor_name: string
  description: string
  amount: number
  currency: string
  due_date: string
  status: string
  created_at: string
}

export default function AccountsPayablePage() {
  const [records, setRecords] = useState<AccountPayable[]>([])
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
    fetchRecords()
  }, [currentPage, itemsPerPage])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      
      // Get total count
      const { count } = await supabase
        .from('accounts_payable')
        .select('*', { count: 'exact', head: true })
      
      setTotalItems(count || 0)

      // Get paginated data
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .order('due_date', { ascending: true })
        .range(from, to)

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('Error fetching accounts payable:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este registro?')) return

    try {
      const { error } = await supabase
        .from('account_payable')
        .delete()
        .eq('id', id)

      if (error) throw error

      await logAction({
        entity: 'account_payable',
        entity_id: id,
        action: 'delete',
      })

      setRecords(records.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error deleting record:', error)
    }
  }

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'OPEN': 'bg-yellow-900 text-yellow-200',
      'PARTIAL': 'bg-blue-900 text-blue-200',
      'PAID': 'bg-green-900 text-green-200',
      'OVERDUE': 'bg-red-900 text-red-200',
    }
    return styles[status] || 'bg-slate-700 text-gray-600'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'OPEN': 'Aberta',
      'PARTIAL': 'Parcial',
      'PAID': 'Paga',
      'OVERDUE': 'Vencida',
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Contas a Pagar</h1>
          <p className="text-gray-500 mt-1">Gerencie suas contas a pagar e fornecedores</p>
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
            Nova Conta a Pagar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por fornecedor ou descrição..."
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
            <option value="OPEN">Abertas</option>
            <option value="PARTIAL">Parciais</option>
            <option value="PAID">Pagas</option>
            <option value="OVERDUE">Vencidas</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total em Aberto</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">
            {formatCurrency(
              filteredRecords.filter(r => r.status === 'OPEN' || r.status === 'PARTIAL').reduce((sum, r) => sum + r.amount, 0),
              'BRL'
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Vencidas</p>
          <p className="text-2xl font-semibold tracking-tight text-red-400 mt-1">
            {filteredRecords.filter(r => r.status === 'OVERDUE').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Vencendo Hoje</p>
          <p className="text-2xl font-semibold tracking-tight text-yellow-400 mt-1">
            {filteredRecords.filter(r => new Date(r.due_date).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Pagas no Mês</p>
          <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">
            {filteredRecords.filter(r => r.status === 'PAID' && new Date(r.created_at).getMonth() === new Date().getMonth()).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nenhuma conta a pagar encontrada</p>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeira conta a pagar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Fornecedor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Descrição</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Vencimento</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{record.vendor_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{record.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                      {formatCurrency(record.amount, record.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(record.due_date)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
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
        {filteredRecords.length > 0 && (
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Nova Conta a Pagar</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <AccountPayableForm
                onSuccess={() => {
                  setShowModal(false)
                  fetchRecords()
                }}
                onCancel={() => setShowModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

