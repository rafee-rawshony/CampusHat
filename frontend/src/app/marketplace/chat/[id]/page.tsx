'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'
import { ChatConversationList } from '@/components/marketplace/ChatConversationList'
import { ChatWindow } from '@/components/marketplace/ChatWindow'
import type { ChatThread } from '@/components/marketplace/ChatConversationList'

export default function ChatDetailPage() {
    const router = useRouter()
    const params = useParams()
    const chatId = params?.id as string
    const { isAuthenticated, canAccessMarketplace } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState('')

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) {
            router.replace(`/auth/login?redirect=/marketplace/chat/${chatId}`)
        }
    }, [isAuthenticated, router, chatId])

    // Fetch conversation list (for desktop left panel)
    const { data: threads = [], isLoading: threadsLoading } = useQuery<ChatThread[]>({
        queryKey: ['chat-threads'],
        queryFn: async () => {
            const res = await api.get('/marketplace/chats/')
            return res.data?.data || res.data?.results || res.data || []
        },
        enabled: isAuthenticated && canAccessMarketplace(),
        refetchInterval: 15000,
    })

    // Fetch individual chat details
    const { data: chatData, isLoading: chatLoading } = useQuery({
        queryKey: ['chat-detail', chatId],
        queryFn: async () => {
            const res = await api.get(`/marketplace/chats/${chatId}/`)
            return res.data?.data || res.data
        },
        enabled: !!chatId && isAuthenticated && canAccessMarketplace(),
    })

    // Build chatData object for ChatWindow
    const chatWindowData = chatData
        ? {
              id: chatData.id || chatId,
              seller_id: chatData.seller || '',  // UUID of listing owner from API
              listing: {
                  id: chatData.listing?.id || '',
                  title: chatData.listing?.title || '',
                  images: chatData.listing?.images || [],
              },
              other_user: {
                  id: chatData.other_user?.id || '',
                  name: chatData.other_user?.name || chatData.other_user?.full_name || 'User',
                  profile_picture: chatData.other_user?.profile_picture || null,
              },
          }
        : null

    // Breadcrumb name
    const otherUserName = chatWindowData?.other_user?.name || 'Chat'

    if (!isAuthenticated) return null

    if (!canAccessMarketplace()) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-[#F5F5F5] pt-12 flex justify-center px-4">
                <UpgradePrompt
                    isOpen={true}
                    onClose={() => router.push('/marketplace')}
                    title="Verification Required"
                    description="You must verify your university email to use the chat system. This stops spam and keeps our community safe."
                />
            </div>
        )
    }

    return (
        <div className="bg-[#F5F5F5] min-h-[calc(100vh-64px)]">
            {/* Breadcrumb — desktop only */}
            <div className="container mx-auto max-w-7xl px-4 pt-4 pb-2 hidden md:block">
                <nav className="flex items-center text-sm text-gray-500 font-medium">
                    <Link href="/marketplace" className="hover:text-gray-900 transition-colors">
                        Marketplace
                    </Link>
                    <span className="mx-2">/</span>
                    <Link href="/marketplace/chat" className="hover:text-gray-900 transition-colors">
                        Messages
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">{otherUserName}</span>
                </nav>
            </div>

            <div className="container mx-auto max-w-7xl h-[calc(100vh-64px)] md:h-[calc(100vh-120px)] p-0 md:px-4 md:pb-4">
                <div className="bg-white md:rounded-2xl border-x md:border border-gray-100 shadow-sm overflow-hidden flex h-full">
                    {/* LEFT PANEL: Conversation List — desktop only */}
                    <div className="hidden md:flex w-[320px] flex-shrink-0 border-r border-gray-200 flex-col">
                        <ChatConversationList
                            threads={threads}
                            isLoading={threadsLoading}
                            activeChatId={chatId}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        />
                    </div>

                    {/* RIGHT PANEL: Chat Window */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {chatLoading ? (
                            <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-2 border-[#4C3B8A] border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="text-gray-400 text-sm mt-3">Loading chat...</p>
                                </div>
                            </div>
                        ) : (
                            <ChatWindow chatId={chatId} chatData={chatWindowData} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
