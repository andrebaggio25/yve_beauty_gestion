'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Wallet, 
  FileText, 
  Users, 
  Users2, 
  Settings,
  LogOut,
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileCheck,
  FileInput,
  FileOutput,
  Calendar,
  Building,
  Building2,
  UserCog,
  Shield,
  CreditCard,
  DollarSign,
  PieChart,
  Landmark
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CompanyLogoWithName } from '@/components/CompanyLogo'

interface SubMenuItem {
  href: string
  label: string
  icon: any
}

interface NavItem {
  href?: string
  label: string
  icon: any
  subItems?: SubMenuItem[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { 
    label: 'Financeiro', 
    icon: Wallet,
    subItems: [
      { href: '/finance/accounts-payable', label: 'Contas a Pagar', icon: FileOutput },
      { href: '/finance/accounts-receivable', label: 'Contas a Receber', icon: FileInput },
      { href: '/finance/provisions', label: 'Provisões', icon: FileCheck },
    ]
  },
  { 
    label: 'Faturamento', 
    icon: FileText,
    subItems: [
      { href: '/billing/contracts', label: 'Contratos', icon: FileText },
      { href: '/billing/invoices', label: 'Faturas', icon: FileCheck },
      { href: '/billing/monthly-close', label: 'Fechamento Mensal', icon: Calendar },
    ]
  },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/employees', label: 'Funcionários', icon: Users2 },
  { 
    label: 'Relatórios', 
    icon: BarChart3,
    subItems: [
      { href: '/reports/ledger', label: 'Razão Geral', icon: BarChart3 },
      { href: '/reports/pnl', label: 'DRE (P&L)', icon: PieChart },
      { href: '/reports/balance', label: 'Balanço', icon: DollarSign },
      { href: '/reports/cashflow', label: 'Fluxo de Caixa', icon: Wallet },
      { href: '/reports/aging', label: 'Aging Report', icon: Calendar },
    ]
  },
  { 
    label: 'Configurações', 
    icon: Settings,
    subItems: [
      { href: '/settings/company', label: 'Empresa', icon: Building },
      { href: '/settings/branches', label: 'Filiais', icon: Building2 },
      { href: '/settings/users', label: 'Usuários', icon: Users },
      { href: '/settings/roles', label: 'Papéis', icon: Shield },
      { href: '/settings/payment-methods', label: 'Métodos de Pagamento', icon: CreditCard },
      { href: '/settings/currencies', label: 'Moedas', icon: DollarSign },
      { href: '/settings/chart-of-accounts', label: 'Plano de Contas', icon: PieChart },
      { href: '/settings/tax', label: 'Configurações Fiscais', icon: Landmark },
    ]
  },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isMenuExpanded = (label: string) => expandedMenus.includes(label)
  
  const isActive = (href?: string, subItems?: SubMenuItem[]) => {
    if (href) {
      return pathname === href || pathname.startsWith(href + '/')
    }
    if (subItems) {
      return subItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    }
    return false
  }

  return (
    <>
      {/* Mobile Bottom Navigation - Simplified */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
        <div className="flex justify-around">
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs border-t-2 transition-colors ${
              pathname === '/dashboard'
                ? 'border-black text-black bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={20} className="mb-1" />
            <span className="truncate">Dashboard</span>
          </Link>
          <Link
            href="/finance/accounts-payable"
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs border-t-2 transition-colors ${
              pathname.startsWith('/finance')
                ? 'border-black text-black bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Wallet size={20} className="mb-1" />
            <span className="truncate">Financeiro</span>
          </Link>
          <Link
            href="/customers"
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs border-t-2 transition-colors ${
              pathname.startsWith('/customers')
                ? 'border-black text-black bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users size={20} className="mb-1" />
            <span className="truncate">Clientes</span>
          </Link>
          <Link
            href="/reports/ledger"
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs border-t-2 transition-colors ${
              pathname.startsWith('/reports')
                ? 'border-black text-black bg-gray-50'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <BarChart3 size={20} className="mb-1" />
            <span className="truncate">Relatórios</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} className="mb-1" />
            <span>Sair</span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar with Accordion Menus */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <CompanyLogoWithName />
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {navItems.map((item) => {
            const active = isActive(item.href, item.subItems)
            const expanded = isMenuExpanded(item.label)
            
            if (item.subItems) {
              // Menu with sub-items (accordion)
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium tracking-wide transition-colors ${
                      active
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </div>
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {expanded && (
                    <div className="bg-gray-50">
                      {item.subItems.map((subItem) => {
                        const subActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center gap-3 pl-12 pr-6 py-2.5 text-sm transition-colors ${
                              subActive
                                ? 'bg-black text-white border-l-4 border-gray-800'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <subItem.icon size={16} />
                            <span>{subItem.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            } else {
              // Simple menu item
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`flex items-center gap-3 px-6 py-3 text-sm font-medium tracking-wide transition-colors ${
                    active
                      ? 'bg-black text-white border-l-4 border-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            }
          })}
        </nav>

        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
