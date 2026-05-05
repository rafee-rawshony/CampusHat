'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

// Types for chat data
interface ChatItem {
    id: string
    listing?: { id: string; title: string }
    other_user?: { id: string; name: string; profile_picture?: string }
    last_message?: { content: string; created_at: string; message_type: string }
    created_at: string
}

// Get initials from a name (e.g. "Mahedi Hasan" → "MH")
function getInitials(name: string) {
    return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
}

export default function SellerMessagesPage() {
    // Fetch all chats where this seller is a participant (mall store chats)
    const { data: chatsData, isLoading } = useQuery({
        queryKey: ['seller-chats'],
        queryFn: () =>
            api.get('/seller/chats/').then(r => r.data?.data?.results || r.data?.results || r.data || [])
                .catch(() => api.get('/marketplace/chats/').then(r => r.data?.data?.results || r.data?.results || r.data || [])),
        staleTime: 30_000,
        refetchInterval: 60_000,
    })

    const chats: ChatItem[] = chatsData || []

    return (
        <div>
            <h1 className="font-bold text-xl text-gray-900 mb-6">Customer Messages</h1>

            {/* Loading skeleton */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array(5).fill(null).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : chats.length === 0 ? (
                /* Empty state */
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
                /* Chat conversation list */
                <div className="space-y-2">
                    {chats.map((chat) => {
                        const buyer = chat.other_user
                        const listing = chat.listing
                        const lastMsg = chat.last_message
                        const timeAgo = lastMsg?.created_at
                            ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: true })
                            : ''

                        return (
                            <Link
                                key={chat.id}
                                href={`/account/messages/mall/${chat.id}`}
                                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-[#4C3B8A]/30 hover:shadow-sm transition-all group"
                            >
                                {/* Buyer avatar */}
                                <div className="w-12 h-12 rounded-full bg-[#4C3B8A] flex items-center justify-center shrink-0 text-white font-bold text-sm">
                                    {getInitials(buyer?.name || 'B')}
                                </div>

                                {/* Message content preview */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-semibold text-gray-900 text-sm truncate">
                                            {buyer?.name || 'Buyer'}
                                        </span>
                                        {timeAgo && (
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0 ml-2">
                                                <Clock className="w-3 h-3" />
                                                {timeAgo}
                                            </span>
                                        )}
                                    </div>
                                    {listing && (
                                        <p className="text-[11px] text-[#4C3B8A] font-medium truncate mb-0.5">
                                            Re: {listing.title}
                                        </p>
                                    )}
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
