'use client'

import { useAuthStore, UserRole } from '@/stores/auth.store'
import { UpgradePrompt } from './UpgradePrompt'

interface RoleGuardProps {
    requiredRole?: UserRole | UserRole[]
    requireVerified?: boolean
    fallback?: React.ReactNode
    children: React.ReactNode
}

export function RoleGuard({
    requiredRole,
    requireVerified = false,
    fallback,
    children,
}: RoleGuardProps) {
    const { user, isAuthenticated } = useAuthStore()

    if (!isAuthenticated || !user) {
        return fallback || <UpgradePrompt message="Please sign in to access this feature" />
    }

    if (requireVerified && !['student', 'faculty', 'seller', 'admin', 'moderator'].includes(user.role)) {
        return fallback || <UpgradePrompt />
    }

    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        if (!roles.includes(user.role)) {
            return fallback || <UpgradePrompt message="You don't have permission to access this feature" />
        }
    }

    return <>{children}</>
}
