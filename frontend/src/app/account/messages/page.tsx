'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Store, ShoppingBag } from 'lucide-react'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface BaseChat {
    id: string
    type: 'mall' | 'marketplace'
    name: string
    avatar: string | null
    lastMessage: {
        content: string
        created_at: string
        is_read: boolean
        sender_id: string
    } | null
    unreadCount: number
    updatedAt: string
}

export default function UnifiedMessagesPage() {
    // 1. Fetch Mall Chats
    const { data: mallChatsData, isLoading: loadingMall } = useQuery({
        queryKey: ['mall-buyer-chats'],
        queryFn: async () => {
            const res = await api.get('/mall/chats/buyer/')
            return res.data?.data || []
        }
    })

    // 2. Fetch Marketplace Chats
    const { data: mkpChatsData, isLoading: loadingMkp } = useQuery({
        queryKey: ['marketplace-chats'],
        queryFn: async () => {
            const res = await api.get('/marketplace/chats/')
            return res.data?.data || []
        }
    })

    const isLoading = loadingMall || loadingMkp

    // 3. Normalize and merge
    const mergedChats: BaseChat[] = []

    if (mallChatsData) {
        mallChatsData.forEach((c: any) => {
            mergedChats.push({
                id: c.id,
                type: 'mall',
                name: c.store_name,
                avatar: c.store_logo,
                lastMessage: c.last_message ? {
                    content: c.last_message.message_type === 'image' ? '[Image]' : c.last_message.content,
                    created_at: c.last_message.created_at,
                    is_read: c.last_message.is_read,
                    sender_id: c.last_message.sender
                } : null,
                unreadCount: c.unread_count || 0,
                updatedAt: c.last_message_at || c.created_at || new Date().toISOString()
            })
        })
    }

    if (mkpChatsData) {
        // Find current user id from any chat's messages to know unread?
        // Wait, marketplace chat doesn't return unread_count directly. We'll use 0 for now.
        mkpChatsData.forEach((c: any) => {
            // we need to know the 'other' user. 
            // the API returns `other_user` if we added it, but let's assume `seller_name` or similar
            const otherName = c.other_user?.full_name || 'Marketplace User'
            const otherAvatar = c.other_user?.profile_picture || null

            mergedChats.push({
                id: c.id,
                type: 'marketplace',
                name: otherName,
                avatar: otherAvatar,
                lastMessage: c.last_message ? {
                    content: c.last_message.message_type === 'image' ? '[Image]' : c.last_message.content,
                    created_at: c.last_message.created_at,
                    is_read: c.last_message.is_read,
                    sender_id: c.last_message.sender
                } : null,
                unreadCount: 0, // Need to implement in backend
                updatedAt: c.last_message_at || c.created_at || new Date().toISOString()
            })
        })
    }

    // 4. Sort by latest
    mergedChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 md:px-8 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-brand-primary" />
                        Messages
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Your unified inbox for Mall stores and Marketplace sellers.
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : mergedChats.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {mergedChats.map(chat => (
                            <Link 
                                key={chat.id} 
                                href={chat.type === 'mall' ? `/account/messages/mall/${chat.id}` : `/marketplace/chat/${chat.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="relative">
                                    {chat.avatar ? (
                                        <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center text-brand-primary font-bold">
                                            {chat.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                        {chat.type === 'mall' ? (
                                            <Store className="w-4 h-4 text-[#4C3B8A]" />
                                        ) : (
                                            <ShoppingBag className="w-4 h-4 text-emerald-500" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="text-sm font-bold text-gray-900 truncate pr-4">{chat.name}</h3>
                                        {chat.lastMessage && (
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {new Date(chat.lastMessage.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-500 truncate pr-4">
                                            {chat.lastMessage?.content || 'No messages yet'}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No messages yet</h3>
                        <p className="text-sm text-gray-500 max-w-sm">
                            When you contact sellers or stores, your conversations will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
