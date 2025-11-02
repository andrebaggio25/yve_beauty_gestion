'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar } from 'lucide-react'

interface AuditEntry {
  id: string
  actor_user_id: string | null
  entity: string
  entity_id: string | null
  action: string
  old_data: Record<string, any> | null
  new_data: Record<string, any> | null
  at: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [entity, setEntity] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const query = supabase
        .from('audit_log')
        .select('*')
        .order('at', { ascending: false })
        .limit(100)

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    fetchLogs()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white">Auditoria</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">De (Data)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Entidade</label>
          <input
            type="text"
            placeholder="Ex: customer, invoice..."
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleFilter}
            className="w-full bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Filtrar
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Nenhum log de auditoria encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 border-b border-slate-600">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-300">Data/Hora</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-300">Entidade</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-300">Ação</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-300">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      {new Date(log.at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      <span className="bg-slate-700 px-2 py-1 rounded text-xs">{log.entity}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.action === 'create' ? 'bg-green-900 text-green-200' :
                        log.action === 'update' ? 'bg-blue-900 text-blue-200' :
                        log.action === 'delete' ? 'bg-red-900 text-red-200' :
                        'bg-slate-600 text-slate-200'
                      }`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 truncate">
                      {log.entity_id ? `ID: ${log.entity_id.substring(0, 8)}...` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
