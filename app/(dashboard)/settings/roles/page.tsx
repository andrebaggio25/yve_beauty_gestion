'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Shield, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  is_active: boolean
  created_at: string
}

const AVAILABLE_PERMISSIONS = [
  { id: 'finance.view', label: 'Visualizar Finanças', category: 'Financeiro' },
  { id: 'finance.edit', label: 'Editar Finanças', category: 'Financeiro' },
  { id: 'finance.delete', label: 'Deletar Finanças', category: 'Financeiro' },
  { id: 'customers.view', label: 'Visualizar Clientes', category: 'Clientes' },
  { id: 'customers.edit', label: 'Editar Clientes', category: 'Clientes' },
  { id: 'customers.delete', label: 'Deletar Clientes', category: 'Clientes' },
  { id: 'employees.view', label: 'Visualizar Funcionários', category: 'RH' },
  { id: 'employees.edit', label: 'Editar Funcionários', category: 'RH' },
  { id: 'employees.delete', label: 'Deletar Funcionários', category: 'RH' },
  { id: 'reports.view', label: 'Visualizar Relatórios', category: 'Relatórios' },
  { id: 'reports.export', label: 'Exportar Relatórios', category: 'Relatórios' },
  { id: 'settings.view', label: 'Visualizar Configurações', category: 'Configurações' },
  { id: 'settings.edit', label: 'Editar Configurações', category: 'Configurações' },
  { id: 'users.manage', label: 'Gerenciar Usuários', category: 'Admin' },
  { id: 'audit.view', label: 'Visualizar Auditoria', category: 'Admin' },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    is_active: true,
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('role')
        .select('*')
        .order('name')

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingRole) {
        const { error } = await supabase
          .from('role')
          .update(formData)
          .eq('id', editingRole.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('role')
          .insert([formData])

        if (error) throw error
      }

      setShowModal(false)
      setEditingRole(null)
      setFormData({ name: '', description: '', permissions: [], is_active: true })
      fetchRoles()
    } catch (error) {
      console.error('Error saving role:', error)
      alert('Erro ao salvar perfil')
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
      is_active: role.is_active,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este perfil?')) return

    try {
      const { error } = await supabase
        .from('role')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchRoles()
    } catch (error) {
      console.error('Error deleting role:', error)
      alert('Erro ao deletar perfil. Ele pode estar em uso.')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('role')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchRoles()
    } catch (error) {
      console.error('Error toggling role:', error)
    }
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Perfis e Permissões</h1>
          <p className="text-gray-500 mt-1">Gerencie perfis de acesso e suas permissões</p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null)
            setFormData({ name: '', description: '', permissions: [], is_active: true })
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Perfil
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total de Perfis</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{roles.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Perfis Ativos</p>
          <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">
            {roles.filter(r => r.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Permissões Disponíveis</p>
          <p className="text-2xl font-semibold tracking-tight text-blue-400 mt-1">{AVAILABLE_PERMISSIONS.length}</p>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Shield size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-gray-500">Nenhum perfil cadastrado</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Criar primeiro perfil
            </button>
          </div>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-5 hover:border-slate-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
                    <Shield size={20} className="text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold text-lg">{role.name}</h3>
                    <p className="text-gray-500 text-sm">{role.description}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-gray-500 text-sm font-medium">Permissões:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions && role.permissions.length > 0 ? (
                    role.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-700 text-gray-600 text-xs rounded"
                      >
                        {perm.split('.')[1]}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">Nenhuma permissão</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 hover:bg-gray-50 transition-colors">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  role.is_active ? 'bg-green-900 text-green-200' : 'bg-slate-700 text-gray-600'
                }`}>
                  {role.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(role.id, role.is_active)}
                    className={`transition-colors ${
                      role.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'
                    }`}
                    title={role.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {role.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                  <button
                    onClick={() => handleEdit(role)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
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
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">
              {editingRole ? 'Editar Perfil' : 'Novo Perfil'}
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
                    placeholder="Gerente Financeiro"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-gray-600">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Perfil ativo</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva as responsabilidades deste perfil..."
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-3">
                  Permissões
                </label>
                <div className="space-y-4 max-h-80 overflow-y-auto bg-white rounded-lg p-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category}>
                      <h4 className="text-blue-400 font-semibold mb-2">{category}</h4>
                      <div className="space-y-2 ml-4">
                        {perms.map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-gray-900">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  {formData.permissions.length} permissão(ões) selecionada(s)
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingRole(null)
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-900 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  {editingRole ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
