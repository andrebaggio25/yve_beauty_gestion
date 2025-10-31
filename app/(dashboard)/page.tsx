'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, FileText, AlertCircle, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { MoneyDisplay } from '@/components/MoneyDisplay'
import { getDashboardKPIs, getRevenueChartData, getCurrencyDistribution, getRecentActivity, type RevenueChartData, type CurrencyDistribution } from '@/modules/dashboard/kpi-service'

interface RecentActivity {
  id: string
  type: string
  description: string
  date: string
  amount?: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([])
  const [currencyData, setCurrencyData] = useState<CurrencyDistribution[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const [kpisData, revenueChart, currencyDist, activities] = await Promise.all([
          getDashboardKPIs(),
          getRevenueChartData(),
          getCurrencyDistribution(),
          getRecentActivity(),
        ])
        setKpis(kpisData)
        setRevenueData(revenueChart)
        setCurrencyData(currencyDist)
        setRecentActivity(activities)
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 animate-pulse shadow-sm">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!kpis) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg">
          Erro ao carregar dados do dashboard
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total a Receber</p>
              <MoneyDisplay
                amount={kpis.totalReceivable}
                currency="USD"
                size="lg"
                className="mt-2"
              />
            </div>
            <ArrowUpRight className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total a Pagar</p>
              <MoneyDisplay
                amount={kpis.totalPayable}
                currency="USD"
                size="lg"
                className="mt-2"
              />
            </div>
            <ArrowDownRight className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Faturas Emitidas</p>
              <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-2">{kpis.invoicesThisMonth}</p>
              <p className="text-slate-500 text-xs mt-1">Este mês</p>
            </div>
            <FileText className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Receita do Mês</p>
              <MoneyDisplay
                amount={kpis.revenueThisMonth}
                currency="USD"
                size="lg"
                className="mt-2"
              />
              <p className="text-slate-500 text-xs mt-1">Competência</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Contas Vencidas</p>
              <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-2">{kpis.overdueAccounts}</p>
              <p className="text-slate-500 text-xs mt-1">AP + AR</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Fluxo de Caixa</p>
              <MoneyDisplay
                amount={kpis.cashFlowEstimate}
                currency="USD"
                size="lg"
                className="mt-2"
              />
              <p className="text-slate-500 text-xs mt-1">Estimativa</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Receita Mensal (USD)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Receita']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Currency Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Moeda</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currencyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="amount"
                  label={({ currency, percentage }) => `${currency} (${percentage.toFixed(1)}%)`}
                >
                  {currencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Valor']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Nenhuma atividade registrada ainda</p>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0">
                <div>
                  <p className="text-gray-900 text-sm font-medium">{activity.description}</p>
                  <p className="text-gray-600 text-xs">{new Date(activity.date).toLocaleDateString('pt-BR')}</p>
                </div>
                {activity.amount && (
                  <MoneyDisplay
                    amount={activity.amount}
                    currency="USD"
                    size="sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
