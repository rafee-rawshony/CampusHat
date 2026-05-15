'use client'

import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Clock, ChevronRight, Store, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { normalizeListResponse } from '@/lib/response'
import { formatDistanceToNow } from 'date-fns'
import { useMarketplaceChatInbox } from '@/hooks/useMarketplaceChatInbox'

interface ChatItem {
    id: string
    type?: 'mall' | 'marketplace'
    listing?: { id: string; title: string }
    other_user?: { id: string; name: string; profile_picture?: string }
    buyer_name?: string
    last_message?: { content: string; created_at: string; message_type: string }
    last_message_at?: string
    created_at: string
}

function getInitials(name: string) {
    return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
}

export default function SellerMessagesPage() {
    useMarketplaceChatInbox(true)

    // Mall store chats (seller side)
    const { data: mallChatsData, isLoading: mallLoading } = useQuery({
        queryKey: ['seller-chats'],
        queryFn: async () => {
            const res = await api.get('/seller/chats/')
            const data = res.data?.data ?? res.data
            const normalized = normalizeListResponse<ChatItem>(data)
            return (Array.isArray(normalized) ? normalized : []).map((c: any) => ({
                ...c,
                type: 'mall' as const,
                other_user: c.other_user || { id: c.buyer, name: c.buyer_name || 'Buyer' },
            }))
        },
        staleTime: 30_000,
        refetchInterval: 60_000,
    })

    // Marketplace chats (seller side)
    const { data: mkpChatsData, isLoading: mkpLoading } = useQuery({
        queryKey: ['seller-marketplace-chats'],
        queryFn: async () => {
            const res = await api.get('/marketplace/chats/')
            const data = res.data?.data ?? res.data?.results ?? res.data
            return (Array.isArray(data) ? data : []).map((c: any) => ({
                ...c,
                type: 'marketplace' as const,
            }))
        },
        staleTime: 30_000,
        refetchInterval: 60_000,
    })

    const isLoading = mallLoading || mkpLoading

    const chats = useMemo(() => {
        const mall = Array.isArray(mallChatsData) ? mallChatsData : []
        const mkp = Array.isArray(mkpChatsData) ? mkpChatsData : []
        const merged = [...mall, ...mkp]
        merged.sort((a, b) => {
            const aTime = a.last_message?.created_at || a.last_message_at || a.created_at
            const bTime = b.last_message?.created_at || b.last_message_at || b.created_at
            return new Date(bTime).getTime() - new Date(aTime).getTime()
        })
        return merged
    }, [mallChatsData, mkpChatsData])

    return (
        <div>
            <h1 className="font-bold text-xl text-gray-900 mb-6">Customer Messages</h1>

            {isLoading ? (
                <div className="space-y-3">
                    {Array(5).fill(null).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : chats.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-[#4C3B8A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-[#4C3B8A]" />
                    </div>
                    <h2 className="font-semibold text-gray-800 text-lg mb-2">No Messages Yet</h2>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">
                        When buyers message you about your products, their conversations will appear here.
                        Keep response times under 1 hour for better ratings.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {chats.map((chat: any) => {
                        const isMall = chat.type === 'mall'
                        const buyerName = chat.other_user?.name || chat.buyer_name || 'Buyer'
                        const listing = chat.listing
                        const lastMsg = chat.last_message
                        const href = `/marketplace/chat/${chat.id}`
                        const timeAgo = lastMsg?.created_at
                            ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true })
                            : ''

                        return (
                            <Link
                                key={`${chat.type}-${chat.id}`}
                                href={href}
                                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-[#4C3B8A]/30 hover:shadow-sm transition-all group"
                            >
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-[#4C3B8A] flex items-center justify-center text-white font-bold text-sm">
                                        {getInitials(buyerName)}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center ring-1 ring-gray-200">
                                        {isMall ? (
                                            <Store className="w-3 h-3 text-[#4C3B8A]" />
                                        ) : (
                                            <ShoppingBag className="w-3 h-3 text-emerald-500" />
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-semibold text-gray-900 text-sm truncate">
                                            {buyerName}
                                        </span>
                                        {timeAgo && (
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0 ml-2">
                                                <Clock className="w-3 h-3" />
                                                {timeAgo}
                                            </span>
                                        )}
                                    </div>
                                    {listing ? (
                                        <p className="text-[11px] text-[#4C3B8A] font-medium truncate mb-0.5">
                                            Re: {listing.title}
                                        </p>
                                    ) : isMall ? (
                                        <p className="text-[11px] text-[#4C3B8A] font-medium truncate mb-0.5">
                                            Mall Store Chat
                                        </p>
                                    ) : null}
                                    <p className="text-xs text-gray-500 truncate">
                                        {lastMsg?.content || 'No messages yet'}
                                    </p>
                                </div>

                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#4C3B8A] shrink-0 transition-colors" />
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
