'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'
import { ChatConversationList } from '@/components/marketplace/ChatConversationList'
import type { ChatThread } from '@/components/marketplace/ChatConversationList'

export default function ChatListPage() {
    const router = useRouter()
    const { isAuthenticated, canAccessMarketplace } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState('')

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/auth/login?redirect=/marketplace/chat')
        }
    }, [isAuthenticated, router])

    // Fetch conversation list
    const { data: threads = [], isLoading } = useQuery<ChatThread[]>({
        queryKey: ['chat-threads'],
        queryFn: async () => {
            const res = await api.get('/marketplace/chats/')
            return res.data?.data || res.data?.results || res.data || []
        },
        enabled: isAuthenticated && canAccessMarketplace(),
        refetchInterval: 15000, // Poll every 15 seconds for new conversations
    })

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
            {/* Breadcrumb */}
            <div className="container mx-auto max-w-7xl px-4 pt-4 pb-2 hidden md:block">
                <nav className="flex items-center text-sm text-gray-500 font-medium">
                    <Link href="/marketplace" className="hover:text-gray-900 transition-colors">
                        Marketplace
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Messages</span>
                </nav>
            </div>

            <div className="container mx-auto max-w-7xl h-[calc(100vh-64px)] md:h-[calc(100vh-120px)] p-0 md:px-4 md:pb-4">
                <div className="bg-white md:rounded-2xl border-x md:border border-gray-100 shadow-sm overflow-hidden flex h-full">
                    {/* LEFT PANEL: Conversation List */}
                    <div className="w-full md:w-[320px] flex-shrink-0 md:border-r border-gray-200 flex flex-col">
                        <ChatConversationList
                            threads={threads}
                            isLoading={isLoading}
                            activeChatId={null}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        />
                    </div>

                    {/* RIGHT PANEL: Empty state (desktop only) */}
                    <div className="hidden md:flex flex-1 items-center justify-center bg-[#FAFAFA]">
                        <div className="text-center">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-500 mb-1">Your Messages</h3>
                            <p className="text-sm text-gray-400">
                                Select a conversation to start chatting
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
