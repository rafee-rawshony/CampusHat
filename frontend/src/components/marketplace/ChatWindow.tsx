'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Send, Paperclip } from 'lucide-react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { useAuthStore } from '@/stores/auth.store'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import useWebSocket from '@/hooks/useWebSocket'
import type { ChatMessage } from '@/hooks/useWebSocket'
import { ChatMessageBubble } from '@/components/marketplace/ChatMessageBubble'
import { OfferMessageCard } from '@/components/marketplace/OfferMessageCard'
import { absoluteMediaUrl } from '@/services/upload.service'

interface ChatWindowProps {
    chatId: string
    chatData?: {
        id: string
        seller_id: string
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
    } | null
    onBack?: () => void
}

function getListingImage(chatData: ChatWindowProps['chatData']): string | null {
    if (!chatData?.listing?.images || chatData.listing.images.length === 0) return null
    const first = chatData.listing.images[0]
    return typeof first === 'string' ? first : first.image_url || first.image || null
}

function formatDateSeparator(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEE, MMM d')
}

export function ChatWindow({ chatId, chatData, onBack }: ChatWindowProps) {
    const { user } = useAuthStore()
    const { messages, setMessages, isConnected, isTyping, sendMessage, sendTyping, markRead } = useWebSocket(chatId)
    const [inputText, setInputText] = useState('')
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const isNearBottomRef = useRef(true)

    const otherUser = chatData?.other_user
    const listing = chatData?.listing
    const listingImage = chatData ? getListingImage(chatData) : null

    const initials = otherUser?.name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'

    useEffect(() => {
        setIsLoadingHistory(true)
        setInputText('')
        api.get(`/marketplace/chats/${chatId}/messages/`)
            .then(res => {
                const data = res.data?.data || res.data?.results || res.data || []
                setMessages(data)
            })
            .catch(() => {})
            .finally(() => setIsLoadingHistory(false))
    }, [chatId, setMessages])

    useEffect(() => { markRead() }, [chatId, markRead])

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current
        if (!el) return
        isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    }, [])

    useEffect(() => {
        if (isNearBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    useEffect(() => {
        if (!isLoadingHistory) {
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
            })
        }
    }, [isLoadingHistory])

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value)
        const ta = e.target
        ta.style.height = 'auto'
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
        sendTyping()
    }

    const handleSend = async () => {
        const text = inputText.trim()
        if (!text) return

        const optimisticMsg: ChatMessage = {
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
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
        isNearBottomRef.current = true

        const sent = await sendMessage(text, 'text')
        if (!sent) {
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
            setInputText(text)
            toast.error('Message not sent. Check your connection.')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleAcceptOffer = async (offerId: string | number) => {
        try {
            await api.patch(`/marketplace/offers/${offerId}/accept/`)
            setMessages(prev =>
                prev.map(m =>
                    m.offer?.id === offerId ? { ...m, offer: { ...m.offer!, status: 'accepted' as const } } : m
                )
            )
            toast.success('Offer accepted!')
        } catch { toast.error('Failed to accept offer') }
    }

    const handleDeclineOffer = async (offerId: string | number) => {
        try {
            await api.patch(`/marketplace/offers/${offerId}/reject/`)
            setMessages(prev =>
                prev.map(m =>
                    m.offer?.id === offerId ? { ...m, offer: { ...m.offer!, status: 'rejected' as const } } : m
                )
            )
            toast.success('Offer declined.')
        } catch { toast.error('Failed to decline offer') }
    }

    const isSeller = chatData ? String(user?.id) === String(chatData.seller_id) : false

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 bg-white border-b border-gray-100 px-3 sm:px-4 flex items-center gap-3 h-[60px]">
                <button
                    onClick={onBack}
                    className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 -ml-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-gray-100">
                    {otherUser?.profile_picture ? (
                        <Image src={absoluteMediaUrl(otherUser.profile_picture)} alt={otherUser.name || 'User'} width={40} height={40} unoptimized className="object-cover w-full h-full" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#4C3B8A] to-[#6B5AAE] text-white flex items-center justify-center font-bold text-xs">
                            {initials}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-gray-900 truncate">
                            {otherUser?.name || 'Chat'}
                        </h3>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    {listing && (
                        <p className="text-[11px] text-gray-400 truncate">{listing.title}</p>
                    )}
                </div>

                {listing && (
                    <Link
                        href={`/marketplace/listings/${listing.id}`}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 hidden sm:block hover:opacity-80 transition-opacity"
                    >
                        {listingImage ? (
                            <Image src={absoluteMediaUrl(listingImage)} alt={listing.title} width={40} height={40} unoptimized className="object-cover w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#4C3B8A]/10">
                                <span className="text-[8px] text-[#4C3B8A] font-bold">AD</span>
                            </div>
                        )}
                    </Link>
                )}
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-2 bg-[#FAFAFA]"
            >
                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                        <div className="w-7 h-7 border-2 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-xs">Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Send className="w-5 h-5 text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">No messages yet</p>
                        <p className="text-gray-300 text-xs mt-1">Say hello to start the conversation!</p>
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
                                            <span className="text-[11px] text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm font-medium">
                                                {formatDateSeparator(msg.created_at)}
                                            </span>
                                        </div>
                                    )}
                                    {msg.message_type === 'offer' || msg.message_type === 'offer_ref' ? (
                                        <OfferMessageCard message={msg} isMe={isMe} isSeller={isSeller} listingId={listing?.id || ''} onAcceptOffer={handleAcceptOffer} onDeclineOffer={handleDeclineOffer} />
                                    ) : (
                                        <ChatMessageBubble message={msg} isMe={isMe} showAvatar={showAvatar} otherUser={otherUser ? { full_name: otherUser.name, profile_picture: otherUser.profile_picture } : undefined} />
                                    )}
                                </React.Fragment>
                            )
                        })}
                        {isTyping && (
                            <div className="flex items-center gap-2 text-gray-400 text-xs pl-8">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span>{otherUser?.name || 'User'} is typing...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="shrink-0 bg-white border-t border-gray-100 px-3 sm:px-4 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
                <div className="flex items-end gap-2">
                    <button
                        className="w-9 h-9 flex items-center justify-center text-gray-300 rounded-full shrink-0 cursor-not-allowed"
                        disabled
                        title="Attachments coming soon"
                    >
                        <Paperclip className="w-[18px] h-[18px]" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 bg-gray-50 rounded-2xl px-4 py-2.5 text-sm resize-none outline-none border border-gray-200 focus:border-[#4C3B8A]/40 focus:ring-1 focus:ring-[#4C3B8A]/20 max-h-[120px] placeholder:text-gray-400 transition-colors"
                        style={{ minHeight: '40px' }}
                    />

                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            inputText.trim()
                                ? 'bg-[#4C3B8A] text-white hover:bg-[#3D2F6E] shadow-sm active:scale-95'
                                : 'bg-gray-100 text-gray-300'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
