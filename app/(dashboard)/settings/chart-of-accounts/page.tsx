'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, FolderTree, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react'

interface ChartAccount {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  parent_id: string | null
  is_active: boolean
  level: number
  created_at: string
}

const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Ativo', color: 'text-green-400' },
  { value: 'liability', label: 'Passivo', color: 'text-red-400' },
  { value: 'equity', label: 'Patrimônio Líquido', color: 'text-blue-400' },
  { value: 'revenue', label: 'Receita', color: 'text-emerald-400' },
  { value: 'expense', label: 'Despesa', color: 'text-orange-400' },
]

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null)
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<string>('all')
  const supabase = createClient()

  const [formData, setFormData] = useState<{
    code: string
    name: string
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
    parent_id: string | null
    is_active: boolean
  }>({
    code: '',
    name: '',
    type: 'asset',
    parent_id: null,
    is_active: true,
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .order('code')

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching chart of accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Calculate level based on parent
      let level = 1
      if (formData.parent_id) {
        const parent = accounts.find(a => a.id === formData.parent_id)
        if (parent) level = parent.level + 1
      }

      if (editingAccount) {
        const { error } = await supabase
          .from('chart_of_accounts')
          .update({ ...formData, level })
          .eq('id', editingAccount.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('chart_of_accounts')
          .insert([{ ...formData, level }])

        if (error) throw error
      }

      setShowModal(false)
      setEditingAccount(null)
      setFormData({ code: '', name: '', type: 'asset', parent_id: null, is_active: true })
      fetchAccounts()
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Erro ao salvar conta')
    }
  }

  const handleEdit = (account: ChartAccount) => {
    setEditingAccount(account)
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      parent_id: account.parent_id,
      is_active: account.is_active,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    // Check if has children
    const hasChildren = accounts.some(a => a.parent_id === id)
    if (hasChildren) {
      alert('Não é possível deletar uma conta que possui sub-contas.')
      return
    }

    if (!confirm('Tem certeza que deseja deletar esta conta?')) return

    try {
      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Erro ao deletar conta. Ela pode estar em uso.')
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedAccounts(newExpanded)
  }

  const getTypeLabel = (type: string) => {
    return ACCOUNT_TYPES.find(t => t.value === type)?.label || type
  }

  const getTypeColor = (type: string) => {
    return ACCOUNT_TYPES.find(t => t.value === type)?.color || 'text-gray-500'
  }

  const buildHierarchy = (parentId: string | null = null): ChartAccount[] => {
    return accounts
      .filter(a => a.parent_id === parentId)
      .filter(a => filterType === 'all' || a.type === filterType)
  }

  const renderAccountRow = (account: ChartAccount, depth: number = 0): JSX.Element[] => {
    const children = buildHierarchy(account.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedAccounts.has(account.id)

    const row = (
      <tr key={account.id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
          <td className="px-6 py-3 text-sm">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(account.id)}
                  className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              <span className={`font-mono font-bold ${getTypeColor(account.type)}`}>
                {account.code}
              </span>
            </div>
          </td>
          <td className="px-6 py-3 text-sm text-gray-900">{account.name}</td>
          <td className="px-6 py-3 text-sm">
            <span className={`font-medium ${getTypeColor(account.type)}`}>
              {getTypeLabel(account.type)}
            </span>
          </td>
          <td className="px-6 py-3 text-sm text-center">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
            account.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {account.is_active ? 'Ativa' : 'Inativa'}
            </span>
          </td>
          <td className="px-6 py-3 text-sm text-right space-x-2">
            <button
              onClick={() => handleEdit(account)}
              className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(account.id)}
              className="text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1"
            >
              <Trash2 size={16} />
            </button>
          </td>
        </tr>
    )

    const childRows = isExpanded ? children.flatMap(child => renderAccountRow(child, depth + 1)) : []
    
    return [row, ...childRows]
  }

  const rootAccounts = buildHierarchy(null)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Plano de Contas</h1>
          <p className="text-gray-500 mt-1">Gerencie a estrutura contábil da empresa</p>
        </div>
        <button
          onClick={() => {
            setEditingAccount(null)
            setFormData({ code: '', name: '', type: 'asset', parent_id: null, is_active: true })
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nova Conta
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {ACCOUNT_TYPES.map(type => {
          const count = accounts.filter(a => a.type === type.value).length
          return (
            <div key={type.value} className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
              <p className="text-gray-500 text-sm">{type.label}</p>
              <p className={`text-2xl font-semibold tracking-tight ${type.color} mt-1`}>{count}</p>
            </div>
          )
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg transition-colors border ${
            filterType === 'all' 
              ? 'bg-black text-white border-black' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          Todas
        </button>
        {ACCOUNT_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value)}
            className={`px-4 py-2 rounded-lg transition-colors border ${
              filterType === type.value 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : rootAccounts.length === 0 ? (
          <div className="p-8 text-center">
            <FolderTree size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-gray-500">Nenhuma conta cadastrada</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeira conta
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Código</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Tipo</th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rootAccounts.flatMap(account => renderAccountRow(account, 0))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 my-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">
              {editingAccount ? 'Editar Conta' : 'Nova Conta Contábil'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 1.1.01.001"
                  required
                />
                <p className="text-slate-500 text-xs mt-1">Use separadores para hierarquia (pontos ou hífen)</p>
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Caixa, Banco, Fornecedores..."
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
                  {ACCOUNT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Conta Pai (Opcional)
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhuma (Conta raiz)</option>
                  {accounts
                    .filter(a => a.id !== editingAccount?.id)
                    .map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
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
                  Conta ativa
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingAccount(null)
                    setFormData({ code: '', name: '', type: 'asset', parent_id: null, is_active: true })
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-900 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  {editingAccount ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
