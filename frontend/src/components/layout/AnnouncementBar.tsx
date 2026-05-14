'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useCampusStore } from '@/stores/campus.store'
import { CampusSwitcher } from '@/components/layout/CampusSwitcher'

export function AnnouncementBar() {
    const pathname = usePathname()
    const isMarketplace = pathname?.startsWith('/marketplace')
    const { selectedCampusName } = useCampusStore()
    const [status, setStatus] = useState<'connected' | 'error' | 'loading'>('loading')

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                // Try the actual API — /health/ may not exist on all backends
                const res = await fetch(`${baseUrl}/universities/`, {
                    method: 'GET',
                    mode: 'cors',
                    signal: AbortSignal.timeout(5000),
                })
                setStatus(res.ok ? 'connected' : 'error')
            } catch {
                setStatus('error')
            }
        }
        checkHealth()
        // Re-check every 30 seconds
        const interval = setInterval(checkHealth, 30000)
        return () => clearInterval(interval)
    }, [])

    const getWelcomeMessage = () => {
        if (!isMarketplace) return <span>CampusHat Mall</span>
        if (selectedCampusName) {
            return (
                <>
                    Welcome to <span className="text-white font-extrabold italic">&apos;{selectedCampusName}&apos;</span> CampusHat Marketplace
                </>
            )
        }
        return <span>Welcome to CampusHat Marketplace</span>
    }

    return (
        <div className="bg-[#4C3B8A] text-white transition-all duration-500 overflow-visible">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-center min-h-[44px] py-1.5">
                {/* Status Indicator (Left) — commented out, set to true to re-enable */}
                {false && (
                <div className="absolute left-4 hidden md:flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase opacity-80 tracking-widest">System Status:</span>
                    <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full border border-white/10">
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                            {status === 'connected' ? 'API ACTIVE' : status === 'error' ? 'DISCONNECTED' : 'CHECKING...'}
                        </span>
                    </div>
                </div>
                )}

                {/* Centered Message */}
                <div className="text-[11px] md:text-[13px] font-bold tracking-tight text-center mx-auto drop-shadow-sm">
                    {getWelcomeMessage()}
                </div>

                {/* Campus Switcher (Right) */}
                {isMarketplace && (
                    <div className="absolute right-2 sm:right-4 lg:right-6 hidden md:flex items-center z-50">
                        <CampusSwitcher />
                    </div>
                )}
            </div>
        </div>
    )
}
