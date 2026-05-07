'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface PlatformStats {
    universities: number
    students: number
    listings: number
}

export function AuthHeroPanel() {
    const [stats, setStats] = useState<PlatformStats>({ universities: 17, students: 10000, listings: 5000 })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [uniRes] = await Promise.allSettled([
                    api.get('/universities/'),
                ])
                if (uniRes.status === 'fulfilled') {
                    const d = uniRes.value.data?.data ?? uniRes.value.data
                    const list = Array.isArray(d) ? d : (d?.results ?? [])
                    if (list.length > 0) setStats(prev => ({ ...prev, universities: list.length }))
                }
            } catch { /* fallback to defaults */ }
        }
        fetchStats()
    }, [])

    const formatCount = (n: number) => {
        if (n >= 1000) return `${Math.floor(n / 1000)}k+`
        return `${n}+`
    }

    return (
        <div className="hidden lg:flex w-[45%] xl:w-[42%] relative bg-gradient-to-br from-[#45357A] via-[#4C3B8A] to-[#3a2d66] items-center justify-center p-12 overflow-hidden flex-shrink-0">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-20 w-[500px] h-[500px] rounded-full bg-white/5 blur-[80px]" />
                <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full bg-purple-900/30 blur-[80px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-white/[0.03] blur-[60px]" />
            </div>

            <div className="relative z-10 max-w-sm text-white text-center">
                {/* Icon */}
                <div className="mb-8 relative">
                    <div className="w-24 h-24 bg-white/15 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto border border-white/20 shadow-2xl">
                        <span className="text-5xl">🎓</span>
                    </div>
                    <div className="absolute -top-3 -right-6 bg-emerald-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg animate-bounce">
                        VERIFIED
                    </div>
                    <div className="absolute -bottom-2 -left-4 bg-yellow-400 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                        {stats.universities} UNIS
                    </div>
                </div>

                <h2 className="text-3xl font-black mb-4 leading-tight tracking-tight">
                    Campus commerce,<br />made simple
                </h2>
                <p className="text-white/65 text-sm leading-relaxed mb-8">
                    Join thousands of students buying, selling, and connecting on Bangladesh&apos;s only verified campus marketplace.
                </p>

                {/* Dynamic Stats */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { value: `${stats.universities}+`, label: 'Universities' },
                        { value: formatCount(stats.students), label: 'Students' },
                        { value: formatCount(stats.listings), label: 'Listings' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
                            <p className="text-xl font-black">{s.value}</p>
                            <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5 font-bold">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Feature bullets */}
                <div className="space-y-2.5">
                    {[
                        'Student-verified listings',
                        'Campus-specific marketplace',
                        'Secure peer-to-peer trading',
                        'Faculty & student discounts',
                    ].map(item => (
                        <div key={item} className="text-left text-sm text-white/70 font-medium flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shrink-0" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
