'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function AnnouncementBar() {
    const pathname = usePathname()
    const isMarketplace = pathname?.startsWith('/marketplace')
    const [status, setStatus] = useState<'connected' | 'error' | 'loading'>('loading')

    useEffect(() => {
        const checkHealth = async () => {
            try {
                // Health endpoint is at /api/health/ (outside /api/v1/)
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                const healthUrl = baseUrl.replace(/\/v1\/?$/, '/health/')
                await fetch(healthUrl, { method: 'GET', mode: 'cors' })
                setStatus('connected')
            } catch (err) {
                setStatus('error')
            }
        }
        checkHealth()
    }, [])

    return (
        <div className="w-full bg-brand-primary text-white transition-all duration-500 overflow-visible">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-center min-h-[44px] py-1.5">
                {/* Status Indicator (Left) */}
                <div className="absolute left-4 lg:left-8 hidden md:flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase opacity-80 tracking-widest">System Status:</span>
                    <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full border border-white/10">
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                            {status === 'connected' ? 'API ACTIVE' : status === 'error' ? 'DISCONNECTED' : 'CHECKING...'}
                        </span>
                    </div>
                </div>

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
