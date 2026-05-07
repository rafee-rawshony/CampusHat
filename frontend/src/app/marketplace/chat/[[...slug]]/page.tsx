'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'
import { ChatConversationList } from '@/components/marketplace/ChatConversationList'
import { ChatWindow } from '@/components/marketplace/ChatWindow'
import type { ChatThread } from '@/components/marketplace/ChatConversationList'
import { useMarketplaceChatInbox } from '@/hooks/useMarketplaceChatInbox'

export default function UnifiedChatPage() {
    const router = useRouter()
    const params = useParams()
    const queryClient = useQueryClient()
    const { isAuthenticated, canAccessMarketplace } = useAuthStore()

    // Read initial chatId from URL slug
    const slugParts = params?.slug as string[] | undefined
    const initialChatId = slugParts?.[0] || null

    const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId)
    const [searchQuery, setSearchQuery] = useState('')
    const hasChatAccess = isAuthenticated && canAccessMarketplace()

    // Keep selectedChatId in sync if navigated via external link (e.g. ChatButton)
    const prevSlugRef = useRef(initialChatId)
    useEffect(() => {
        const newId = slugParts?.[0] || null
        if (newId !== prevSlugRef.current) {
            prevSlugRef.current = newId
            setSelectedChatId(newId)
        }
    }, [slugParts])

    useMarketplaceChatInbox(hasChatAccess)

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/auth/login?redirect=/marketplace/chat')
        }
    }, [isAuthenticated, router])

    // Fetch thread list once, shared across the whole page
    const { data: threads = [], isLoading: threadsLoading } = useQuery<ChatThread[]>({
        queryKey: ['chat-threads'],
        queryFn: async () => {
            const res = await api.get('/marketplace/chats/')
            return res.data?.data || res.data?.results || res.data || []
        },
        enabled: hasChatAccess,
        refetchInterval: 15000,
        staleTime: 10000,
    })

    // Fetch chat detail only when a chat is selected
    const { data: chatDetail, isLoading: chatDetailLoading } = useQuery({
        queryKey: ['chat-detail', selectedChatId],
        queryFn: async () => {
            const res = await api.get(`/marketplace/chats/${selectedChatId}/`)
            return res.data?.data || res.data
        },
        enabled: !!selectedChatId && hasChatAccess,
        staleTime: 30000,
    })

    const chatWindowData = chatDetail ? {
        id: chatDetail.id || selectedChatId!,
        seller_id: chatDetail.seller || '',
        listing: {
            id: chatDetail.listing?.id || '',
            title: chatDetail.listing?.title || '',
            images: chatDetail.listing?.images || [],
        },
        other_user: {
            id: chatDetail.other_user?.id || '',
            name: chatDetail.other_user?.name || chatDetail.other_user?.full_name || 'User',
            profile_picture: chatDetail.other_user?.profile_picture || null,
        },
    } : null

    // Select a chat — update state and URL without full navigation
    const handleSelectChat = useCallback((chatId: string) => {
        setSelectedChatId(chatId)
        window.history.replaceState(null, '', `/marketplace/chat/${chatId}`)
        queryClient.invalidateQueries({ queryKey: ['chat-detail', chatId] })
    }, [queryClient])

    // Back to list (mobile)
    const handleBack = useCallback(() => {
        setSelectedChatId(null)
        window.history.replaceState(null, '', '/marketplace/chat')
    }, [])

    if (!isAuthenticated) return null

    if (!canAccessMarketplace()) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-white pt-12 flex justify-center px-4">
                <UpgradePrompt
                    isOpen={true}
                    onClose={() => router.push('/marketplace')}
                    title="Verification Required"
                    description="You must verify your university email to use the chat system."
                />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-[calc(100vh-64px)]">
            {/* Breadcrumb — desktop */}
            <div className="container mx-auto max-w-7xl px-4 pt-4 pb-2 hidden md:block">
                <nav className="flex items-center text-sm text-gray-500 font-medium">
                    <Link href="/marketplace" className="hover:text-gray-900 transition-colors">Marketplace</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Messages</span>
                </nav>
            </div>

            <div className="container mx-auto max-w-7xl h-[calc(100dvh-64px)] md:h-[calc(100dvh-120px)] p-0 md:px-4 md:pb-4">
                <div className="bg-white md:rounded-2xl md:border border-gray-100 md:shadow-sm overflow-hidden flex h-full">

                    {/* Left panel: Thread list */}
                    {/* Desktop: always visible. Mobile: visible only when no chat selected */}
                    <div className={`w-full md:w-[340px] shrink-0 md:border-r border-gray-100 flex flex-col ${
                        selectedChatId ? 'hidden md:flex' : 'flex'
                    }`}>
                        <ChatConversationList
                            threads={threads}
                            isLoading={threadsLoading}
                            activeChatId={selectedChatId}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onSelectChat={handleSelectChat}
                        />
                    </div>

                    {/* Right panel: Chat window or empty state */}
                    <div className={`flex-1 flex flex-col min-w-0 ${
                        selectedChatId ? 'flex' : 'hidden md:flex'
                    }`}>
                        {selectedChatId ? (
                            chatDetailLoading && !chatWindowData ? (
                                <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
                                    <div className="text-center">
                                        <div className="w-7 h-7 border-2 border-[#4C3B8A] border-t-transparent rounded-full animate-spin mx-auto" />
                                        <p className="text-gray-400 text-xs mt-3">Loading chat...</p>
                                    </div>
                                </div>
                            ) : (
                                <ChatWindow
                                    key={selectedChatId}
                                    chatId={selectedChatId}
                                    chatData={chatWindowData}
                                    onBack={handleBack}
                                />
                            )
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
                                <div className="text-center px-6">
                                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-9 h-9 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-400 mb-1">Your Messages</h3>
                                    <p className="text-sm text-gray-300">
                                        Select a conversation to start chatting
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
