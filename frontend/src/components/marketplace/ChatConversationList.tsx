'use client'

import React from 'react'
import Image from 'next/image'
import { Search, MessageCircle, Store, ShoppingBag } from 'lucide-react'
import { absoluteMediaUrl } from '@/services/upload.service'
import { differenceInMinutes, differenceInHours, differenceInDays, format, isYesterday } from 'date-fns'

export interface ChatThread {
    id: string
    type?: 'mall' | 'marketplace'
    listing: {
        id: string | number
        title: string
        images?: Array<{ image?: string; image_url?: string } | string>
    }
    other_user: {
        id: string | number
        name: string
        profile_picture?: string | null
    }
    last_message?: {
        content: string
        created_at: string
        message_type: 'text' | 'image' | 'offer' | 'offer_ref'
        offer_amount?: string
    } | null
    unread_count: number
    created_at: string
}

interface ChatConversationListProps {
    threads: ChatThread[]
    isLoading: boolean
    activeChatId?: string | null
    searchQuery: string
    onSearchChange: (query: string) => void
    onSelectChat: (chatId: string) => void
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const mins = differenceInMinutes(now, date)
    if (mins < 1) return 'Now'
    if (mins < 60) return `${mins}m`
    const hrs = differenceInHours(now, date)
    if (hrs < 24) return `${hrs}h`
    if (isYesterday(date)) return 'Yesterday'
    const days = differenceInDays(now, date)
    if (days < 7) return format(date, 'EEE')
    return format(date, 'MMM d')
}

function getListingThumbnail(listing: ChatThread['listing']): string | null {
    if (!listing?.images || listing.images.length === 0) return null
    const first = listing.images[0]
    return typeof first === 'string' ? first : first.image_url || first.image || null
}

function getInitials(name?: string): string {
    return (name || 'User')
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
}

export function ChatConversationList({
    threads,
    isLoading,
    activeChatId,
    searchQuery,
    onSearchChange,
    onSelectChat,
}: ChatConversationListProps) {
    const filteredThreads = threads.filter(t =>
        (t.other_user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.listing?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0)

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="shrink-0 px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="font-bold text-xl text-gray-900">Messages</h2>
                        {totalUnread > 0 && (
                            <span className="bg-[#4C3B8A] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full min-w-[22px] text-center">
                                {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/20 focus:border-[#4C3B8A]/30 transition-all"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
                {isLoading ? (
                    <div className="px-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3.5 px-2 py-4 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
                                <div className="flex-1 space-y-2.5">
                                    <div className="flex justify-between">
                                        <div className="h-3.5 bg-gray-100 rounded-md w-28" />
                                        <div className="h-3 bg-gray-50 rounded-md w-10" />
                                    </div>
                                    <div className="h-3 bg-gray-50 rounded-md w-40" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredThreads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 px-8">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <MessageCircle className="w-7 h-7 text-gray-200" />
                        </div>
                        <p className="text-gray-500 text-sm font-semibold mb-1">
                            {searchQuery ? 'No results found' : 'No conversations yet'}
                        </p>
                        <p className="text-gray-400 text-xs text-center leading-relaxed">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Start chatting by messaging a seller on any listing or a mall store.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="px-2">
                        {filteredThreads.map(thread => {
                            const isActive = activeChatId === thread.id
                            const isMall = thread.type === 'mall'
                            const thumbnail = !isMall ? getListingThumbnail(thread.listing) : null
                            const timeStr = thread.last_message?.created_at || thread.created_at
                            const hasUnread = thread.unread_count > 0

                            let lastMessagePreview = ''
                            if (thread.last_message) {
                                if (thread.last_message.message_type === 'offer' || thread.last_message.message_type === 'offer_ref') {
                                    lastMessagePreview = `💰 Offer: ৳${Number(thread.last_message.offer_amount || 0).toLocaleString()}`
                                } else if (thread.last_message.message_type === 'image') {
                                    lastMessagePreview = '📷 Image'
                                } else {
                                    lastMessagePreview = thread.last_message.content
                                }
                            }

                            return (
                                <button
                                    key={`${thread.type || 'mkp'}-${thread.id}`}
                                    onClick={() => onSelectChat(thread.id)}
                                    className={`w-full text-left flex items-center gap-3.5 px-3 py-3.5 rounded-xl mb-0.5 transition-all duration-200 ${
                                        isActive
                                            ? 'bg-[#4C3B8A]/[0.06]'
                                            : 'hover:bg-gray-50 active:bg-gray-100'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={`w-12 h-12 rounded-full overflow-hidden ${isActive ? 'ring-2 ring-[#4C3B8A]/20' : ''}`}>
                                            {thread.other_user.profile_picture ? (
                                                <Image
                                                    src={absoluteMediaUrl(thread.other_user.profile_picture)}
                                                    alt={thread.other_user.name}
                                                    width={48}
                                                    height={48}
                                                    unoptimized
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#4C3B8A] to-[#6B5AAE] text-white flex items-center justify-center font-bold text-sm">
                                                    {getInitials(thread.other_user.name)}
                                                </div>
                                            )}
                                        </div>
                                        {isMall ? (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center ring-1 ring-gray-200">
                                                <Store className="w-3 h-3 text-[#4C3B8A]" />
                                            </div>
                                        ) : thread.type === 'marketplace' ? (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center ring-1 ring-gray-200">
                                                <ShoppingBag className="w-3 h-3 text-emerald-500" />
                                            </div>
                                        ) : null}
                                        {hasUnread && (
                                            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#4C3B8A] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
                                                {thread.unread_count > 9 ? '9+' : thread.unread_count}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline gap-2 mb-0.5">
                                            <h4 className={`text-[13px] truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                {thread.other_user.name}
                                            </h4>
                                            <span className={`text-[11px] shrink-0 tabular-nums ${
                                                hasUnread ? 'text-[#4C3B8A] font-semibold' : 'text-gray-400'
                                            }`}>
                                                {formatRelativeTime(timeStr)}
                                            </span>
                                        </div>

                                        <p className={`text-xs leading-relaxed truncate ${
                                            hasUnread ? 'text-gray-800 font-medium' : 'text-gray-400'
                                        }`}>
                                            {lastMessagePreview || (
                                                <span className="italic text-gray-300">No messages yet</span>
                                            )}
                                        </p>

                                        {/* Context line: listing for marketplace, "Mall Store" for mall */}
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            {isMall ? (
                                                <>
                                                    <div className="w-4 h-4 rounded-[4px] bg-[#4C3B8A]/10 flex items-center justify-center shrink-0">
                                                        <Store className="w-2.5 h-2.5 text-[#4C3B8A]" />
                                                    </div>
                                                    <span className="text-[10px] text-[#4C3B8A] truncate leading-none font-medium">
                                                        Mall Store
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-4 h-4 rounded-[4px] bg-gray-100 overflow-hidden shrink-0">
                                                        {thumbnail ? (
                                                            <Image
                                                                src={absoluteMediaUrl(thumbnail)}
                                                                alt=""
                                                                width={16}
                                                                height={16}
                                                                unoptimized
                                                                className="object-cover w-full h-full"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-[#4C3B8A]/10" />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 truncate leading-none">
                                                        {thread.listing?.title || 'Marketplace'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
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
