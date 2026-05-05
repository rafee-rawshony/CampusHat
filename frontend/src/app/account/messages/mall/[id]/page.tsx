'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StoreChatWindow } from '@/components/mall/StoreChatWindow'

export default function MallChatDetailPage() {
    const params = useParams()
    const router = useRouter()
    const chatId = params?.id as string

    // Fetch individual chat details to get store info
    const { data: chatData, isLoading: chatLoading } = useQuery({
        queryKey: ['mall-chat-detail', chatId],
        queryFn: async () => {
            const res = await api.get(`/mall/chats/buyer/`)
            const chats = res.data?.data || []
            return chats.find((c: any) => c.id === chatId) || null
        },
        enabled: !!chatId,
    })

    return (
        <div className="bg-[#F5F5F5] min-h-[calc(100vh-64px)]">
            <div className="container mx-auto max-w-7xl h-[calc(100vh-64px)] md:h-[calc(100vh-120px)] p-0 md:px-4 md:pb-4 md:pt-4">
                <div className="bg-white md:rounded-2xl border-x md:border border-gray-100 shadow-sm overflow-hidden flex h-full">
                    <div className="flex-1 flex flex-col min-w-0">
                        {chatLoading ? (
                            <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-2 border-[#4C3B8A] border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="text-gray-400 text-sm mt-3">Loading chat...</p>
                                </div>
                            </div>
                        ) : (
                            <StoreChatWindow chatId={chatId} chatData={chatData} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
