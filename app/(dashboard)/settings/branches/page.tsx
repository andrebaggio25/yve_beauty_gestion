'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, MapPin, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface Branch {
  id: string
  name: string
  code: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  phone: string | null
  email: string | null
  is_active: boolean
  is_headquarters: boolean
  created_at: string
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Brasil',
    phone: '',
    email: '',
    is_active: true,
    is_headquarters: false,
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('branch')
        .select('*')
        .order('name')

      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingBranch) {
        const { error } = await supabase
          .from('branch')
          .update(formData)
          .eq('id', editingBranch.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('branch')
          .insert([formData])

        if (error) throw error
      }

      setShowModal(false)
      setEditingBranch(null)
      setFormData({
        name: '',
        code: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Brasil',
        phone: '',
        email: '',
        is_active: true,
        is_headquarters: false,
      })
      fetchBranches()
    } catch (error) {
      console.error('Error saving branch:', error)
      alert('Erro ao salvar filial')
    }
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      code: branch.code,
      address_line1: branch.address_line1,
      address_line2: branch.address_line2 || '',
      city: branch.city,
      state: branch.state,
      postal_code: branch.postal_code,
      country: branch.country,
      phone: branch.phone || '',
      email: branch.email || '',
      is_active: branch.is_active,
      is_headquarters: branch.is_headquarters,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta filial?')) return

    try {
      const { error } = await supabase
        .from('branch')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchBranches()
    } catch (error) {
      console.error('Error deleting branch:', error)
      alert('Erro ao deletar filial. Ela pode estar em uso.')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('branch')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchBranches()
    } catch (error) {
      console.error('Error toggling branch:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Filiais</h1>
          <p className="text-gray-500 mt-1">Gerencie as filiais e unidades da empresa</p>
        </div>
        <button
          onClick={() => {
            setEditingBranch(null)
            setFormData({
              name: '',
              code: '',
              address_line1: '',
              address_line2: '',
              city: '',
              state: '',
              postal_code: '',
              country: 'Brasil',
              phone: '',
              email: '',
              is_active: true,
              is_headquarters: false,
            })
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nova Filial
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total de Filiais</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{branches.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Filiais Ativas</p>
          <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">
            {branches.filter(b => b.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Matriz</p>
          <p className="text-2xl font-semibold tracking-tight text-blue-400 mt-1">
            {branches.filter(b => b.is_headquarters).length}
          </p>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : branches.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <MapPin size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-gray-500">Nenhuma filial cadastrada</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeira filial
            </button>
          </div>
        ) : (
          branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-5 hover:border-slate-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg">{branch.name}</h3>
                  <p className="text-gray-500 text-sm font-mono">{branch.code}</p>
                </div>
                {branch.is_headquarters && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    Matriz
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-500 mt-1 flex-shrink-0" />
                  <div className="text-gray-600">
                    <p>{branch.address_line1}</p>
                    {branch.address_line2 && <p>{branch.address_line2}</p>}
                    <p>{branch.city}, {branch.state} - {branch.postal_code}</p>
                    <p>{branch.country}</p>
                  </div>
                </div>
                {branch.phone && (
                  <p className="text-gray-500 ml-6">📞 {branch.phone}</p>
                )}
                {branch.email && (
                  <p className="text-gray-500 ml-6">✉️ {branch.email}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  branch.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {branch.is_active ? 'Ativa' : 'Inativa'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(branch.id, branch.is_active)}
                    className={`transition-colors ${
                      branch.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'
                    }`}
                    title={branch.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {branch.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                  <button
                    onClick={() => handleEdit(branch)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">
              {editingBranch ? 'Editar Filial' : 'Nova Filial'}
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
                    placeholder="Filial São Paulo"
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
                    placeholder="SP01"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Endereço *
                </label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, número"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apto, sala..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="São Paulo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Estado *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SP"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    CEP *
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="01234-567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(11) 98765-4321"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="filial@empresa.com"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Filial ativa</span>
                </label>

                <label className="flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={formData.is_headquarters}
                    onChange={(e) => setFormData({ ...formData, is_headquarters: e.target.checked })}
                    className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">É matriz</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingBranch(null)
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-900 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  {editingBranch ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
