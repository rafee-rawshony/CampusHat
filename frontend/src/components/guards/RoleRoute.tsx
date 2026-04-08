import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

interface RoleRouteProps {
  children: React.ReactNode
  allowed: () => boolean
  fallback?: string
}

export function RoleRoute({ children, allowed, fallback = '/unauthorized' }: RoleRouteProps) {
  const store = useAuthStore()
  if (!store.isAuthenticated) return <Navigate to="/auth/login" replace />
  if (!allowed()) return <Navigate to={fallback} replace />
  return <>{children}</>
}
