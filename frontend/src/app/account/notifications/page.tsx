'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Package, Truck, CreditCard, MessageCircle, AlertCircle, Star, RotateCcw, Megaphone, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<string, React.ElementType> = {
    order: Package, refund: RotateCcw, verification: AlertCircle,
    marketplace: MessageCircle, seller: Star, delivery: Truck,
    payout: CreditCard, system: Megaphone,
}

const TYPE_COLORS: Record<string, string> = {
    order: 'bg-blue-50 text-blue-600', refund: 'bg-purple-50 text-purple-600',
    verification: 'bg-amber-50 text-amber-600', marketplace: 'bg-emerald-50 text-emerald-600',
    seller: 'bg-yellow-50 text-yellow-600', delivery: 'bg-indigo-50 text-indigo-600',
    payout: 'bg-green-50 text-green-600', system: 'bg-gray-50 text-gray-600',
}

function timeAgo(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const seconds = Math.floor((now - then) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function NotificationsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const { data, isLoading } = useQuery({
        queryKey: ['all-notifications', filter],
        queryFn: async () => {
            const params: any = { page_size: 50 }
            if (filter === 'unread') params.is_read = false
            const res = await api.get('/notifications/', { params })
            return res.data?.data?.results || res.data?.results || res.data?.data || []
        },
        staleTime: 15_000,
    })

    const notifications: any[] = data || []

    const handleMarkRead = async (id: string) => {
        await api.patch(`/notifications/${id}/mark-read/`)
        queryClient.invalidateQueries({ queryKey: ['all-notifications'] })
    }

    const handleMarkAllRead = async () => {
        await api.post('/notifications/mark-all-read/')
        queryClient.invalidateQueries({ queryKey: ['all-notifications'] })
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Stay updated on your orders and activity</p>
                </div>
                <Button onClick={handleMarkAllRead} variant="outline" size="sm" className="text-xs font-bold">
                    <Check className="w-3 h-3 mr-1" /> Mark All Read
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {(['all', 'unread'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={cn(
                                'flex-1 py-3 text-sm font-semibold capitalize border-b-2 transition-colors',
                                filter === tab ? 'border-[#4C3B8A] text-[#4C3B8A]' : 'border-transparent text-gray-500 hover:text-gray-900'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="py-16 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-16 text-center">
                        <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-base font-semibold text-gray-900">No notifications</p>
                        <p className="text-sm text-gray-500 mt-1">{filter === 'unread' ? 'All caught up!' : 'Check back later'}</p>
                    </div>
                ) : (
                    <div>
                        {notifications.map((notif: any) => {
                            const IconComp = TYPE_ICONS[notif.notification_type] || Bell
                            const colorClass = TYPE_COLORS[notif.notification_type] || 'bg-gray-50 text-gray-600'
                            return (
                                <button
                                    key={notif.id}
                                    onClick={() => {
                                        if (!notif.is_read) handleMarkRead(notif.id)
                                        if (notif.action_url) router.push(notif.action_url)
                                    }}
                                    className={cn(
                                        'w-full text-left px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors border-b border-gray-50',
                                        !notif.is_read && 'bg-[#4C3B8A]/[0.03]'
                                    )}
                                >
                                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', colorClass)}>
                                        <IconComp className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn('text-sm leading-snug', notif.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold')}>
                                                {notif.title}
                                            </p>
                                            {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#4C3B8A] shrink-0 mt-1.5" />}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{timeAgo(notif.created_at)}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
