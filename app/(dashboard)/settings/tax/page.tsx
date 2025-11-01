'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Percent, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface Tax {
  id: string
  name: string
  code: string
  rate: number
  type: 'percentage' | 'fixed'
  country: string
  is_active: boolean
  description: string | null
  created_at: string
}

const TAX_TYPES = [
  { value: 'percentage', label: 'Percentual (%)' },
  { value: 'fixed', label: 'Valor Fixo' },
]

const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'Espanha' },
  { code: 'IE', name: 'Irlanda' },
]

export default function TaxPage() {
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTax, setEditingTax] = useState<Tax | null>(null)
  const [filterCountry, setFilterCountry] = useState<string>('all')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rate: 0,
    type: 'percentage' as const,
    country: 'BR',
    is_active: true,
    description: '',
  })

  useEffect(() => {
    fetchTaxes()
  }, [])

  const fetchTaxes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tax')
        .select('*')
        .order('country', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setTaxes(data || [])
    } catch (error) {
      console.error('Error fetching taxes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTax) {
        const { error } = await supabase
          .from('tax')
          .update(formData)
          .eq('id', editingTax.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tax')
          .insert([formData])

        if (error) throw error
      }

      setShowModal(false)
      setEditingTax(null)
      setFormData({
        name: '',
        code: '',
        rate: 0,
        type: 'percentage',
        country: 'BR',
        is_active: true,
        description: '',
      })
      fetchTaxes()
    } catch (error) {
      console.error('Error saving tax:', error)
      alert('Erro ao salvar imposto')
    }
  }

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax)
    setFormData({
      name: tax.name,
      code: tax.code,
      rate: tax.rate,
      type: tax.type,
      country: tax.country,
      is_active: tax.is_active,
      description: tax.description || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este imposto?')) return

    try {
      const { error } = await supabase
        .from('tax')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchTaxes()
    } catch (error) {
      console.error('Error deleting tax:', error)
      alert('Erro ao deletar imposto. Ele pode estar em uso.')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tax')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchTaxes()
    } catch (error) {
      console.error('Error toggling tax:', error)
    }
  }

  const filteredTaxes = filterCountry === 'all' 
    ? taxes 
    : taxes.filter(t => t.country === filterCountry)

  const getCountryName = (code: string) => {
    return COUNTRIES.find(c => c.code === code)?.name || code
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Impostos e Taxas</h1>
          <p className="text-gray-500 mt-1">Configure impostos e alíquotas por país</p>
        </div>
        <button
          onClick={() => {
            setEditingTax(null)
            setFormData({
              name: '',
              code: '',
              rate: 0,
              type: 'percentage',
              country: 'BR',
              is_active: true,
              description: '',
            })
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Imposto
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total de Impostos</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{taxes.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Impostos Ativos</p>
          <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">
            {taxes.filter(t => t.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Países Configurados</p>
          <p className="text-2xl font-semibold tracking-tight text-blue-400 mt-1">
            {new Set(taxes.map(t => t.country)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Taxa Média</p>
          <p className="text-2xl font-semibold tracking-tight text-yellow-400 mt-1">
            {taxes.length > 0 ? (taxes.reduce((sum, t) => sum + t.rate, 0) / taxes.length).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterCountry('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterCountry === 'all' ? 'bg-black text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Todos
        </button>
        {COUNTRIES.map(country => (
          <button
            key={country.code}
            onClick={() => setFilterCountry(country.code)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterCountry === country.code ? 'bg-black text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {country.name}
          </button>
        ))}
      </div>

      {/* Taxes Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTaxes.length === 0 ? (
          <div className="p-8 text-center">
            <Percent size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-gray-500">Nenhum imposto cadastrado</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeiro imposto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Código</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Alíquota</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">País</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTaxes.map((tax) => (
                  <tr key={tax.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="text-gray-900 font-medium">{tax.name}</p>
                        {tax.description && (
                          <p className="text-gray-500 text-xs mt-1">{tax.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{tax.code}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className="text-gray-900 font-mono font-bold">
                        {tax.type === 'percentage' ? `${tax.rate}%` : `R$ ${tax.rate.toFixed(2)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tax.type === 'percentage' ? 'Percentual' : 'Fixo'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getCountryName(tax.country)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tax.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tax.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(tax.id, tax.is_active)}
                        className={`transition-colors inline-flex items-center gap-1 ${
                          tax.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'
                        }`}
                        title={tax.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {tax.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button
                        onClick={() => handleEdit(tax)}
                        className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(tax.id)}
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">
              {editingTax ? 'Editar Imposto' : 'Novo Imposto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ICMS, ISS, IVA..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ICMS01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Alíquota *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="18.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {TAX_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    País *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição adicional sobre o imposto..."
                  rows={2}
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
                  Imposto ativo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTax(null)
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-900 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  {editingTax ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
