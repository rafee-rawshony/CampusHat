'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Paperclip } from 'lucide-react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import useWebSocket from '@/hooks/useWebSocket'
import type { ChatMessage } from '@/hooks/useWebSocket'
import { ChatMessageBubble } from '@/components/marketplace/ChatMessageBubble'
import { OfferMessageCard } from '@/components/marketplace/OfferMessageCard'

interface ChatWindowProps {
    chatId: string
    chatData?: {
        id: string
        seller_id: string  // UUID of the listing owner — used to determine if current user is seller
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
    } | null
}

function getListingImage(listing: ChatWindowProps['chatData']): string | null {
    if (!listing?.listing?.images || listing.listing.images.length === 0) return null
    const first = listing.listing.images[0]
    return typeof first === 'string' ? first : first.image
}

function formatDateSeparator(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEE, MMM d')
}

export function ChatWindow({ chatId, chatData }: ChatWindowProps) {
    const router = useRouter()
    const { user } = useAuthStore()
    const { toast } = useToast()
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

    // Load message history on mount
    useEffect(() => {
        const loadHistory = async () => {
            setIsLoadingHistory(true)
            try {
                const res = await api.get(`/marketplace/chats/${chatId}/messages/`)
                const data = res.data?.data || res.data?.results || res.data || []
                setMessages(data)
            } catch {
                // Will work with WebSocket messages
            } finally {
                setIsLoadingHistory(false)
            }
        }

        loadHistory()
    }, [chatId, setMessages])

    // Mark as read when opening
    useEffect(() => {
        markRead()
    }, [chatId, markRead])

    // Track scroll position
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current
        if (!container) return
        const threshold = 100
        isNearBottomRef.current =
            container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        if (isNearBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    // Initial scroll to bottom
    useEffect(() => {
        if (!isLoadingHistory) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
            }, 100)
        }
    }, [isLoadingHistory])

    // Auto-resize textarea + send typing indicator
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value)
        const textarea = e.target
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
        sendTyping()
    }

    const handleSend = () => {
        const text = inputText.trim()
        if (!text) return

        // Optimistic UI: add message immediately
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
        sendMessage(text, 'text')

        setInputText('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
        isNearBottomRef.current = true
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleAcceptOffer = async (offerId: string | number) => {
        try {
            await api.patch(`/marketplace/listings/${listing?.id}/offers/${offerId}/`, {
                status: 'accepted',
            })
            // Update offer status in messages
            setMessages(prev =>
                prev.map(m =>
                    m.offer?.id === offerId
                        ? { ...m, offer: { ...m.offer!, status: 'accepted' as const } }
                        : m
                )
            )
            toast({ title: 'Offer accepted!' })
        } catch {
            toast({ title: 'Failed to accept offer', variant: 'destructive' })
        }
    }

    const handleDeclineOffer = async (offerId: string | number) => {
        try {
            await api.patch(`/marketplace/listings/${listing?.id}/offers/${offerId}/`, {
                status: 'rejected',
            })
            setMessages(prev =>
                prev.map(m =>
                    m.offer?.id === offerId
                        ? { ...m, offer: { ...m.offer!, status: 'rejected' as const } }
                        : m
                )
            )
            toast({ title: 'Offer declined.' })
        } catch {
            toast({ title: 'Failed to decline offer', variant: 'destructive' })
        }
    }

    // Current user is the seller if their ID matches the listing owner's ID
    const isSeller = chatData ? String(user?.id) === String(chatData.seller_id) : false

    return (
        <div className="flex flex-col h-full" style={{ height: '100dvh' }}>
            {/* ─── HEADER ─── */}
            <div className="shrink-0 h-16 bg-white border-b border-gray-200 px-4 flex items-center gap-3 z-10">
                {/* Back button — mobile only */}
                <button
                    onClick={() => router.push('/marketplace/chat')}
                    className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 -ml-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* User info */}
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                    {otherUser?.profile_picture ? (
                        <Image
                            src={otherUser.profile_picture}
                            alt={otherUser.name || 'User'}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full bg-[#4C3B8A] text-white flex items-center justify-center font-bold text-xs">
                            {initials}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">
                            {otherUser?.name || 'Chat'}
                        </h3>
                        {/* Connection status */}
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs text-gray-400 hidden sm:inline">
                            {isConnected ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    {listing && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">
                            {listing.title}
                        </p>
                    )}
                </div>

                {/* Listing thumbnail */}
                {listing && (
                    <Link
                        href={`/marketplace/listings/${listing.id}`}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 hidden sm:block hover:opacity-80 transition-opacity"
                    >
                        {listingImage ? (
                            <Image
                                src={listingImage}
                                alt={listing.title}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#4C3B8A]/10">
                                <span className="text-[8px] text-[#4C3B8A] font-bold">AD</span>
                            </div>
                        )}
                    </Link>
                )}
            </div>

            {/* ─── MESSAGES AREA ─── */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]"
            >
                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-sm mt-3">Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Send className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-sm">
                            No messages yet. Say hello!
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => {
                            const isMe = String(msg.sender?.id) === String(user?.id)
                            const showAvatar =
                                !isMe &&
                                (idx === 0 || String(messages[idx - 1]?.sender?.id) !== String(msg.sender?.id))

                            // Date separator
                            const showDateSeparator =
                                idx === 0 ||
                                !isSameDay(
                                    new Date(msg.created_at),
                                    new Date(messages[idx - 1].created_at)
                                )

                            return (
                                <React.Fragment key={msg.id}>
                                    {showDateSeparator && (
                                        <div className="flex items-center justify-center my-3">
                                            <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                                                {formatDateSeparator(msg.created_at)}
                                            </span>
                                        </div>
                                    )}

                                    {msg.message_type === 'offer' ? (
                                        <OfferMessageCard
                                            message={msg}
                                            isMe={isMe}
                                            isSeller={isSeller}
                                            listingId={listing?.id || ''}
                                            onAcceptOffer={handleAcceptOffer}
                                            onDeclineOffer={handleDeclineOffer}
                                        />
                                    ) : (
                                        <ChatMessageBubble
                                            message={msg}
                                            isMe={isMe}
                                            showAvatar={showAvatar}
                                            otherUser={otherUser ? {
                                                full_name: otherUser.name,
                                                profile_picture: otherUser.profile_picture,
                                            } : undefined}
                                        />
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

            {/* ─── INPUT BAR ─── */}
            <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
                <div className="flex items-end gap-2">
                    {/* Attachment placeholder */}
                    <button
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#4C3B8A] rounded-full hover:bg-gray-100 transition-colors shrink-0 opacity-50 cursor-not-allowed"
                        disabled
                        title="Attachments coming soon"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm resize-none outline-none border-none max-h-[120px] placeholder:text-gray-400"
                        style={{ minHeight: '40px' }}
                    />

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            inputText.trim()
                                ? 'bg-[#4C3B8A] text-white hover:bg-[#3D2F6E] shadow-md'
                                : 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
