'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Users, Edit2, Trash2, CheckCircle, XCircle, Mail, Shield } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  last_sign_in_at: string | null
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    password: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Note: In a real app, you'd fetch from a custom users table or admin API
      // For now, we'll use auth.users which requires admin privileges
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // This would typically call an admin function or API endpoint
      // For demonstration, we'll show the concept
      alert(`Convite enviado para ${formData.email}!\n\nEm produção, isso enviaria um email de convite com link de cadastro.`)
      
      setShowModal(false)
      setFormData({
        email: '',
        full_name: '',
        role: 'user',
        password: '',
      })
    } catch (error) {
      console.error('Error inviting user:', error)
      alert('Erro ao convidar usuário')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profile')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error('Error toggling user:', error)
    }
  }

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-900 text-purple-200',
      manager: 'bg-blue-900 text-blue-200',
      user: 'bg-slate-700 text-gray-600',
    }
    return styles[role] || styles.user
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      user: 'Usuário',
    }
    return labels[role] || role
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Usuários do Sistema</h1>
          <p className="text-gray-500 mt-1">Gerencie usuários e suas permissões</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Convidar Usuário
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Total de Usuários</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Usuários Ativos</p>
          <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">
            {users.filter(u => u.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Administradores</p>
          <p className="text-2xl font-semibold tracking-tight text-purple-400 mt-1">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
          <p className="text-gray-500 text-sm">Gerentes</p>
          <p className="text-2xl font-semibold tracking-tight text-blue-400 mt-1">
            {users.filter(u => u.role === 'manager').length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-gray-500">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Usuário</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Perfil</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Último Acesso</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                          <span className="text-gray-900 font-semibold">
                            {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{user.full_name || 'Sem nome'}</p>
                          <p className="text-gray-500 text-xs">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-500" />
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-gray-500" />
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadge(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.is_active ? 'bg-green-900 text-green-200' : 'bg-slate-700 text-gray-600'
                      }`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className={`transition-colors inline-flex items-center gap-1 ${
                          user.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'
                        }`}
                        title={user.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {user.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">Convidar Novo Usuário</h2>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="João Silva"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm font-medium mb-2">
                  Perfil *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="user">Usuário</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-slate-500 text-xs mt-1">
                  O usuário receberá um email para criar sua senha
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-900 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
