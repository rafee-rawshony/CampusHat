'use client'

import React, { useState, useEffect } from 'react'
import {
    Search, MessageSquare, Image as ImageIcon, Send, MoreVertical, ShieldAlert
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export default function SellerMessagesPage() {
    const [conversations, setConversations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [msgText, setMsgText] = useState('')

    useEffect(() => {
        // Mock API GET /api/v1/seller/messages/
        setTimeout(() => {
            setConversations([
                {
                    id: 'msg-1', buyer: 'Rahim Uddin', avatar: null,
                    product: 'Mechanical Keyboard Blue Switch',
                    lastMsg: 'Is the price negotiable?',
                    time: '10:30 AM', unread: 2,
                    messages: [
                        { sender: 'buyer', text: 'Hi, is this still available?', time: '10:25 AM' },
                        { sender: 'seller', text: 'Yes, it is in stock.', time: '10:28 AM' },
                        { sender: 'buyer', text: 'Is the price negotiable?', time: '10:30 AM' },
                    ]
                },
                {
                    id: 'msg-2', buyer: 'Sadia Rahman', avatar: 'https://placehold.co/40x40/orange/white',
                    product: 'Calculus 8th Edition',
                    lastMsg: 'I will pick it up tomorrow from TSC.',
                    time: 'Yesterday', unread: 0,
                    messages: [
                        { sender: 'buyer', text: 'Where can we meet?', time: 'Yesterday 2:00 PM' },
                        { sender: 'seller', text: 'I can come to TSC anytime after 4 PM.', time: 'Yesterday 2:15 PM' },
                        { sender: 'buyer', text: 'I will pick it up tomorrow from TSC.', time: 'Yesterday 2:30 PM' },
                    ]
                }
            ])
            setIsLoading(false)
        }, 500)
    }, [])

    const selectedConv = conversations.find(c => c.id === selectedId)

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!msgText.trim() || !selectedId) return

        // Update local state temporarily
        const newConversations = conversations.map(c => {
            if (c.id === selectedId) {
                return {
                    ...c,
                    messages: [...c.messages, { sender: 'seller', text: msgText, time: 'Just now' }],
                    lastMsg: msgText,
                    time: 'Just now'
                }
            }
            return c
        })
        setConversations(newConversations)
        setMsgText('')
    }

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="h-[600px] bg-gray-200 rounded-2xl flex"></div>
        </div>
    }

    return (
        <div className="h-[calc(100vh-140px)] min-h-[500px] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex h-full">
                {/* Conversation List */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-black text-gray-900 mb-4">Messages</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input placeholder="Search buyers..." className="pl-9 bg-white border-gray-200" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto w-full">
                        {conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => {
                                    setSelectedId(conv.id)
                                    // Mark read
                                    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c))
                                }}
                                className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-gray-100 flex gap-3
                                    ${selectedId === conv.id ? 'bg-brand-primary/5 border-l-4 border-l-brand-primary' : 'border-l-4 border-l-transparent'}
                                `}
                            >
                                <Avatar className="w-10 h-10 shrink-0">
                                    {conv.avatar ? <AvatarImage src={conv.avatar} /> : <AvatarFallback className="bg-gradient-to-br from-brand-primary to-purple-600 text-white font-bold">{getInitials(conv.buyer)}</AvatarFallback>}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className="font-bold text-sm text-gray-900 truncate pr-2">{conv.buyer}</h3>
                                        <span className="text-[10px] text-gray-400 font-medium shrink-0">{conv.time}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-brand-primary truncate">{conv.product}</p>
                                    <p className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{conv.lastMsg}</p>
                                </div>
                                {conv.unread > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center shrink-0 self-center">
                                        <span className="text-[10px] font-bold text-white leading-none">{conv.unread}</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        {selectedConv.avatar ? <AvatarImage src={selectedConv.avatar} /> : <AvatarFallback className="bg-gradient-to-br from-brand-primary to-purple-600 text-white font-bold">{getInitials(selectedConv.buyer)}</AvatarFallback>}
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{selectedConv.buyer}</h3>
                                        <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                                        <ShieldAlert className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Product Reference Banner */}
                            <div className="bg-gray-50 border-b border-gray-100 px-6 py-2 flex items-center justify-between text-xs">
                                <span className="text-gray-600 font-medium">Inquiring about: <span className="font-bold text-gray-900">{selectedConv.product}</span></span>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                                {selectedConv.messages.map((m: any, i: number) => {
                                    const isSeller = m.sender === 'seller'
                                    return (
                                        <div key={i} className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${isSeller
                                                    ? 'bg-brand-primary text-white rounded-br-sm'
                                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                                                }`}>
                                                <p className="text-sm">{m.text}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isSeller ? 'text-brand-primary-light text-white/70' : 'text-gray-400'}`}>
                                                    {m.time}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Compose Area */}
                            <div className="p-4 bg-white border-t border-gray-100">
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <button type="button" className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <Input
                                        value={msgText}
                                        onChange={(e) => setMsgText(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-brand-primary"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!msgText.trim()}
                                        className="p-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                <MessageSquare className="w-6 h-6 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-bold mb-1">Your Messages</h3>
                            <p className="text-sm text-gray-500 max-w-xs">Select a conversation from the list to start messaging with buyers.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
