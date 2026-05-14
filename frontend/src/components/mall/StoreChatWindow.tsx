'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
    const [attachmentPreview, setAttachmentPreview] = useState<{ file: File; url: string } | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

        try {
            await api.post(`/mall/chats/${chatId}/send/`, { content: text })
            fetchMessages()
        } catch {
            toast.error('Failed to send message')
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

                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 rounded-xl shrink-0 hover:bg-gray-100 hover:text-[#4C3B8A] active:bg-gray-200 transition-colors"
                        title="Attach image"
                    >
                        <Paperclip className="w-[18px] h-[18px]" />
                    </button>
                    <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        onPaste={handlePaste}
                        placeholder={attachmentPreview ? 'Add a caption...' : 'Type a message...'}
                        rows={1}
                        className="flex-1 bg-gray-50 rounded-2xl px-4 py-2.5 text-sm resize-none outline-none border border-gray-200 focus:border-[#4C3B8A]/40 focus:ring-2 focus:ring-[#4C3B8A]/10 focus:bg-white max-h-[120px] placeholder:text-gray-400 transition-all"
                        style={{ minHeight: '42px' }}
                    />
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
