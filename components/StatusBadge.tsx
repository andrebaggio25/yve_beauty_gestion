'use client'

interface StatusBadgeProps {
  status: string
  type?: 'ap' | 'ar' | 'invoice' | 'payment' | 'generic'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const STATUS_COLORS: Record<string, Record<string, string>> = {
  ap: {
    'ABERTA': 'bg-blue-900 text-blue-200',
    'PARCIAL': 'bg-yellow-900 text-yellow-200',
    'PAGA': 'bg-green-900 text-green-200',
    'CANCELADA': 'bg-gray-900 text-gray-200',
    'VENCIDA': 'bg-red-900 text-red-200',
  },
  ar: {
    'ABERTA': 'bg-blue-900 text-blue-200',
    'PARCIAL': 'bg-yellow-900 text-yellow-200',
    'PAGA': 'bg-green-900 text-green-200',
    'CANCELADA': 'bg-gray-900 text-gray-200',
    'VENCIDA': 'bg-red-900 text-red-200',
  },
  invoice: {
    'RASCUNHO': 'bg-slate-700 text-slate-200',
    'EMITIDA': 'bg-blue-900 text-blue-200',
    'ENVIADA': 'bg-purple-900 text-purple-200',
    'PARCIAL': 'bg-yellow-900 text-yellow-200',
    'PAGA': 'bg-green-900 text-green-200',
    'CANCELADA': 'bg-gray-900 text-gray-200',
    'VENCIDA': 'bg-red-900 text-red-200',
  },
  payment: {
    'PENDENTE': 'bg-yellow-900 text-yellow-200',
    'PROCESSANDO': 'bg-blue-900 text-blue-200',
    'CONCLUÍDO': 'bg-green-900 text-green-200',
    'FALHOU': 'bg-red-900 text-red-200',
    'CANCELADO': 'bg-gray-900 text-gray-200',
  },
  generic: {
    'ATIVO': 'bg-green-900 text-green-200',
    'INATIVO': 'bg-gray-900 text-gray-200',
    'PENDENTE': 'bg-yellow-900 text-yellow-200',
    'CONCLUÍDO': 'bg-green-900 text-green-200',
    'ERRO': 'bg-red-900 text-red-200',
  },
}

const STATUS_LABELS: Record<string, string> = {
  'ABERTA': 'Aberta',
  'PARCIAL': 'Parcial',
  'PAGA': 'Paga',
  'CANCELADA': 'Cancelada',
  'VENCIDA': 'Vencida',
  'RASCUNHO': 'Rascunho',
  'EMITIDA': 'Emitida',
  'ENVIADA': 'Enviada',
  'PENDENTE': 'Pendente',
  'PROCESSANDO': 'Processando',
  'CONCLUÍDO': 'Concluído',
  'FALHOU': 'Falhou',
  'ATIVO': 'Ativo',
  'INATIVO': 'Inativo',
  'ERRO': 'Erro',
}

export function StatusBadge({
  status,
  type = 'generic',
  size = 'md',
  className = '',
}: StatusBadgeProps) {
  const colors = STATUS_COLORS[type] || STATUS_COLORS.generic
  const colorClass = colors[status] || 'bg-slate-700 text-slate-200'
  
  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }[size]

  const label = STATUS_LABELS[status] || status

  return (
    <span
      className={`inline-flex items-center rounded font-semibold transition-colors ${colorClass} ${sizeClass} ${className}`}
    >
      {label}
    </span>
  )
}
