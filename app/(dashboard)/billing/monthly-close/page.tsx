'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuditLog } from '@/hooks/useAuditLog'
import { Plus, Calendar, TrendingUp, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react'

interface MonthlyCloseSummary {
  month: string
  year: number
  totalInvoices: number
  totalRevenue: number
  totalAR: number
  totalAP: number
  netIncome: number
  isClosed: boolean
}

export default function MonthlyClosePage() {
  const [summary, setSummary] = useState<MonthlyCloseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showCloseModal, setShowCloseModal] = useState(false)
  const supabase = createClient()
  const { logAction } = useAuditLog()

  useEffect(() => {
    fetchMonthlySummary()
  }, [selectedMonth])

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true)
      const [year, month] = selectedMonth.split('-').map(Number)
      
      // Fetch invoices for the month
      const { data: invoices, error: invError } = await supabase
        .from('invoice')
        .select('amount, status')
        .gte('issue_date', `${year}-${month.toString().padStart(2, '0')}-01`)
        .lt('issue_date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`)

      if (invError) throw invError

      // Fetch accounts receivable
      const { data: ar, error: arError } = await supabase
        .from('account_receivable')
        .select('amount, status')
        .eq('status', 'OPEN')

      if (arError) throw arError

      // Fetch accounts payable
      const { data: ap, error: apError } = await supabase
        .from('account_payable')
        .select('amount, status')
        .eq('status', 'OPEN')

      if (apError) throw apError

      const totalInvoices = invoices?.length || 0
      const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0
      const totalAR = ar?.reduce((sum, a) => sum + a.amount, 0) || 0
      const totalAP = ap?.reduce((sum, a) => sum + a.amount, 0) || 0

      setSummary({
        month: new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long' }),
        year,
        totalInvoices,
        totalRevenue,
        totalAR,
        totalAP,
        netIncome: totalRevenue - totalAP,
        isClosed: false // TODO: Implement close status check
      })
    } catch (error) {
      console.error('Error fetching monthly summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseMonth = async () => {
    try {
      await logAction({
        entity: 'monthly_close',
        entity_id: selectedMonth,
        action: 'create',
      })

      setShowCloseModal(false)
      fetchMonthlySummary()
    } catch (error) {
      console.error('Error closing month:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Fechamento Mensal</h1>
          <p className="text-gray-500 mt-1">Processe e revise o fechamento financeiro do mês</p>
        </div>
        <button 
          onClick={() => setShowCloseModal(true)}
          disabled={summary?.isClosed}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            summary?.isClosed 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800 text-white'
          }`}
        >
          <CheckCircle2 size={20} />
          {summary?.isClosed ? 'Mês Fechado' : 'Fechar Mês'}
        </button>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-4 shadow-sm">
        <label className="block text-gray-600 text-sm font-medium mb-2">
          <Calendar className="inline mr-2" size={16} />
          Selecionar Mês
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full md:w-64 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Faturas Emitidas</p>
                <FileText size={20} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-gray-900">{summary.totalInvoices}</p>
              <p className="text-gray-500 text-xs mt-1">no período</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Receita Total</p>
                <TrendingUp size={20} className="text-green-500" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-green-600">{formatCurrency(summary.totalRevenue)}</p>
              <p className="text-gray-500 text-xs mt-1">faturamento do mês</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Contas a Receber</p>
                <FileText size={20} className="text-yellow-500" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-yellow-600">{formatCurrency(summary.totalAR)}</p>
              <p className="text-gray-500 text-xs mt-1">em aberto</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 text-sm">Contas a Pagar</p>
                <FileText size={20} className="text-red-500" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-red-600">{formatCurrency(summary.totalAP)}</p>
              <p className="text-gray-500 text-xs mt-1">em aberto</p>
            </div>
          </div>

          {/* Net Income */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Resultado do Mês</p>
                <p className={`text-4xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.netIncome)}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {summary.month} de {summary.year}
                </p>
              </div>
              <div className={`text-6xl ${summary.netIncome >= 0 ? 'text-green-500/20' : 'text-red-500/20'}`}>
                <TrendingUp size={80} />
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-4">Checklist de Fechamento</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium">Todas as faturas foram emitidas</p>
                  <p className="text-gray-600 text-sm">{summary.totalInvoices} faturas processadas</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <AlertCircle size={20} className="text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium">Contas a receber pendentes</p>
                  <p className="text-gray-600 text-sm">{formatCurrency(summary.totalAR)} em aberto</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium">Contas a pagar pendentes</p>
                  <p className="text-gray-600 text-sm">{formatCurrency(summary.totalAP)} em aberto</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <AlertCircle size={20} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium">Reconciliação bancária</p>
                  <p className="text-gray-600 text-sm">Pendente de implementação</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <AlertCircle size={20} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-medium">Relatórios gerados</p>
                  <p className="text-gray-600 text-sm">DRE, Balanço e Fluxo de Caixa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                <FileText size={24} className="text-blue-500" />
                <span className="text-gray-900 font-medium">Gerar DRE</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                <FileText size={24} className="text-green-500" />
                <span className="text-gray-900 font-medium">Gerar Balanço</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                <FileText size={24} className="text-purple-500" />
                <span className="text-gray-900 font-medium">Gerar Fluxo de Caixa</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Close Month Modal */}
      {showCloseModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCloseModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Confirmar Fechamento</h2>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Você está prestes a fechar o mês de <strong className="text-gray-900">{summary?.month} de {summary?.year}</strong>.
              Esta ação não pode ser desfeita. Deseja continuar?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                Certifique-se de que todas as transações foram lançadas e reconciliadas antes de fechar o mês.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseMonth}
                className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
              >
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

