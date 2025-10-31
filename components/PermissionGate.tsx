'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { ReactNode } from 'react'

interface PermissionGateProps {
  resource: string
  action: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ resource, action, children, fallback }: PermissionGateProps) {
  const { hasPermission, loading } = usePermissions()

  if (loading) {
    return <>{fallback || null}</>
  }

  if (!hasPermission(resource, action)) {
    return <>{fallback || null}</>
  }

  return <>{children}</>
}
