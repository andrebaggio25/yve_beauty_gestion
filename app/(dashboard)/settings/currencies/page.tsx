'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, DollarSign, Edit2, Trash2, CheckCircle, XCircle, X } from 'lucide-react'

interface Currency {
  code: string
  name: string
  symbol: string
  is_active: boolean
  created_at: string
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    is_active: true,
  })

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('currency')
        .select('*')
        .order('code')

      if (error) throw error
      setCurrencies(data || [])
    } catch (error) {
      console.error('Error fetching currencies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCurrency) {
        const { error } = await supabase
          .from('currency')
          .update({
            name: formData.name,
            symbol: formData.symbol,
            is_active: formData.is_active,
          })
          .eq('code', editingCurrency.code)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('currency')
          .insert([formData])

        if (error) throw error
      }

      setShowModal(false)
      setEditingCurrency(null)
      setFormData({ code: '', name: '', symbol: '', is_active: true })
      fetchCurrencies()
    } catch (error) {
      console.error('Error saving currency:', error)
      alert('Erro ao salvar moeda')
    }
  }

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency)
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      is_active: currency.is_active,
    })
    setShowModal(true)
  }

  const handleDelete = async (code: string) => {
    if (!confirm('Tem certeza que deseja deletar esta moeda?')) return

    try {
      const { error } = await supabase
        .from('currency')
        .delete()
        .eq('code', code)

      if (error) throw error
      fetchCurrencies()
    } catch (error) {
      console.error('Error deleting currency:', error)
      alert('Erro ao deletar moeda. Ela pode estar em uso.')
    }
  }

  const handleToggleActive = async (code: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('currency')
        .update({ is_active: !currentStatus })
        .eq('code', code)

      if (error) throw error
      fetchCurrencies()
    } catch (error) {
      console.error('Error toggling currency:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Moedas</h1>
          <p className="text-gray-500 mt-1">Configure as moedas utilizadas no sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingCurrency(null)
            setFormData({ code: '', name: '', symbol: '', is_active: true })
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nova Moeda
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total de Moedas</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{currencies.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Moedas Ativas</p>
          <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">
            {currencies.filter(c => c.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Moedas Inativas</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-500 mt-1">
            {currencies.filter(c => !c.is_active).length}
          </p>
        </div>
      </div>

      {/* Currencies Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : currencies.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-gray-500">Nenhuma moeda cadastrada</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeira moeda
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Código</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Símbolo</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currencies.map((currency) => (
                  <tr key={currency.code} className="hover:bg-gray-100 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono font-bold">{currency.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{currency.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono text-lg">{currency.symbol}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        currency.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {currency.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(currency.code, currency.is_active)}
                        className={`transition-colors inline-flex items-center gap-1 ${
                          currency.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'
                        }`}
                        title={currency.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {currency.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button
                        onClick={() => handleEdit(currency)}
                        className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(currency.code)}
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
              {editingCurrency ? 'Editar Moeda' : 'Nova Moeda'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Código (ISO 4217) *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="USD, BRL, EUR..."
                  maxLength={3}
                  required
                  disabled={!!editingCurrency}
                />
                <p className="text-slate-500 text-xs mt-1">3 letras maiúsculas</p>
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
                  placeholder="Dólar Americano, Real Brasileiro..."
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Símbolo *
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="$, R$, €..."
                  required
                />
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
                  Moeda ativa
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCurrency(null)
                    setFormData({ code: '', name: '', symbol: '', is_active: true })
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-900 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  {editingCurrency ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
