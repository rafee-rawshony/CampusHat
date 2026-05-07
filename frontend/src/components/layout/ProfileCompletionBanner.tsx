'use client'

/**
 * Site-wide banner that nudges normal users to complete their profile.
 *
 * Only shown when:
 *   - user is authenticated AND
 *   - profile is incomplete (is_profile_complete === false) AND
 *   - the user has not dismissed it during this session AND
 *   - we're not already on the /account/* dashboard (no need to nag).
 *
 * Profile completion is *optional* in CampusHat, but mandatory for
 * checking out from the Mall — see the checkout gate.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

const DISMISS_KEY = 'campushat-profile-banner-dismissed'

export function ProfileCompletionBanner() {
    const { user, isAuthenticated, _hasHydrated } = useAuthStore()
    const pathname = usePathname() || ''
    const [dismissed, setDismissed] = useState(false)

    // Read the per-session dismiss flag once on mount.
    useEffect(() => {
        if (typeof window === 'undefined') return
        setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
    }, [])

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISS_KEY, '1')
        setDismissed(true)
    }

    if (!_hasHydrated || !isAuthenticated || !user) return null
    if (user.is_profile_complete) return null
    if (dismissed) return null
    // Don't nag the user when they're already in the dashboard fixing it.
    if (pathname.startsWith('/account')) return null
    // Don't show during auth flows.
    if (pathname.startsWith('/auth')) return null

    const percent = user.profile_completion_percent ?? 0

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
            <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="flex-1 text-sm">
                    <span className="font-semibold text-amber-900">
                        Complete your profile ({percent}%)
                    </span>
                    <span className="text-amber-800 hidden sm:inline">
                        {' '}— required for buying products from the Mall.
                    </span>
                </div>
                <Link
                    href="/account"
                    className="text-xs font-bold uppercase tracking-wide bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md whitespace-nowrap"
                >
                    Complete Now
                </Link>
                <button
                    onClick={handleDismiss}
                    className="text-amber-700 hover:text-amber-900 p-1"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
