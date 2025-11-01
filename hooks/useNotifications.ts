'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

const supabase = createClient()

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Generate notifications based on business logic
  useEffect(() => {
    const generateNotifications = async () => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Check for overdue accounts
      const { data: overdueAR } = await supabase
        .from('accounts_receivable')
        .select('id, due_date')
        .eq('status', 'overdue')
        .lt('due_date', today.toISOString().split('T')[0])

      const { data: overdueAP } = await supabase
        .from('accounts_payable')
        .select('id, due_date')
        .eq('status', 'overdue')
        .lt('due_date', today.toISOString().split('T')[0])

      // Check for accounts due tomorrow
      const { data: dueTomorrowAR } = await supabase
        .from('accounts_receivable')
        .select('id, due_date')
        .eq('status', 'open')
        .eq('due_date', tomorrow.toISOString().split('T')[0])

      const { data: dueTomorrowAP } = await supabase
        .from('accounts_payable')
        .select('id, due_date')
        .eq('status', 'open')
        .eq('due_date', tomorrow.toISOString().split('T')[0])

      // Check for unsent invoices
      const { data: unsentInvoices } = await supabase
        .from('invoice')
        .select('id, number, due_date')
        .eq('status', 'issued')
        .lt('due_date', today.toISOString().split('T')[0])

      const newNotifications: Notification[] = []

      // Overdue notifications
      if (overdueAR && overdueAR.length > 0) {
        newNotifications.push({
          id: 'overdue-ar',
          type: 'error',
          title: 'Contas a Receber Vencidas',
          message: `${overdueAR.length} conta(s) a receber estão vencidas.`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/finance/receivables',
          actionLabel: 'Ver Contas',
        })
      }

      if (overdueAP && overdueAP.length > 0) {
        newNotifications.push({
          id: 'overdue-ap',
          type: 'error',
          title: 'Contas a Pagar Vencidas',
          message: `${overdueAP.length} conta(s) a pagar estão vencidas.`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/finance/payables',
          actionLabel: 'Ver Contas',
        })
      }

      // Due tomorrow notifications
      if (dueTomorrowAR && dueTomorrowAR.length > 0) {
        newNotifications.push({
          id: 'due-tomorrow-ar',
          type: 'warning',
          title: 'Vencimento Amanhã',
          message: `${dueTomorrowAR.length} conta(s) a receber vencem amanhã.`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/finance/receivables',
          actionLabel: 'Ver Contas',
        })
      }

      if (dueTomorrowAP && dueTomorrowAP.length > 0) {
        newNotifications.push({
          id: 'due-tomorrow-ap',
          type: 'warning',
          title: 'Pagamento Amanhã',
          message: `${dueTomorrowAP.length} conta(s) a pagar vencem amanhã.`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/finance/payables',
          actionLabel: 'Ver Contas',
        })
      }

      // Unsent invoices
      if (unsentInvoices && unsentInvoices.length > 0) {
        newNotifications.push({
          id: 'unsent-invoices',
          type: 'info',
          title: 'Faturas Não Enviadas',
          message: `${unsentInvoices.length} fatura(s) emitidas ainda não foram enviadas.`,
          timestamp: new Date(),
          read: false,
          actionUrl: '/billing/invoices',
          actionLabel: 'Ver Faturas',
        })
      }

      setNotifications(newNotifications)
      setUnreadCount(newNotifications.filter(n => !n.read).length)
    }

    generateNotifications()

    // Refresh every 5 minutes
    const interval = setInterval(generateNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismiss,
  }
}
