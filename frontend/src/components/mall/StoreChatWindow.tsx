'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ArrowLeft, Send, Paperclip, X, Loader2 } from 'lucide-react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { ChatMessageBubble } from '@/components/marketplace/ChatMessageBubble'
import { absoluteMediaUrl, uploadImage } from '@/services/upload.service'

interface StoreChatWindowProps {
    chatId: string
    chatData?: any
    onBack?: () => void
}

function formatDateSeparator(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEE, MMM d, yyyy')
}

export function StoreChatWindow({ chatId, chatData, onBack }: StoreChatWindowProps) {
    const { user } = useAuthStore()
    const [messages, setMessages] = useState<any[]>([])
    const [inputText, setInputText] = useState('')
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const [attachmentPreview, setAttachmentPreview] = useState<{ file: File; url: string } | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isNearBottomRef = useRef(true)

    const otherUser = chatData?.store_name ? {
        name: chatData.store_name,
        profile_picture: chatData.store_logo
    } : { name: 'Store', profile_picture: null }

    const initials = otherUser.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/mall/chats/${chatId}/messages/`)
            const data = res.data?.data || []
            api.post(`/mall/chats/${chatId}/mark-read/`).catch(() => {})
            setMessages(prev => {
                if (prev.length !== data.length) return data
                return prev
            })
        } catch {
            // silently fail
        } finally {
            setIsLoadingHistory(false)
        }
    }

    useEffect(() => {
        setIsLoadingHistory(true)
        setInputText('')
        fetchMessages()
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [chatId])

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
    }

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Only image files are supported')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File must be under 10MB')
            return
        }
        const url = URL.createObjectURL(file)
        setAttachmentPreview({ file, url })
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFileSelect(file)
        e.target.value = ''
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (!items) return
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                e.preventDefault()
                const file = item.getAsFile()
                if (file) handleFileSelect(file)
                return
            }
        }
    }

    const clearAttachment = () => {
        if (attachmentPreview) {
            URL.revokeObjectURL(attachmentPreview.url)
            setAttachmentPreview(null)
        }
    }

    const handleSendAttachment = async () => {
        if (!attachmentPreview || isUploading) return
        setIsUploading(true)
        try {
            const uploaded = await uploadImage(attachmentPreview.file, 'generic')
            const imageUrl = uploaded.url || uploaded.path

            const optimisticMsg = {
                id: `temp-${Date.now()}`,
                sender: {
                    id: user?.id || '',
                    full_name: user?.full_name || '',
                    profile_picture: user?.profile_picture || null,
                },
                content: imageUrl,
                message_type: 'image',
                created_at: new Date().toISOString(),
            }
            setMessages(prev => [...prev, optimisticMsg])
            clearAttachment()
            isNearBottomRef.current = true

            await api.post(`/mall/chats/${chatId}/send/`, { content: imageUrl, message_type: 'image' })
            fetchMessages()
        } catch {
            toast.error('Failed to send image')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSend = async () => {
        if (attachmentPreview) {
            handleSendAttachment()
            return
        }
        const text = inputText.trim()
        if (!text) return

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
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
        isNearBottomRef.current = true

        try {
            await api.post(`/mall/chats/${chatId}/send/`, { content: text })
            fetchMessages()
        } catch {
            toast.error('Failed to send message')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="shrink-0 bg-white border-b border-gray-100 px-3 sm:px-5 flex items-center gap-3 h-[64px] z-10">
                <button
                    onClick={onBack}
                    className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors -ml-1"
                    aria-label="Back to messages"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-gray-100">
                    {otherUser.profile_picture ? (
                        <Image src={absoluteMediaUrl(otherUser.profile_picture)} alt={otherUser.name} width={40} height={40} unoptimized className="object-cover w-full h-full" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#4C3B8A] to-[#6B5AAE] text-white flex items-center justify-center font-bold text-xs">
                            {initials}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-gray-900 truncate">
                            {otherUser.name}
                        </h3>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate leading-none mt-0.5">Mall Store</p>
                </div>
            </div>

            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-5 py-4 bg-[#F8F8FA]"
                style={{ minHeight: 0 }}
            >
                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-8 h-8 border-[3px] border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 text-xs font-medium">Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                            <Send className="w-6 h-6 text-gray-300 -rotate-45" />
                        </div>
                        <p className="text-gray-500 text-sm font-semibold mb-1">Start the conversation</p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            Send a message to {otherUser.name} about their products.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {messages.map((msg, idx) => {
                            const isMe = String(msg.sender?.id) === String(user?.id)
                            const showAvatar = !isMe && (idx === 0 || String(messages[idx - 1]?.sender?.id) !== String(msg.sender?.id))
                            const showDateSeparator = idx === 0 || !isSameDay(new Date(msg.created_at), new Date(messages[idx - 1].created_at))

                            return (
                                <React.Fragment key={msg.id}>
                                    {showDateSeparator && (
                                        <div className="flex items-center justify-center my-4">
                                            <span className="text-[11px] text-gray-400 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm font-medium">
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
                        <div ref={messagesEndRef} className="h-1" />
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="shrink-0 bg-white border-t border-gray-100 px-3 sm:px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                />

                {attachmentPreview && (
                    <div className="mb-2 relative inline-block">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <Image src={attachmentPreview.url} alt="Attachment" width={96} height={96} unoptimized className="object-cover w-full h-full" />
                        </div>
                        <button
                            onClick={clearAttachment}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-end gap-2.5">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 rounded-xl shrink-0 hover:bg-gray-100 hover:text-[#4C3B8A] active:bg-gray-200 transition-colors"
                        title="Attach image"
                    >
                        <Paperclip className="w-[18px] h-[18px]" />
                    </button>

                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={inputText}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            placeholder={attachmentPreview ? 'Add a caption...' : 'Type a message...'}
                            rows={1}
                            className="w-full bg-gray-50 rounded-2xl px-4 py-2.5 text-sm resize-none outline-none border border-gray-200 focus:border-[#4C3B8A]/40 focus:ring-2 focus:ring-[#4C3B8A]/10 focus:bg-white max-h-[120px] placeholder:text-gray-400 transition-all"
                            style={{ minHeight: '42px' }}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim() && !attachmentPreview}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                            inputText.trim() || attachmentPreview
                                ? 'bg-[#4C3B8A] text-white hover:bg-[#3D2F6E] shadow-md shadow-[#4C3B8A]/20 active:scale-95'
                                : 'bg-gray-100 text-gray-300'
                        }`}
                        aria-label="Send message"
                    >
                        {isUploading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Send className="w-[18px] h-[18px]" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
