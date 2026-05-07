'use client'

import React from 'react'
import Image from 'next/image'
import { Search, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { differenceInMinutes, differenceInHours, differenceInDays, format, isYesterday } from 'date-fns'

export interface ChatThread {
    id: string
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
    if (!listing.images || listing.images.length === 0) return null
    const first = listing.images[0]
    return typeof first === 'string' ? first : first.image_url || first.image || null
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

    const initials = (name?: string) =>
        (name || 'User')
            .trim()
            .split(/\s+/)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U'

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 shrink-0">
                <h2 className="font-bold text-lg text-gray-900 mb-3">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search conversations..."
                        className="pl-9 h-9 border-gray-200 bg-gray-50 text-sm rounded-xl"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-gray-100 rounded w-28" />
                                <div className="h-3 bg-gray-50 rounded w-44" />
                            </div>
                        </div>
                    ))
                ) : filteredThreads.length === 0 ? (
                    <div className="py-16 text-center px-6">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                        <p className="text-gray-400 text-sm font-medium">No conversations yet</p>
                        <p className="text-gray-300 text-xs mt-1">
                            Start chatting by messaging a seller on any listing.
                        </p>
                    </div>
                ) : (
                    filteredThreads.map(thread => {
                        const isActive = activeChatId === thread.id
                        const thumbnail = getListingThumbnail(thread.listing)
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
                                key={thread.id}
                                onClick={() => onSelectChat(thread.id)}
                                className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors ${
                                    isActive
                                        ? 'bg-[#4C3B8A]/8 border-l-[3px] border-l-[#4C3B8A]'
                                        : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                }`}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full overflow-hidden">
                                        {thread.other_user.profile_picture ? (
                                            <Image
                                                src={thread.other_user.profile_picture}
                                                alt={thread.other_user.name}
                                                width={48}
                                                height={48}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#4C3B8A] to-[#6B5AAE] text-white flex items-center justify-center font-bold text-sm">
                                                {initials(thread.other_user.name)}
                                            </div>
                                        )}
                                    </div>
                                    {hasUnread && (
                                        <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#4C3B8A] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                                            {thread.unread_count > 9 ? '9+' : thread.unread_count}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className={`text-sm truncate pr-2 ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                            {thread.other_user.name}
                                        </h4>
                                        <span className={`text-[11px] shrink-0 ${hasUnread ? 'text-[#4C3B8A] font-semibold' : 'text-gray-400'}`}>
                                            {formatRelativeTime(timeStr)}
                                        </span>
                                    </div>

                                    <p className={`text-xs truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                                        {lastMessagePreview || (
                                            <span className="italic">{thread.listing.title}</span>
                                        )}
                                    </p>

                                    {/* Listing context */}
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <div className="w-5 h-5 rounded bg-gray-100 overflow-hidden shrink-0">
                                            {thumbnail ? (
                                                <Image
                                                    src={thumbnail}
                                                    alt={thread.listing.title}
                                                    width={20}
                                                    height={20}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[#4C3B8A]/10 flex items-center justify-center">
                                                    <span className="text-[6px] text-[#4C3B8A] font-bold">AD</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 truncate">
                                            {thread.listing.title}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        )
                    })
                )}
            </div>
        </div>
    )
}
