'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { ChatMessageBubble } from '@/components/marketplace/ChatMessageBubble'
import { absoluteMediaUrl } from '@/services/upload.service'

interface StoreChatWindowProps {
    chatId: string
    chatData?: any
}

function formatDateSeparator(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEE, MMM d')
}

export function StoreChatWindow({ chatId, chatData }: StoreChatWindowProps) {
    const router = useRouter()
    const { user } = useAuthStore()
    const [messages, setMessages] = useState<any[]>([])
    const [inputText, setInputText] = useState('')
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const otherUser = chatData?.store_name ? {
        name: chatData.store_name,
        profile_picture: chatData.store_logo
    } : { name: 'Store', profile_picture: null }

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/mall/chats/${chatId}/messages/`)
            const data = res.data?.data || []
            // Mark read
            api.post(`/mall/chats/${chatId}/mark-read/`).catch(() => {})
            
            // Only update if changed (simple length check for polling)
            setMessages(prev => {
                if (prev.length !== data.length) return data
                return prev
            })
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    // Load message history on mount and poll
    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [chatId])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        const text = inputText.trim()
        if (!text) return

        // Optimistic UI
        const optimisticMsg = {
            id: `temp-${Date.now()}`,
            sender: {
                id: user?.id || '',
                full_name: user?.full_name || '',
                profile_picture: user?.profile_picture || null,
            },
            content: text,
            message_type: 'text',
            created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, optimisticMsg])
        setInputText('')

        try {
            await api.post(`/mall/chats/${chatId}/send/`, { content: text })
            fetchMessages()
        } catch (e) {
            console.error('Failed to send message', e)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA]" style={{ height: '100dvh' }}>
            {/* ─── HEADER ─── */}
            <div className="shrink-0 h-16 bg-white border-b border-gray-200 px-4 flex items-center gap-3 z-10">
                <button
                    onClick={() => router.push('/account/messages')}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 -ml-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-brand-light flex items-center justify-center font-bold text-brand-primary">
                    {otherUser.profile_picture ? (
                        <Image src={absoluteMediaUrl(otherUser.profile_picture)} alt={otherUser.name} width={36} height={36} unoptimized className="object-cover w-full h-full" />
                    ) : (
                        otherUser.name.charAt(0)
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {otherUser.name}
                    </h3>
                    <p className="text-xs text-gray-400">Mall Store</p>
                </div>
            </div>

            {/* ─── MESSAGES AREA ─── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Send className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => {
                            const isMe = String(msg.sender?.id) === String(user?.id)
                            const showAvatar = !isMe && (idx === 0 || String(messages[idx - 1]?.sender?.id) !== String(msg.sender?.id))
                            const showDateSeparator = idx === 0 || !isSameDay(new Date(msg.created_at), new Date(messages[idx - 1].created_at))

                            return (
                                <React.Fragment key={msg.id}>
                                    {showDateSeparator && (
                                        <div className="flex items-center justify-center my-3">
                                            <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                                                {formatDateSeparator(msg.created_at)}
                                            </span>
                                        </div>
                                    )}
                                    <ChatMessageBubble
                                        message={msg}
                                        isMe={isMe}
                                        showAvatar={showAvatar}
                                        otherUser={{ full_name: otherUser.name, profile_picture: otherUser.profile_picture }}
                                    />
                                </React.Fragment>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* ─── INPUT BAR ─── */}
            <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-3">
                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm resize-none outline-none border-none max-h-[120px]"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            inputText.trim() ? 'bg-[#4C3B8A] text-white hover:bg-[#3D2F6E]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
