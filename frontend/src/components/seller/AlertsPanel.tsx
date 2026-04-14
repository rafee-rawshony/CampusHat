'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingBag, Star, Wallet, AlertTriangle, MessageCircle, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const TIPS = [
    "Add delivery timeline to your listings to increase conversions.",
    "Respond to messages within 1 hour for better ratings.",
    "Use high-quality bright images to sell 3x faster.",
    "Write SEO-friendly detailed descriptions to rank higher.",
    "Engage with early reviews immediately to build trust."
]

export function AlertsPanel() {
    const [isVisible, setIsVisible] = useState(true)
    const [tip, setTip] = useState(TIPS[0])

    useEffect(() => {
        // Rotate tip randomly on mount
        setTip(TIPS[Math.floor(Math.random() * TIPS.length)])
    }, [])

    const { data: activities, isLoading } = useQuery({
        queryKey: ['seller-activity-feed'],
        queryFn: () => api.get('/seller/activity/?limit=8').then(r => r.data?.results || r.data || []),
        staleTime: 60_000
    })

    if (!isVisible) return null

    const getIconData = (type: string) => {
        switch (type) {
            case 'new_order': return { icon: ShoppingBag, bg: 'bg-green-100', text: 'text-green-600' }
            case 'review': return { icon: Star, bg: 'bg-yellow-100', text: 'text-yellow-600' }
            case 'payout': return { icon: Wallet, bg: 'bg-blue-100', text: 'text-blue-600' }
            case 'low_stock': return { icon: AlertTriangle, bg: 'bg-red-100', text: 'text-red-500' }
            case 'message': return { icon: MessageCircle, bg: 'bg-[#4C3B8A]/10', text: 'text-[#4C3B8A]' }
            default: return { icon: BellContent, bg: 'bg-gray-100', text: 'text-gray-500' }
        }
    }

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        
        const diffHrs = Math.floor(diffMins / 60)
        if (diffHrs < 24) return `${diffHrs}h ago`
        
        const diffDays = Math.floor(diffHrs / 24)
        if (diffDays === 1) return 'Yesterday'
        return `${diffDays}d ago`
    }

    return (
        <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-white border-l border-gray-100 min-h-screen sticky top-0 right-0">
            {/* PANEL HEADER */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                <span className="font-semibold text-sm text-gray-800">Alerts & Activity</span>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-50"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* ACTIVITY FEED */}
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="flex gap-3 py-3 border-b border-gray-50 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-100 rounded w-full"></div>
                                <div className="h-2 bg-gray-100 rounded w-16"></div>
                            </div>
                        </div>
                    ))
                ) : activities?.length > 0 ? (
                    activities.map((act: any) => {
                        const { icon: Icon, bg, text } = getIconData(act.type)
                        return (
                            <div key={act.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", bg, text)}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                                        {act.message}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {timeAgo(act.created_at)}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-xs text-gray-400 text-center py-6">
                        No recent activity.
                    </div>
                )}
            </div>

            {/* CAMPUS PRO TIP */}
            <div className="shrink-0 p-3 pt-0">
                <div className="bg-[#4C3B8A] rounded-xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-sm"></div>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <span className="text-yellow-400">💡</span> Pro Tip
                    </span>
                    <p className="text-xs text-white/90 leading-relaxed font-medium group-hover:text-white transition-colors relative z-10">
                        "{tip}"
                    </p>
                </div>
            </div>
        </aside>
    )
}

function BellContent(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
    )
}
