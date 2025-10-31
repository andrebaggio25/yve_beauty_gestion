'use client'

import { useAuth } from '@/lib/contexts/auth-context'

export default function DashboardPage() {
  const { userProfile } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Bem-vindo ao Yve Gestión, {userProfile?.preferred_locale === 'pt-BR' ? 'bem-vindo de volta!' : ''}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-card hover:shadow-hover transition-all p-6">
          <p className="text-gray-600 text-sm font-medium">Total a Receber</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-2">R$ 0,00</p>
          <p className="text-gray-500 text-xs mt-2">Sem dados ainda</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-card hover:shadow-hover transition-all p-6">
          <p className="text-gray-600 text-sm font-medium">Total a Pagar</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-2">R$ 0,00</p>
          <p className="text-gray-500 text-xs mt-2">Sem dados ainda</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-card hover:shadow-hover transition-all p-6">
          <p className="text-gray-600 text-sm font-medium">Faturas Emitidas</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-2">0</p>
          <p className="text-gray-500 text-xs mt-2">Este mês</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-card hover:shadow-hover transition-all p-6">
          <p className="text-gray-600 text-sm font-medium">Receita do Mês</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-2">R$ 0,00</p>
          <p className="text-gray-500 text-xs mt-2">Competência</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-card hover:shadow-hover transition-all p-6">
          <p className="text-gray-600 text-sm font-medium">Contas Vencidas</p>
          <p className="text-2xl font-semibold tracking-tight text-red-600 mt-2">0</p>
          <p className="text-gray-500 text-xs mt-2">AP e AR</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-card hover:shadow-hover transition-all p-6">
          <p className="text-gray-600 text-sm font-medium">Fluxo de Caixa</p>
          <p className="text-2xl font-semibold tracking-tight text-green-600 mt-2">R$ 0,00</p>
          <p className="text-gray-500 text-xs mt-2">Saldo estimado</p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h2>
        <p className="text-gray-500 text-center py-8">Nenhuma atividade registrada ainda</p>
      </div>
    </div>
  )
}
