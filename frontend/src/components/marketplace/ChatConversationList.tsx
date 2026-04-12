'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { differenceInMinutes, differenceInHours, differenceInDays, format, isToday, isYesterday } from 'date-fns'

export interface ChatThread {
    id: string
    listing: {
        id: string | number
        title: string
        images?: Array<{ image: string } | string>
    }
    other_user: {
        id: string | number
        name: string
        profile_picture?: string | null
    }
    last_message?: {
        content: string
        created_at: string
        message_type: 'text' | 'image' | 'offer'
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
    return typeof first === 'string' ? first : first.image
}

export function ChatConversationList({
    threads,
    isLoading,
    activeChatId,
    searchQuery,
    onSearchChange,
}: ChatConversationListProps) {
    const filteredThreads = threads.filter(t =>
        t.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.listing.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const initials = (name: string) =>
        name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 shrink-0">
                <h2 className="font-semibold text-lg text-gray-900 mb-3">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search conversations..."
                        className="pl-9 h-9 border-gray-200 bg-gray-50 text-sm rounded-lg"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    // Skeleton loading
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between">
                                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                                    <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
                                </div>
                                <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
                                <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
                            </div>
                        </div>
                    ))
                ) : filteredThreads.length === 0 ? (
                    <div className="py-8 text-center">
                        <p className="text-gray-400 text-sm font-medium">No conversations yet</p>
                        <p className="text-gray-400 text-xs mt-1">
                            Start chatting by messaging a seller on any listing.
                        </p>
                    </div>
                ) : (
                    filteredThreads.map(thread => {
                        const isActive = activeChatId === thread.id
                        const thumbnail = getListingThumbnail(thread.listing)
                        const timeStr = thread.last_message?.created_at || thread.created_at

                        // Format last message preview
                        let lastMessagePreview = ''
                        if (thread.last_message) {
                            if (thread.last_message.message_type === 'offer') {
                                lastMessagePreview = `💰 Offer: ৳${Number(thread.last_message.offer_amount || 0).toLocaleString()}`
                            } else if (thread.last_message.message_type === 'image') {
                                lastMessagePreview = '📷 Image'
                            } else {
                                lastMessagePreview = thread.last_message.content
                            }
                        }

                        return (
                            <Link
                                key={thread.id}
                                href={`/marketplace/chat/${thread.id}`}
                                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                                    isActive
                                        ? 'bg-[#4C3B8A]/10 border-l-2 border-l-[#4C3B8A]'
                                        : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                                }`}
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                                    {thread.other_user.profile_picture ? (
                                        <Image
                                            src={thread.other_user.profile_picture}
                                            alt={thread.other_user.name}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[#4C3B8A] text-white flex items-center justify-center font-bold text-sm">
                                            {initials(thread.other_user.name)}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Top row: name + time */}
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className="font-semibold text-sm text-gray-900 truncate pr-2">
                                            {thread.other_user.name}
                                        </h4>
                                        <span className="text-xs text-gray-400 shrink-0">
                                            {formatRelativeTime(timeStr)}
                                        </span>
                                    </div>

                                    {/* Last message + unread */}
                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs truncate flex-1 pr-2 ${
                                            thread.unread_count > 0 ? 'text-gray-800 font-semibold' : 'text-gray-500'
                                        }`}>
                                            {lastMessagePreview || (
                                                <span className="italic text-gray-400">{thread.listing.title}</span>
                                            )}
                                        </p>
                                        {thread.unread_count > 0 && (
                                            <div className="w-5 h-5 rounded-full bg-[#4C3B8A] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {thread.unread_count}
                                            </div>
                                        )}
                                    </div>

                                    {/* Listing thumbnail row */}
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                            {thumbnail ? (
                                                <Image
                                                    src={thumbnail}
                                                    alt={thread.listing.title}
                                                    width={32}
                                                    height={32}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-[#4C3B8A]/10 flex items-center justify-center">
                                                    <span className="text-[8px] text-[#4C3B8A] font-bold">AD</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-400 truncate">
                                            {thread.listing.title}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}
