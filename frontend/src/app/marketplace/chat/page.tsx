'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Send, Image as ImageIcon, CheckCircle, XCircle, ArrowLeft, CornerDownRight, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { formatDistanceToNow, format } from 'date-fns'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'

interface ChatParticipant {
    id: number | string
    first_name: string
    last_name: string
    avatar?: string
}

interface ChatListing {
    id: number | string
    title: string
    image: string
    price: string
}

interface ChatThread {
    id: string
    participant: ChatParticipant
    listing: ChatListing
    last_message: string
    last_message_time: string
    unread_count: number
}

interface ChatMessage {
    id: string
    sender_id: number | string
    text: string
    timestamp: string
    is_offer?: boolean
    offer_amount?: string
    offer_status?: 'pending' | 'accepted' | 'declined'
    image?: string
}

function ChatContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const urlListingId = searchParams?.get('listing')
    const urlUserId = searchParams?.get('user')

    const { isAuthenticated, user, isVerifiedStudent, isAdmin, isModerator, isSeller } = useAuthStore()
    const canAccessMarketplace = isAuthenticated && (isVerifiedStudent() || isAdmin() || isModerator() || isSeller())

    const [threads, setThreads] = useState<ChatThread[]>([])
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')


    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load Threads
    useEffect(() => {
        if (!canAccessMarketplace) return

        // Mocking Data for Demonstration
        const mockThreads: ChatThread[] = [
            {
                id: 'chat-1',
                participant: { id: 2, first_name: 'John', last_name: 'Doe', avatar: 'https://placehold.co/100x100' },
                listing: { id: 101, title: 'MacBook Pro M1 2020', image: 'https://placehold.co/100x100', price: '90000' },
                last_message: 'Is this still available?',
                last_message_time: new Date(Date.now() - 3600000).toISOString(),
                unread_count: 2
            },
            {
                id: 'chat-2',
                participant: { id: 3, first_name: 'Sarah', last_name: 'Smith' },
                listing: { id: 102, title: 'Calculus Textbook 8th Ed', image: 'https://placehold.co/100x100', price: '500' },
                last_message: 'I can meet you by the library.',
                last_message_time: new Date(Date.now() - 86400000).toISOString(),
                unread_count: 0
            }
        ]

        setThreads(mockThreads)


        // Automatically create/open active thread if params passed
        if (urlListingId && urlUserId) {
            // Check if thread exists
            const existing = mockThreads.find(t => t.listing.id == urlListingId && t.participant.id == urlUserId)
            if (existing) {
                setActiveThreadId(existing.id)
            } else {
                // Mock creating new thread
                const newThread: ChatThread = {
                    id: `chat-${Date.now()}`,
                    participant: { id: urlUserId, first_name: 'Seller', last_name: 'Account' },
                    listing: { id: urlListingId, title: 'New Conversation', image: 'https://placehold.co/100x100', price: '0' },
                    last_message: 'Start a conversation...',
                    last_message_time: new Date().toISOString(),
                    unread_count: 0
                }
                setThreads(prev => [newThread, ...prev])
                setActiveThreadId(newThread.id)
            }
        } else if (mockThreads.length > 0 && !activeThreadId) {
            // Auto open first on desktop
            if (window.innerWidth >= 768) {
                setActiveThreadId(mockThreads[0].id)
            }
        }
    }, [canAccessMarketplace, urlListingId, urlUserId, activeThreadId])

    // Load Messages
    useEffect(() => {
        if (!activeThreadId) return

        // Mock Messages Payload
        setMessages([
            { id: 'm1', sender_id: 2, text: 'Hi, is this still available?', timestamp: new Date(Date.now() - 7200000).toISOString() },
            { id: 'm2', sender_id: user?.id || 1, text: 'Yes it is! Are you on campus today?', timestamp: new Date(Date.now() - 7000000).toISOString() },
            { id: 'm3', sender_id: 2, text: 'I made an offer.', timestamp: new Date(Date.now() - 3600000).toISOString(), is_offer: true, offer_amount: '85000', offer_status: 'pending' },
        ])

        // Setup Dummy WebSocket
        // const ws = new WebSocket(`ws://localhost:8000/api/ws/chat/${activeThreadId}/`)
        // ws.onmessage = (e) => { const newMsg = JSON.parse(e.data); setMessages(prev => [...prev, newMsg]) }
        // return () => ws.close()
    }, [activeThreadId, user?.id])

    // Auto scroll bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !activeThreadId) return

        const msgPayload: ChatMessage = {
            id: `temp-${Date.now()}`,
            sender_id: user?.id || 1,
            text: newMessage.trim(),
            timestamp: new Date().toISOString()
        }

        // Optimistic UI
        setMessages(prev => [...prev, msgPayload])
        setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, last_message: msgPayload.text, last_message_time: msgPayload.timestamp } : t))
        setNewMessage('')

        try {
            await api.post(`/marketplace/chats/${activeThreadId}/messages/`, { text: msgPayload.text })
        } catch (error) {
            console.error("Message send failed through API. (Expected on Frontend Demo)")
        }
    }

    const respondToOffer = async (msgId: string, accept: boolean) => {
        // Toggle locally
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, offer_status: accept ? 'accepted' : 'declined' } : m))
        // API Call
        try {
            await api.patch(`/marketplace/chats/offers/${msgId}/`, { status: accept ? 'accepted' : 'declined' })
        } catch (error) {
            console.error("Failed to update offer status")
        }
    }

    if (!canAccessMarketplace) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] pt-12">
                <UpgradePrompt
                    isOpen={true}
                    onClose={() => router.push('/marketplace')}
                    title="Verification Required"
                    description="You must verify your university email to use the chat system. This stops spam and keeps our community safe."
                />
            </div>
        )
    }

    const activeThread = threads.find(t => t.id === activeThreadId)
    const filteredThreads = threads.filter(t =>
        t.participant.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.listing.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="bg-[#F5F5F5] min-h-[calc(100vh-64px)] h-full">
            <div className="container mx-auto max-w-7xl h-[calc(100vh-64px)] p-0 md:p-4">
                <div className="bg-white md:rounded-2xl border-x md:border border-gray-100 shadow-sm overflow-hidden flex h-full">

                    {/* LEFT PANEL: Chat List */}
                    <div className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r border-gray-100 flex flex-col ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-extrabold text-[#1A1A2E] mb-4">Messages</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search chats..."
                                    className="pl-9 h-10 border-gray-200 focus-visible:ring-brand-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            {filteredThreads.map(thread => (
                                <div
                                    key={thread.id}
                                    onClick={() => setActiveThreadId(thread.id)}
                                    className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer transition-colors ${activeThreadId === thread.id ? 'bg-brand-primary/5 border-l-4 border-l-brand-primary' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                            {thread.participant.avatar ? (
                                                <Image src={thread.participant.avatar} alt="Avatar" width={48} height={48} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-brand-primary text-white font-bold text-lg">
                                                    {thread.participant.first_name[0]}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className="font-bold text-gray-900 truncate pr-2">{thread.participant.first_name} {thread.participant.last_name}</h4>
                                            <span className="text-[10px] text-gray-500 shrink-0">{formatDistanceToNow(new Date(thread.last_message_time))}</span>
                                        </div>
                                        <p className="text-[11px] font-semibold text-brand-primary truncate">{thread.listing.title}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className={`text-xs truncate max-w-[200px] ${thread.unread_count > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                                                {thread.last_message}
                                            </p>
                                            {thread.unread_count > 0 && (
                                                <div className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                                                    {thread.unread_count}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredThreads.length === 0 && (
                                <div className="p-8 text-center text-gray-500 text-sm">No messages found.</div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Active Chat Window */}
                    <div className={`flex-1 flex flex-col bg-[#FDFDFD] relative ${!activeThreadId ? 'hidden md:flex items-center justify-center' : 'flex'}`} style={{ height: '100dvh' }}>
                        {!activeThreadId ? (
                            <div className="text-center text-gray-400">
                                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold text-gray-900">Your Messages</h3>
                                <p className="text-sm">Select a conversation from the sidebar to start chatting.</p>
                            </div>
                        ) : activeThread ? (
                            <>
                                {/* Chat Header */}
                                <div className="shrink-0 h-16 md:h-20 border-b border-gray-100 bg-white flex items-center px-4 justify-between shadow-sm z-10">
                                    <div className="flex items-center gap-3 w-full">
                                        <button onClick={() => setActiveThreadId(null)} className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <Link href={`/marketplace/listings/${activeThread.listing.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-xl transition-colors min-w-0">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-100 hidden sm:block shrink-0">
                                                <Image src={activeThread.listing.image} alt={activeThread.listing.title} width={48} height={48} className="object-cover w-full h-full" />
                                            </div>
                                            <div className="min-w-0 pr-4">
                                                <h3 className="font-bold text-gray-900 leading-none mb-1">
                                                    {activeThread.participant.first_name} {activeThread.participant.last_name}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate flex items-center gap-1 font-medium">
                                                    <CornerDownRight className="w-3 h-3 text-brand-primary" />
                                                    {activeThread.listing.title} <span className="font-bold text-gray-900 ml-1">৳{activeThread.listing.price}</span>
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div className="text-center my-4">
                                        <span className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                                            Chat Started
                                        </span>
                                    </div>

                                    {messages.map((msg, idx) => {
                                        const isMe = msg.sender_id === (user?.id || 1)
                                        const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id)

                                        if (msg.is_offer) {
                                            return (
                                                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] md:max-w-[70%] bg-white border ${isMe ? 'border-brand-primary/20 shadow-md shadow-brand-primary/5' : 'border-gray-200 shadow-sm'} rounded-2xl p-4 relative`}>
                                                        <div className="flex items-center justify-between gap-4 mb-3 border-b border-gray-100 pb-3">
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{isMe ? 'You made an Offer' : 'Received an Offer'}</p>
                                                                <p className="text-2xl font-black text-brand-primary tracking-tight">৳{Number(msg.offer_amount).toLocaleString()}</p>
                                                            </div>
                                                            {msg.offer_status === 'pending' && <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>}
                                                            {msg.offer_status === 'accepted' && <Badge className="bg-green-100 text-green-800">Accepted</Badge>}
                                                            {msg.offer_status === 'declined' && <Badge variant="destructive">Declined</Badge>}
                                                        </div>
                                                        <p className="text-sm text-gray-700 font-medium leading-relaxed mb-4">&quot;{msg.text}&quot;</p>

                                                        {msg.offer_status === 'pending' && !isMe && (
                                                            <div className="flex gap-2">
                                                                <Button onClick={() => respondToOffer(msg.id, true)} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 gap-1 h-9">
                                                                    <CheckCircle className="w-4 h-4" /> Accept
                                                                </Button>
                                                                <Button onClick={() => respondToOffer(msg.id, false)} className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 gap-1 h-9">
                                                                    <XCircle className="w-4 h-4" /> Decline
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {msg.offer_status === 'pending' && isMe && (
                                                            <p className="text-xs text-gray-500 italic text-center">Waiting for seller response...</p>
                                                        )}
                                                        <span className="text-[9px] text-gray-400 absolute bottom-2 right-3 font-medium">
                                                            {format(new Date(msg.timestamp), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return (
                                            <div key={msg.id} className={`flex w-full gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                {!isMe && (
                                                    <div className="w-8 shrink-0">
                                                        {showAvatar && (
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                                <Image src={activeThread.participant.avatar || 'https://placehold.co/100x100'} alt="Avatar" width={32} height={32} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex flex-col max-w-[75%] md:max-w-[65%]">
                                                    <div className={`p-3 text-[15px] leading-relaxed relative ${isMe ? 'bg-brand-primary text-white rounded-2xl rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'}`}>
                                                        {msg.image && (
                                                            <div className="mb-2 relative w-full h-40 rounded-lg overflow-hidden border border-white/20">
                                                                <Image src={msg.image} alt="Attachment" fill className="object-cover" />
                                                            </div>
                                                        )}
                                                        <p className="break-words">{msg.text}</p>
                                                        <div className={`text-[9px] mt-1 text-right font-medium ${isMe ? 'text-brand-primary-light/70' : 'text-gray-400'}`}>
                                                            {format(new Date(msg.timestamp), 'h:mm a')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="shrink-0 p-3 bg-white border-t border-gray-100 pb-[max(12px,env(safe-area-inset-bottom))]">
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Button type="button" variant="ghost" size="icon" className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-full">
                                                <ImageIcon className="w-5 h-5" />
                                            </Button>
                                            <Input
                                                placeholder="Type a message..."
                                                className="pl-10 pr-4 h-12 bg-gray-50 border-gray-200 rounded-full focus-visible:ring-brand-primary"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="h-12 w-12 rounded-full p-0 bg-brand-primary hover:bg-brand-dark text-white shadow-md flex-shrink-0"
                                        >
                                            <Send className="w-5 h-5 ml-1" />
                                        </Button>
                                    </form>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F5F5F5] pt-20 text-center text-gray-500 animate-pulse">Loading discussion...</div>}>
            <ChatContent />
        </Suspense>
    )
}
