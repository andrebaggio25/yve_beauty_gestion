'use client'

import { useState } from 'react'
import { Download, DollarSign, Loader2 } from 'lucide-react'
import { generateCashFlowReport, type CashFlowData } from '@/modules/reports/cashflow-report'

export default function CashflowPage() {
  const [showUSD, setShowUSD] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('6')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CashFlowData | null>(null)

  const handleGenerateReport = async () => {
    try {
      setLoading(true)
      const result = await generateCashFlowReport({
        startDate,
        months: parseInt(selectedPeriod),
        showUSD,
      })
      setData(result)
    } catch (error) {
      console.error('Error generating cash flow report:', error)
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Fluxo de Caixa</h1>
          <p className="text-gray-500 mt-1">Projeção de entradas e saídas</p>
        </div>
        <button className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors">
          <Download size={20} />
          Exportar PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-card hover:shadow-hover transition-all duration-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">Período (meses)</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="12">12 meses</option>
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
              <DollarSign size={48} className="text-slate-600" />
              <div>
                <p className="text-gray-500 text-lg">Fluxo de Caixa será exibido aqui</p>
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
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Fluxo de Caixa Projetado</h2>
              <p className="text-gray-500 mt-1">Projeção de {selectedPeriod} meses a partir de {new Date(startDate).toLocaleDateString('pt-BR')}</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Total de Entradas</p>
                <p className="text-2xl font-semibold tracking-tight text-green-400 mt-1">{formatCurrency(data.totalReceipts)}</p>
                {showUSD && <p className="text-gray-500 text-sm mt-1">{formatCurrency(data.totalReceiptsUSD, 'USD')}</p>}
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Total de Saídas</p>
                <p className="text-2xl font-semibold tracking-tight text-red-400 mt-1">{formatCurrency(data.totalPayments)}</p>
                {showUSD && <p className="text-gray-500 text-sm mt-1">{formatCurrency(data.totalPaymentsUSD, 'USD')}</p>}
              </div>
              <div className="bg-slate-700 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Saldo Líquido</p>
                <p className={`text-2xl font-semibold tracking-tight mt-1 ${data.totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(data.totalNet)}
                </p>
                {showUSD && <p className="text-gray-500 text-sm mt-1">{formatCurrency(data.totalNetUSD, 'USD')}</p>}
              </div>
            </div>

            {/* Monthly Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Mês</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Saldo Inicial</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Entradas</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Saídas</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Saldo Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {data.months.map((month, idx) => (
                    <tr key={idx} className="hover:bg-gray-100 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{month.month}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600 font-mono">
                        {formatCurrency(month.openingBalance)}
                        {showUSD && <div className="text-xs text-gray-500">{formatCurrency(month.openingBalanceUSD, 'USD')}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-400 font-mono">
                        {formatCurrency(month.receipts)}
                        {showUSD && <div className="text-xs text-green-300">{formatCurrency(month.receiptsUSD, 'USD')}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-400 font-mono">
                        ({formatCurrency(month.payments)})
                        {showUSD && <div className="text-xs text-red-300">({formatCurrency(month.paymentsUSD, 'USD')})</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        <span className={month.closingBalance >= 0 ? 'text-gray-900 font-bold' : 'text-red-400 font-bold'}>
                          {formatCurrency(month.closingBalance)}
                        </span>
                        {showUSD && <div className="text-xs text-gray-500">{formatCurrency(month.closingBalanceUSD, 'USD')}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-4 border-t border-gray-200 hover:bg-gray-50 transition-colors">
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
