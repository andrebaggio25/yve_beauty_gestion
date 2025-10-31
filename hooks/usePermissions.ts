'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function usePermissions() {
  const { userProfile } = useAuth()
  const supabase = createClient()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!userProfile) {
        setLoading(false)
        return
      }

      try {
        // Get user roles
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_role')
          .select('role_id')
          .eq('user_profile_id', userProfile.id)

        if (rolesError) throw rolesError

        const roleIds = userRoles?.map((ur) => ur.role_id) || []

        // Get permissions for those roles
        const { data: rolePermissions, error: permsError } = await supabase
          .from('role_permission')
          .select('permission_id')
          .in('role_id', roleIds)

        if (permsError) throw permsError

        const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || []

        // Get permission details
        const { data: permDetails, error: detailError } = await supabase
          .from('permission')
          .select('resource, action')
          .in('id', permissionIds)

        if (detailError) throw detailError

        const permStrings = permDetails?.map((p) => `${p.resource}:${p.action}`) || []
        setPermissions(permStrings)
      } catch (error) {
        console.error('Error fetching permissions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [userProfile, supabase])

  const hasPermission = (resource: string, action: string): boolean => {
    return permissions.includes(`${resource}:${action}`)
  }

  const hasAnyPermission = (resourceActions: Array<{ resource: string; action: string }>): boolean => {
    return resourceActions.some((ra) => hasPermission(ra.resource, ra.action))
  }

  const hasAllPermissions = (resourceActions: Array<{ resource: string; action: string }>): boolean => {
    return resourceActions.every((ra) => hasPermission(ra.resource, ra.action))
  }

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}
