'use client'

import { usePathname } from 'next/navigation'

export function AnnouncementBar() {
    const pathname = usePathname()
    const isMarketplace = pathname?.startsWith('/marketplace')

    return (
        <div className="w-full bg-brand-primary text-white transition-all duration-500 overflow-visible">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-center min-h-[44px] py-1.5">
                <div className="text-[11px] md:text-[13px] font-bold tracking-tight animate-fade-in text-center mx-auto drop-shadow-sm">
                    {isMarketplace ? (
                        <span>Welcome to CampusHat Marketplace</span>
                    ) : (
                        <span>CampusHat Mall</span>
                    )}
                </div>
                {isMarketplace && (
                    <div className="absolute right-2 sm:right-4 lg:right-6 flex items-center">
                        <button className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg px-3 md:px-4 py-1.5 transition-all flex items-center gap-2 shadow-sm text-[10px] md:text-xs font-extrabold uppercase tracking-tight">
                            Switch Campus
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
