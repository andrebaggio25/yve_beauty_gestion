'use client'

import React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Clientes',
  '/employees': 'Funcionários',
  '/finance': 'Financeiro',
  '/billing': 'Faturamento',
  '/reports': 'Relatórios',
  '/settings': 'Configurações',
  '/new': 'Novo',
  '/edit': 'Editar',
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if not provided
  if (!items) {
    items = generateBreadcrumbsFromPath(pathname)
  }

  if (items.length === 0) return null

  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
      >
        <Home size={14} />
        <span className="sr-only">Dashboard</span>
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="text-gray-400" />
          {item.href && index < items.length - 1 ? (
            <Link
              href={item.href}
              className="hover:text-blue-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  let currentPath = ''

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`

    // Skip 'dashboard' as it's already shown as home
    if (segment === 'dashboard') continue

    // Handle dynamic routes
    if (segment.startsWith('[') && segment.endsWith(']')) {
      // This is a dynamic segment, try to get the actual value
      const label = segment === '[id]' ? 'Detalhes' : segment.replace(/[\[\]]/g, '')
      breadcrumbs.push({ label })
      continue
    }

    const label = ROUTE_LABELS[`/${segment}`] || segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({
      label,
      href: i < segments.length - 1 ? currentPath : undefined,
    })
  }

  return breadcrumbs
}
