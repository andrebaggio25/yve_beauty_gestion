'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useCallback } from 'react'

export interface AuditLogEntry {
  entity: string
  entity_id?: string
  action: 'create' | 'update' | 'delete' | 'approve' | 'send' | 'view' | 'export' | 'login'
  old_data?: Record<string, any>
  new_data?: Record<string, any>
}

export function useAuditLog() {
  const { user } = useAuth()
  const supabase = createClient()

  const logAction = useCallback(
    async (entry: AuditLogEntry) => {
      if (!user) {
        console.warn('Cannot log action: user not authenticated')
        return
      }

      try {
        const { error } = await supabase.from('audit_log').insert({
          actor_user_id: user.id,
          entity: entry.entity,
          entity_id: entry.entity_id || null,
          action: entry.action,
          old_data: entry.old_data || null,
          new_data: entry.new_data || null,
          ip: null, // Would need to be collected from request context
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        })

        if (error) throw error
      } catch (err) {
        console.error('Error logging action:', err)
      }
    },
    [user, supabase]
  )

  return {
    logAction,
  }
}
