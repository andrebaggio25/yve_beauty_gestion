'use client'

import { useState } from 'react'
import { Download, Scale, Loader2 } from 'lucide-react'
import { generateBalanceSheet, type BalanceSheetData } from '@/modules/reports/balance-sheet-report'

export default function BalancePage() {
  const [showUSD, setShowUSD] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BalanceSheetData | null>(null)

  const handleGenerateReport = async () => {
    try {
      setLoading(true)
      const result = await generateBalanceSheet({
        endDate: selectedDate,
        showUSD,
      })
      setData(result)
    } catch (error) {
      console.error('Error generating balance sheet:', error)
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Balanço Patrimonial</h1>
          <p className="text-gray-500 mt-1">Ativos, Passivos e Patrimônio Líquido</p>
        </div>
        <button className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors">
          <Download size={20} />
          Exportar PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-card hover:shadow-hover transition-all duration-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">Data</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
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
              <Scale size={48} className="text-slate-600" />
              <div>
                <p className="text-gray-500 text-lg">Balanço Patrimonial será exibido aqui</p>
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
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Balanço Patrimonial</h2>
              <p className="text-gray-500 mt-1">Data: {new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ASSETS */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight text-blue-400 border-b border-slate-600 pb-2">ATIVO</h3>
                
                {/* Current Assets */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Ativo Circulante</h4>
                  <div className="space-y-1 ml-4">
                    {data.assets.current.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-gray-600 text-sm">{item.account}</span>
                        <div className="text-right">
                          <span className="text-gray-900 font-mono text-sm">{formatCurrency(item.amount)}</span>
                          {showUSD && (
                            <span className="text-gray-500 text-xs ml-2 font-mono">
                              {formatCurrency(item.amountUSD, 'USD')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 border-t border-gray-200 hover:bg-gray-50 transition-colors font-semibold">
                      <span className="text-gray-900">Total Circulante</span>
                      <div className="text-right">
                        <span className="text-blue-400 font-mono">{formatCurrency(data.assets.current.total)}</span>
                        {showUSD && (
                          <span className="text-blue-300 text-sm ml-2 font-mono">
                            {formatCurrency(data.assets.current.totalUSD, 'USD')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Non-Current Assets */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Ativo Não Circulante</h4>
                  <div className="space-y-1 ml-4">
                    {data.assets.nonCurrent.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-gray-600 text-sm">{item.account}</span>
                        <div className="text-right">
                          <span className="text-gray-900 font-mono text-sm">{formatCurrency(item.amount)}</span>
                          {showUSD && (
                            <span className="text-gray-500 text-xs ml-2 font-mono">
                              {formatCurrency(item.amountUSD, 'USD')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 border-t border-gray-200 hover:bg-gray-50 transition-colors font-semibold">
                      <span className="text-gray-900">Total Não Circulante</span>
                      <div className="text-right">
                        <span className="text-blue-400 font-mono">{formatCurrency(data.assets.nonCurrent.total)}</span>
                        {showUSD && (
                          <span className="text-blue-300 text-sm ml-2 font-mono">
                            {formatCurrency(data.assets.nonCurrent.totalUSD, 'USD')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Assets */}
                <div className="bg-slate-700 px-4 py-3 rounded-lg">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900 text-lg">TOTAL DO ATIVO</span>
                    <div className="text-right">
                      <span className="text-blue-400 font-mono text-lg">{formatCurrency(data.assets.total)}</span>
                      {showUSD && (
                        <span className="text-blue-300 font-mono ml-2">
                          {formatCurrency(data.assets.totalUSD, 'USD')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* LIABILITIES & EQUITY */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight text-red-400 border-b border-slate-600 pb-2">PASSIVO & PATRIMÔNIO</h3>
                
                {/* Current Liabilities */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Passivo Circulante</h4>
                  <div className="space-y-1 ml-4">
                    {data.liabilities.current.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-gray-600 text-sm">{item.account}</span>
                        <div className="text-right">
                          <span className="text-gray-900 font-mono text-sm">{formatCurrency(item.amount)}</span>
                          {showUSD && (
                            <span className="text-gray-500 text-xs ml-2 font-mono">
                              {formatCurrency(item.amountUSD, 'USD')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 border-t border-gray-200 hover:bg-gray-50 transition-colors font-semibold">
                      <span className="text-gray-900">Total Circulante</span>
                      <div className="text-right">
                        <span className="text-red-400 font-mono">{formatCurrency(data.liabilities.current.total)}</span>
                        {showUSD && (
                          <span className="text-red-300 text-sm ml-2 font-mono">
                            {formatCurrency(data.liabilities.current.totalUSD, 'USD')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Non-Current Liabilities */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Passivo Não Circulante</h4>
                  <div className="space-y-1 ml-4">
                    {data.liabilities.nonCurrent.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-gray-600 text-sm">{item.account}</span>
                        <div className="text-right">
                          <span className="text-gray-900 font-mono text-sm">{formatCurrency(item.amount)}</span>
                          {showUSD && (
                            <span className="text-gray-500 text-xs ml-2 font-mono">
                              {formatCurrency(item.amountUSD, 'USD')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 border-t border-gray-200 hover:bg-gray-50 transition-colors font-semibold">
                      <span className="text-gray-900">Total Não Circulante</span>
                      <div className="text-right">
                        <span className="text-red-400 font-mono">{formatCurrency(data.liabilities.nonCurrent.total)}</span>
                        {showUSD && (
                          <span className="text-red-300 text-sm ml-2 font-mono">
                            {formatCurrency(data.liabilities.nonCurrent.totalUSD, 'USD')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Liabilities */}
                <div className="bg-slate-700 px-4 py-3 rounded-lg">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900">Total do Passivo</span>
                    <div className="text-right">
                      <span className="text-red-400 font-mono">{formatCurrency(data.liabilities.total)}</span>
                      {showUSD && (
                        <span className="text-red-300 font-mono text-sm ml-2">
                          {formatCurrency(data.liabilities.totalUSD, 'USD')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Equity */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Patrimônio Líquido</h4>
                  <div className="space-y-1 ml-4">
                    {data.equity.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span className="text-gray-600 text-sm">{item.account}</span>
                        <div className="text-right">
                          <span className="text-gray-900 font-mono text-sm">{formatCurrency(item.amount)}</span>
                          {showUSD && (
                            <span className="text-gray-500 text-xs ml-2 font-mono">
                              {formatCurrency(item.amountUSD, 'USD')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 border-t border-gray-200 hover:bg-gray-50 transition-colors font-semibold">
                      <span className="text-gray-900">Total Patrimônio Líquido</span>
                      <div className="text-right">
                        <span className="text-green-400 font-mono">{formatCurrency(data.equity.total)}</span>
                        {showUSD && (
                          <span className="text-green-300 text-sm ml-2 font-mono">
                            {formatCurrency(data.equity.totalUSD, 'USD')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Liabilities + Equity */}
                <div className="bg-slate-700 px-4 py-3 rounded-lg">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900 text-lg">TOTAL PASSIVO + PL</span>
                    <div className="text-right">
                      <span className="text-blue-400 font-mono text-lg">{formatCurrency(data.totalLiabilitiesAndEquity)}</span>
                      {showUSD && (
                        <span className="text-blue-300 font-mono ml-2">
                          {formatCurrency(data.totalLiabilitiesAndEquityUSD, 'USD')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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

