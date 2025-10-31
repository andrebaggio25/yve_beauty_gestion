'use client'

import { useState } from 'react'
import { Download, Filter } from 'lucide-react'

export default function LedgerPage() {
  const [showUSD, setShowUSD] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Razão Geral (Ledger)</h1>
          <p className="text-gray-500 mt-1">Visualize todas as transações contábeis por conta</p>
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
            <label className="block text-gray-600 text-sm font-medium mb-2">Período</label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">Conta</label>
            <select className="w-full px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Todas as Contas</option>
              <option>1000 - Caixa</option>
              <option>1100 - Bancos</option>
              <option>2000 - Fornecedores</option>
              <option>3000 - Receitas</option>
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

      {/* Report Table */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <Filter size={48} className="text-slate-600" />
            <div>
              <p className="text-gray-500 text-lg">Relatório será exibido aqui</p>
              <p className="text-slate-500 text-sm mt-2">Selecione os filtros e clique em "Gerar Relatório"</p>
            </div>
            <button className="mt-4 px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors">
              Gerar Relatório
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

