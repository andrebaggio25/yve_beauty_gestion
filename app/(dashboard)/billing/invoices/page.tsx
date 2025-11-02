'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/hooks/useAuditLog'
import { Plus, Search, Trash2, Edit2, Download, Send, Eye } from 'lucide-react'
import InvoiceForm from '@/components/forms/InvoiceForm'

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  customer_name: string
  description: string
  amount: number
  currency: string
  issue_date: string
  due_date: string
  status: string
  created_at: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const supabase = createClient()
  const { logAction } = useAuditLog()

  useEffect(() => {
    fetchInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('invoice')
        .select(`
          *,
          customer:customer_id (
            legal_name,
            trade_name
          )
        `)
        .order('issue_date', { ascending: false })

      if (error) throw error
      
      const transformedData = (data || []).map(i => ({
        ...i,
        customer_name: i.customer?.trade_name || i.customer?.legal_name || 'N/A'
      }))
      
      setInvoices(transformedData)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta fatura?')) return

    try {
      const { error } = await supabase
        .from('invoice')
        .delete()
        .eq('id', id)

      if (error) throw error

      await logAction({
        entity: 'invoice',
        entity_id: id,
        action: 'delete',
      })

      setInvoices(invoices.filter(i => i.id !== id))
    } catch (error) {
      console.error('Error deleting invoice:', error)
    }
  }

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = i.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'DRAFT': 'bg-slate-700 text-gray-600',
      'ISSUED': 'bg-blue-900 text-blue-200',
      'SENT': 'bg-yellow-900 text-yellow-200',
      'PAID': 'bg-green-100 text-green-700',
      'OVERDUE': 'bg-red-900 text-red-200',
      'CANCELLED': 'bg-red-950 text-red-300',
    }
    return styles[status] || 'bg-slate-700 text-gray-600'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'DRAFT': 'Rascunho',
      'ISSUED': 'Emitida',
      'SENT': 'Enviada',
      'PAID': 'Paga',
      'OVERDUE': 'Vencida',
      'CANCELLED': 'Cancelada',
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

  const totalIssued = filteredInvoices
    .filter(i => i.status === 'ISSUED' || i.status === 'SENT')
    .reduce((sum, i) => sum + i.amount, 0)

  const totalPaid = filteredInvoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Faturas</h1>
          <p className="text-gray-500 mt-1">Gerencie faturas e cobranças de clientes</p>
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
            Nova Fatura
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente, número da fatura ou descrição..."
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
            <option value="DRAFT">Rascunho</option>
            <option value="ISSUED">Emitidas</option>
            <option value="SENT">Enviadas</option>
            <option value="PAID">Pagas</option>
            <option value="OVERDUE">Vencidas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total em Aberto</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">
            {formatCurrency(totalIssued, 'BRL')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total Recebido</p>
          <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">
            {formatCurrency(totalPaid, 'BRL')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Faturas Vencidas</p>
          <p className="text-2xl font-semibold tracking-tight text-red-400 mt-1">
            {filteredInvoices.filter(i => i.status === 'OVERDUE').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Faturas no Mês</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-600 mt-1">
            {filteredInvoices.filter(i => new Date(i.issue_date).getMonth() === new Date().getMonth()).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nenhuma fatura encontrada</p>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeira fatura
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Número</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Cliente</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Descrição</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Emissão</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Vencimento</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-blue-400 font-mono font-medium">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{invoice.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-mono">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(invoice.issue_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(invoice.due_date)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button className="text-gray-500 hover:text-gray-600 transition-colors inline-flex items-center gap-1" title="Visualizar">
                        <Eye size={16} />
                      </button>
                      <button className="text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-1" title="Enviar">
                        <Send size={16} />
                      </button>
                      <button className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
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
      </div>

      {/* Invoice Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 my-8 max-h-[95vh] overflow-hidden">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">Nova Fatura</h2>
            <InvoiceForm
              onSuccess={() => {
                setShowModal(false)
                fetchInvoices()
              }}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

