'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { StoreChatWindow } from '@/components/mall/StoreChatWindow'

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

export default function MallChatDetailPage() {
    const params = useParams()
    const router = useRouter()
    const chatId = params?.id as string
    const { top: headerHeight, bottom: bottomNavHeight } = useLayoutOffsets()

    const { data: chatData, isLoading: chatLoading } = useQuery({
        queryKey: ['mall-chat-detail', chatId],
        queryFn: async () => {
            const res = await api.get(`/mall/chats/buyer/`)
            const chats = res.data?.data || []
            return chats.find((c: any) => c.id === chatId) || null
        },
        enabled: !!chatId,
    })

    const handleBack = useCallback(() => {
        router.push('/account/messages')
    }, [router])

    return (
        <div
            className="fixed inset-x-0 flex flex-col bg-gray-50"
            style={{ top: headerHeight, bottom: bottomNavHeight }}
        >
            {/* Desktop breadcrumb */}
            <div className="hidden md:block shrink-0 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-2.5">
                    <nav className="flex items-center text-sm text-gray-500 font-medium">
                        <Link href="/account/messages" className="hover:text-[#4C3B8A] transition-colors">Messages</Link>
                        <span className="mx-2 text-gray-300">/</span>
                        <span className="text-gray-900 font-semibold">{chatData?.store_name || 'Store Chat'}</span>
                    </nav>
                </div>
            </div>

            {/* Main chat container */}
            <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto md:p-4">
                <div className="h-full bg-white md:rounded-2xl md:border border-gray-200 md:shadow-lg overflow-hidden flex">
                    <div className="flex-1 flex flex-col min-w-0">
                        {chatLoading ? (
                            <div className="flex-1 flex items-center justify-center bg-gray-50/50">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-[3px] border-[#4C3B8A] border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="text-gray-400 text-sm mt-4 font-medium">Loading conversation...</p>
                                </div>
                            </div>
                        ) : (
                            <StoreChatWindow chatId={chatId} chatData={chatData} onBack={handleBack} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
