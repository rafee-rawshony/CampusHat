'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Package, Truck, CreditCard, MessageCircle, AlertCircle, Star, RotateCcw, Megaphone } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    notification_type: string
    title: string
    message: string
    action_url: string | null
    is_read: boolean
    created_at: string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
    order: Package,
    refund: RotateCcw,
    verification: AlertCircle,
    marketplace: MessageCircle,
    seller: Star,
    delivery: Truck,
    payout: CreditCard,
    system: Megaphone,
}

const TYPE_COLORS: Record<string, string> = {
    order: 'bg-blue-50 text-blue-600',
    refund: 'bg-purple-50 text-purple-600',
    verification: 'bg-amber-50 text-amber-600',
    marketplace: 'bg-emerald-50 text-emerald-600',
    seller: 'bg-yellow-50 text-yellow-600',
    delivery: 'bg-indigo-50 text-indigo-600',
    payout: 'bg-green-50 text-green-600',
    system: 'bg-gray-50 text-gray-600',
}

function timeAgo(dateStr: string): string {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const seconds = Math.floor((now - then) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString('en-BD', { dateStyle: 'short' })
}

export function NotificationBell() {
    const router = useRouter()
    const { isAuthenticated, _hasHydrated } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const wsRef = useRef<WebSocket | null>(null)

    // Click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return
        try {
            const res = await api.get('/notifications/unread-count/')
            const count = res.data?.data?.unread_count ?? res.data?.unread_count ?? res.data?.data?.count ?? 0
            setUnreadCount(count)
        } catch { /* silently fail */ }
    }, [isAuthenticated])

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return
        setIsLoading(true)
        try {
            const res = await api.get('/notifications/', { params: { page_size: 10 } })
            const data = res.data?.data?.results || res.data?.results || res.data?.data || []
            setNotifications(Array.isArray(data) ? data : [])
        } catch { /* silently fail */ }
        setIsLoading(false)
    }, [isAuthenticated])

    // Initial fetch
    useEffect(() => {
        if (_hasHydrated && isAuthenticated) {
            fetchUnreadCount()
        }
    }, [_hasHydrated, isAuthenticated, fetchUnreadCount])

    // WebSocket for real-time
    useEffect(() => {
        if (!_hasHydrated || !isAuthenticated) return

        const connectWS = () => {
            try {
                const token = useAuthStore.getState().accessToken || ''
                if (!token) return // Don't try to connect if we don't have a token

                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
                const wsHost = process.env.NEXT_PUBLIC_WS_HOST || window.location.host
                const wsUrl = `${wsProtocol}//${wsHost}/ws/notifications/?token=${token}`

                const ws = new WebSocket(wsUrl)
                wsRef.current = ws

                ws.onopen = () => {
                    console.log('[WS Notifications] Connected')
                }

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)
                        if (data.type === 'notification') {
                            // Add to top of list
                            setNotifications(prev => [data.notification, ...prev].slice(0, 20))
                            setUnreadCount(prev => prev + 1)
                        }
                    } catch { /* ignore parse errors */ }
                }

                ws.onclose = (event) => {
                    console.log('[WS Notifications] Closed:', event.code)
                    // Reconnect after 5 seconds if not intentional close
                    if (event.code !== 1000) {
                        setTimeout(connectWS, 5000)
                    }
                }

                ws.onerror = () => {
                    // Fallback to polling if WebSocket fails
                    console.log('[WS Notifications] Error — falling back to polling')
                    ws.close()
                }
            } catch {
                // WebSocket not available, use polling
            }
        }

        connectWS()

        // Fallback polling every 30 seconds
        const pollInterval = setInterval(fetchUnreadCount, 30000)

        return () => {
            clearInterval(pollInterval)
            if (wsRef.current) {
                wsRef.current.close(1000)
            }
        }
    }, [_hasHydrated, isAuthenticated, fetchUnreadCount])

    const handleToggle = () => {
        if (!isOpen) {
            fetchNotifications()
        }
        setIsOpen(!isOpen)
    }

    const handleMarkRead = async (notifId: string) => {
        try {
            await api.patch(`/notifications/${notifId}/mark-read/`)
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch { /* silently fail */ }
    }

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read/')
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch { /* silently fail */ }
    }

    const handleNotifClick = (notif: Notification) => {
        if (!notif.is_read) handleMarkRead(notif.id)
        if (notif.action_url) {
            router.push(notif.action_url)
        }
        setIsOpen(false)
    }

    if (!_hasHydrated || !isAuthenticated) return null

    return (
        <div ref={dropdownRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={handleToggle}
                className="relative inline-flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:text-[#4C3B8A] hover:bg-[#4C3B8A]/5 transition-all"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center ring-2 ring-white animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-bold text-[#4C3B8A] hover:underline flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="py-12 flex justify-center">
                                <div className="w-6 h-6 border-2 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const IconComp = TYPE_ICONS[notif.notification_type] || Bell
                                const colorClass = TYPE_COLORS[notif.notification_type] || 'bg-gray-50 text-gray-600'
                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotifClick(notif)}
                                        className={cn(
                                            'w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50',
                                            !notif.is_read && 'bg-[#4C3B8A]/[0.03]'
                                        )}
                                    >
                                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5', colorClass)}>
                                            <IconComp className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn('text-sm leading-snug', notif.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold')}>
                                                    {notif.title}
                                                </p>
                                                {!notif.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-[#4C3B8A] shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1 font-medium">{timeAgo(notif.created_at)}</p>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <button
                            onClick={() => { router.push('/account/notifications'); setIsOpen(false) }}
                            className="shrink-0 px-4 py-3 border-t border-gray-100 text-sm font-bold text-[#4C3B8A] hover:bg-[#4C3B8A]/5 transition-colors text-center"
                        >
                            View All Notifications
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
