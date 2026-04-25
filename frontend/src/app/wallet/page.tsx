'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'

/**
 * /wallet — smart redirect.
 * Sellers go to their dedicated seller wallet; everyone else goes to account.
 * Unauthenticated users are caught by middleware and sent to login.
 */
export default function WalletRedirectPage() {
    const { isSeller, isAdmin, isModerator, _hasHydrated } = useAuthStore()

    useEffect(() => {
        if (!_hasHydrated) return
        if (isSeller() || isAdmin() || isModerator()) {
            window.location.href = '/seller/wallet'
        } else {
            window.location.href = '/account'
        }
    }, [_hasHydrated, isSeller, isAdmin, isModerator])

    return null
}
