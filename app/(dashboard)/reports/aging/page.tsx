'use client'

import { useState, useEffect } from 'react'
import { Download, Clock } from 'lucide-react'
import { generateAgingReport } from '@/modules/reports/aging-report'

interface AgingBucket {
  label: string
  minDays: number
  maxDays: number
  total: number
  usdTotal?: number
  count: number
}

interface AgingData {
  accountsPayable: {
    buckets: AgingBucket[]
    grandTotal: number
    usdGrandTotal?: number
  }
  accountsReceivable: {
    buckets: AgingBucket[]
    grandTotal: number
    usdGrandTotal?: number
  }
}

export default function AgingPage() {
  const [reportType, setReportType] = useState<'ar' | 'ap'>('ar')
  const [showUSD, setShowUSD] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AgingData | null>(null)

  const handleGenerateReport = async () => {
    try {
      setLoading(true)
      const result = await generateAgingReport({
        startDate: '',
        endDate: new Date().toISOString().split('T')[0],
        showUSD,
      })
      setData(result)
    } catch (error) {
      console.error('Error generating aging report:', error)
      alert('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Aging Report</h1>
          <p className="text-gray-500 mt-1">Análise de vencimentos por período</p>
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
            <label className="block text-gray-600 text-sm font-medium mb-2">Tipo de Relatório</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'ar' | 'ap')}
              className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ar">Contas a Receber (AR)</option>
              <option value="ap">Contas a Pagar (AP)</option>
            </select>
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

      {/* Aging Buckets Preview */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(reportType === 'ar' ? data.accountsReceivable : data.accountsPayable).buckets.map((bucket, idx) => {
            const colors = ['text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400']
            return (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm p-4">
                <p className="text-gray-500 text-xs mb-1">{bucket.label}</p>
                <p className={`text-xl font-semibold tracking-tight ${colors[idx]}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(bucket.total)}
                </p>
                {showUSD && bucket.usdTotal !== undefined && (
                  <p className="text-slate-500 text-xs mt-1">
                    USD {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(bucket.usdTotal)}
                  </p>
                )}
                <p className="text-slate-500 text-xs mt-1">{bucket.count} item(s)</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Report Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 mt-4">Gerando relatório...</p>
          </div>
        ) : !data ? (
          <div className="p-8 text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <Clock size={48} className="text-slate-600" />
              <div>
                <p className="text-gray-500 text-lg">Aging Report</p>
                <p className="text-slate-500 text-sm mt-2">Clique em "Gerar Relatório" para visualizar</p>
              </div>
              <button 
                onClick={handleGenerateReport}
                className="mt-4 px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
              >
                Gerar Relatório
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {reportType === 'ar' ? 'Contas a Receber' : 'Contas a Pagar'} - Aging Analysis
              </h3>
              <div className="text-right">
                <p className="text-gray-500 text-sm">Total Geral</p>
                <p className="text-2xl font-semibold tracking-tight text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(reportType === 'ar' ? data.accountsReceivable.grandTotal : data.accountsPayable.grandTotal)}
                </p>
                {showUSD && (
                  <p className="text-gray-500 text-sm mt-1">
                    USD {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(reportType === 'ar' ? data.accountsReceivable.usdGrandTotal || 0 : data.accountsPayable.usdGrandTotal || 0)}
                  </p>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Período</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Valor</th>
                    {showUSD && <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">USD</th>}
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Quantidade</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {(reportType === 'ar' ? data.accountsReceivable : data.accountsPayable).buckets.map((bucket, idx) => {
                    const total = reportType === 'ar' ? data.accountsReceivable.grandTotal : data.accountsPayable.grandTotal
                    const percentage = total > 0 ? (bucket.total / total) * 100 : 0
                    return (
                      <tr key={idx} className="hover:bg-gray-100 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">{bucket.label}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(bucket.total)}
                        </td>
                        {showUSD && (
                          <td className="px-4 py-3 text-sm text-gray-500 text-right font-mono">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(bucket.usdTotal || 0)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{bucket.count}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{percentage.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

