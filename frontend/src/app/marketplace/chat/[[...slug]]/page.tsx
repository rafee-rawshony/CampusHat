'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, ShieldCheck } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'
import { ChatConversationList } from '@/components/marketplace/ChatConversationList'
import { ChatWindow } from '@/components/marketplace/ChatWindow'
import type { ChatThread } from '@/components/marketplace/ChatConversationList'
import { useMarketplaceChatInbox } from '@/hooks/useMarketplaceChatInbox'

function useLayoutOffsets() {
    const [top, setTop] = useState(0)
    const [bottom, setBottom] = useState(0)

    useEffect(() => {
        const measure = () => {
            const header = document.querySelector('header')
            setTop(header?.offsetHeight ?? 0)
            const isMobile = window.innerWidth < 640
            setBottom(isMobile ? 64 : 0)
        }
        measure()
        window.addEventListener('resize', measure)

        let ro: ResizeObserver | undefined
        const header = document.querySelector('header')
        if (header && typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(measure)
            ro.observe(header)
        }

        return () => {
            window.removeEventListener('resize', measure)
            ro?.disconnect()
        }
    }, [])

    return { top, bottom }
}

export default function UnifiedChatPage() {
    const router = useRouter()
    const params = useParams()
    const queryClient = useQueryClient()
    const { isAuthenticated, canAccessMarketplace } = useAuthStore()
    const { top: headerHeight, bottom: bottomNavHeight } = useLayoutOffsets()

    const slugParts = params?.slug as string[] | undefined
    const initialChatId = slugParts?.[0] || null

    const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId)
    const [searchQuery, setSearchQuery] = useState('')
    const hasChatAccess = isAuthenticated && canAccessMarketplace()

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

    const handleSelectChat = useCallback((chatId: string) => {
        setSelectedChatId(chatId)
        window.history.replaceState(null, '', `/marketplace/chat/${chatId}`)
        queryClient.invalidateQueries({ queryKey: ['chat-detail', chatId] })
    }, [queryClient])

    const handleBack = useCallback(() => {
        setSelectedChatId(null)
        window.history.replaceState(null, '', '/marketplace/chat')
    }, [])

    if (!isAuthenticated) return null

    if (!canAccessMarketplace()) {
        return (
            <div
                className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4"
                style={{ top: headerHeight }}
            >
                <UpgradePrompt
                    isOpen={true}
                    onClose={() => router.push('/marketplace')}
                    title="Verification Required"
                    description="You must verify your student account to use the messaging system."
                />
            </div>
        )
    }

    return (
        <div
            className="fixed inset-x-0 flex flex-col bg-gray-50"
            style={{ top: headerHeight, bottom: bottomNavHeight }}
        >
            {/* Desktop breadcrumb */}
            <div className="hidden md:block shrink-0 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-2.5">
                    <nav className="flex items-center text-sm text-gray-500 font-medium">
                        <Link href="/marketplace" className="hover:text-[#4C3B8A] transition-colors">Marketplace</Link>
                        <span className="mx-2 text-gray-300">/</span>
                        <span className="text-gray-900 font-semibold">Messages</span>
                    </nav>
                </div>
            </div>

            {/* Main chat container — fills remaining viewport */}
            <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto md:p-4">
                <div className="h-full bg-white md:rounded-2xl md:border border-gray-200 md:shadow-lg overflow-hidden flex">

                    {/* Left: Thread list */}
                    <div className={`w-full md:w-[380px] lg:w-[400px] shrink-0 md:border-r border-gray-100 flex flex-col ${
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

                    {/* Right: Chat window or empty state */}
                    <div className={`flex-1 flex flex-col min-w-0 ${
                        selectedChatId ? 'flex' : 'hidden md:flex'
                    }`}>
                        {selectedChatId ? (
                            chatDetailLoading && !chatWindowData ? (
                                <div className="flex-1 flex items-center justify-center bg-gray-50/50">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-[3px] border-[#4C3B8A] border-t-transparent rounded-full animate-spin mx-auto" />
                                        <p className="text-gray-400 text-sm mt-4 font-medium">Loading conversation...</p>
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
                            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50/50 to-white">
                                <div className="text-center px-8 max-w-sm">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4C3B8A]/10 to-[#6B5AAE]/5 flex items-center justify-center mx-auto mb-6">
                                        <MessageCircle className="w-10 h-10 text-[#4C3B8A]/40" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Your Messages</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Select a conversation from the list to start chatting, or message a seller from any listing.
                                    </p>
                                    <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-300">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>End-to-end campus verified</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
