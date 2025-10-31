'use client'

import { useState } from 'react'
import { Download, TrendingUp, Loader2 } from 'lucide-react'
import { generatePnLReport, type PnLData } from '@/modules/reports/pnl-report'
import { exportPnLToPDF } from '@/modules/exports/pdf-export'

export default function PnLPage() {
  const [showUSD, setShowUSD] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PnLData | null>(null)

  const handleExportPDF = async () => {
    if (!data) {
      alert('Gere o relatório primeiro')
      return
    }
    await exportPnLToPDF(data, selectedPeriod)
  }

  const handleGenerateReport = async () => {
    try {
      setLoading(true)
      const [year, month] = selectedPeriod.split('-')
      const startDate = `${year}-${month}-01`
      const lastDay = new Date(Number(year), Number(month), 0).getDate()
      const endDate = `${year}-${month}-${lastDay}`

      const result = await generatePnLReport({
        startDate,
        endDate,
        showUSD,
      })
      setData(result)
    } catch (error) {
      console.error('Error generating P&L report:', error)
      alert('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">DRE - Demonstração do Resultado</h1>
          <p className="text-gray-500 mt-1">Relatório de receitas, despesas e lucro líquido</p>
        </div>
        <button 
          onClick={handleExportPDF}
          disabled={!data || loading}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white disabled:text-gray-500 px-4 py-2.5 rounded-lg transition-all font-medium shadow-card hover:shadow-hover"
        >
          <Download size={20} />
          Exportar PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-card hover:shadow-hover transition-all duration-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">Período</label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">Filial</label>
            <select className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Todas</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">Exibir em</label>
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={showUSD}
                  onChange={(e) => setShowUSD(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Mostrar USD</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {!data ? (
          <div className="p-8 text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <TrendingUp size={48} className="text-slate-600" />
              <div>
                <p className="text-gray-500 text-lg">DRE será exibida aqui</p>
                <p className="text-slate-500 text-sm mt-2">Selecione os filtros e clique em "Gerar Relatório"</p>
              </div>
              <button 
                onClick={handleGenerateReport}
                disabled={loading}
                className="mt-4 px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                Gerar Relatório
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="text-center border-b border-gray-200 hover:bg-gray-50 transition-colors pb-4">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Demonstração do Resultado do Exercício</h2>
              <p className="text-gray-500 mt-1">Período: {selectedPeriod}</p>
            </div>

            {/* Revenues */}
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Receitas</h3>
              <div className="space-y-2">
                {data.revenues.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600">{item.account}</span>
                    <div className="text-right">
                      <span className="text-gray-900 font-mono">{formatCurrency(item.amount)}</span>
                      {showUSD && (
                        <span className="text-gray-500 text-sm ml-4 font-mono">
                          {formatCurrency(item.amountUSD, 'USD')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 bg-slate-700 px-4 rounded font-bold">
                  <span className="text-gray-900">Total de Receitas</span>
                  <div className="text-right">
                    <span className="text-green-400 font-mono text-lg">{formatCurrency(data.revenues.total)}</span>
                    {showUSD && (
                      <span className="text-green-300 text-sm ml-4 font-mono">
                        {formatCurrency(data.revenues.totalUSD, 'USD')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3">Despesas</h3>
              <div className="space-y-2">
                {data.expenses.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600">{item.account}</span>
                    <div className="text-right">
                      <span className="text-gray-900 font-mono">({formatCurrency(item.amount)})</span>
                      {showUSD && (
                        <span className="text-gray-500 text-sm ml-4 font-mono">
                          ({formatCurrency(item.amountUSD, 'USD')})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 bg-slate-700 px-4 rounded font-bold">
                  <span className="text-gray-900">Total de Despesas</span>
                  <div className="text-right">
                    <span className="text-red-400 font-mono text-lg">({formatCurrency(data.expenses.total)})</span>
                    {showUSD && (
                      <span className="text-red-300 text-sm ml-4 font-mono">
                        ({formatCurrency(data.expenses.totalUSD, 'USD')})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="border-t-2 border-slate-600 pt-4">
              <div className="flex justify-between items-center py-4 bg-slate-700 px-6 rounded-lg">
                <span className="text-gray-900 text-xl font-semibold tracking-tight">Lucro Líquido</span>
                <div className="text-right">
                  <span className={`font-mono text-2xl font-semibold tracking-tight ${
                    data.netIncome >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(data.netIncome)}
                  </span>
                  {showUSD && (
                    <span className={`text-lg ml-4 font-mono ${
                      data.netIncomeUSD >= 0 ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {formatCurrency(data.netIncomeUSD, 'USD')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-4">
              <button 
                onClick={handleGenerateReport}
                className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
              >
                Atualizar Relatório
              </button>
              <button className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2">
                <Download size={18} />
                Exportar PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

