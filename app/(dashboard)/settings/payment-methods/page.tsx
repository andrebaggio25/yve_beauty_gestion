'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, CreditCard, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface PaymentMethod {
  id: string
  name: string
  type: 'bank_transfer' | 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'boleto' | 'check' | 'other'
  is_active: boolean
  requires_approval: boolean
  default_account_id: string | null
  created_at: string
}

const METHOD_TYPES = [
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'check', label: 'Cheque' },
  { value: 'other', label: 'Outro' },
]

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    type: 'bank_transfer' as const,
    is_active: true,
    requires_approval: false,
  })

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payment_method')
        .select('*')
        .order('name')

      if (error) throw error
      setMethods(data || [])
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingMethod) {
        const { error } = await supabase
          .from('payment_method')
          .update(formData)
          .eq('id', editingMethod.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('payment_method')
          .insert([formData])

        if (error) throw error
      }

      setShowModal(false)
      setEditingMethod(null)
      setFormData({ name: '', type: 'bank_transfer', is_active: true, requires_approval: false })
      fetchMethods()
    } catch (error) {
      console.error('Error saving payment method:', error)
      alert('Erro ao salvar método de pagamento')
    }
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      name: method.name,
      type: method.type,
      is_active: method.is_active,
      requires_approval: method.requires_approval,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este método de pagamento?')) return

    try {
      const { error } = await supabase
        .from('payment_method')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchMethods()
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert('Erro ao deletar método. Ele pode estar em uso.')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_method')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchMethods()
    } catch (error) {
      console.error('Error toggling payment method:', error)
    }
  }

  const getTypeLabel = (type: string) => {
    return METHOD_TYPES.find(t => t.value === type)?.label || type
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Métodos de Pagamento</h1>
          <p className="text-gray-500 mt-1">Configure os métodos de pagamento disponíveis</p>
        </div>
        <button
          onClick={() => {
            setEditingMethod(null)
            setFormData({ name: '', type: 'bank_transfer', is_active: true, requires_approval: false })
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Método
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total de Métodos</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{methods.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Métodos Ativos</p>
          <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">
            {methods.filter(m => m.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Com Aprovação</p>
          <p className="text-2xl font-semibold tracking-tight text-yellow-400 mt-1">
            {methods.filter(m => m.requires_approval).length}
          </p>
        </div>
      </div>

      {/* Payment Methods Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : methods.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-gray-500">Nenhum método de pagamento cadastrado</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeiro método
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Aprovação</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {methods.map((method) => (
                  <tr key={method.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{method.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getTypeLabel(method.type)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        method.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {method.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {method.requires_approval ? (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">
                          Requerida
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                          Não
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(method.id, method.is_active)}
                        className={`transition-colors inline-flex items-center gap-1 ${
                          method.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'
                        }`}
                        title={method.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {method.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button
                        onClick={() => handleEdit(method)}
                        className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">
              {editingMethod ? 'Editar Método' : 'Novo Método de Pagamento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Banco Itaú, PIX Empresa..."
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {METHOD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-gray-600 text-sm">
                  Método ativo
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requires_approval"
                  checked={formData.requires_approval}
                  onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="requires_approval" className="text-gray-600 text-sm">
                  Requer aprovação
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingMethod(null)
                    setFormData({ name: '', type: 'bank_transfer', is_active: true, requires_approval: false })
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-900 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  {editingMethod ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
