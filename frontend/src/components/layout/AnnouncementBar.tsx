'use client'

import { usePathname } from 'next/navigation'

export function AnnouncementBar() {
    const pathname = usePathname()
    const isMarketplace = pathname?.startsWith('/marketplace')

    return (
        <div className="w-full bg-brand-primary text-white text-center py-2 text-sm font-medium">
            {isMarketplace ? (
                <div className="container mx-auto flex items-center justify-between px-4">
                    <span />
                    <span>Welcome to CampusHat Marketplace</span>
                    <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-btn transition-colors uppercase tracking-wide font-semibold">
                        Switch Campus
                    </button>
                </div>
            ) : (
                <span className="tracking-wide">CampusHat Mall</span>
            )}
        </div>
    )
}
