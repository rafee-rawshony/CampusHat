import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'

export interface ChatMessage {
    id: string
    sender: {
        id: string | number
        full_name: string
        profile_picture?: string | null
    }
    content: string
    message_type: 'text' | 'image' | 'offer' | 'offer_ref'
    offer?: {
        id: string | number
        amount: string
        message?: string
        status: 'pending' | 'accepted' | 'rejected'
    }
    created_at: string
}

function getWebSocketBaseUrl() {
    if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL

    if (typeof window !== 'undefined') {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
        if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
            const url = new URL(apiBase)
            url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
            return url.origin
        }
        return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    }

    return 'ws://localhost:8000'
}

export default function useWebSocket(chatId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const reconnectAttemptsRef = useRef(0)
    const maxReconnectAttempts = 5
    const { accessToken } = useAuthStore()

    const connect = useCallback(() => {
        if (!chatId || !accessToken) return

        const wsBase = getWebSocketBaseUrl()
        const wsUrl = `${wsBase}/ws/marketplace/chat/${chatId}/?token=${accessToken}`

        try {
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                setIsConnected(true)
                reconnectAttemptsRef.current = 0
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)

                    if (data.type === 'chat.message') {
                        const newMsg: ChatMessage = data.data
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev
                            const tempIdx = prev.findIndex(
                                m => m.id.startsWith('temp-') && m.content === newMsg.content
                            )
                            if (tempIdx !== -1) {
                                const updated = [...prev]
                                updated[tempIdx] = newMsg
                                return updated
                            }
                            return [...prev, newMsg]
                        })
                    } else if (data.type === 'chat.typing') {
                        setIsTyping(true)
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
                    } else if (data.type === 'chat.read_receipt') {
                        setMessages(prev =>
                            prev.map(m => ({ ...m, is_read: true }))
                        )
                    }
                } catch {
                    // Ignore malformed messages
                }
            }

            ws.onerror = () => {
                setIsConnected(false)
            }

            ws.onclose = () => {
                setIsConnected(false)
                wsRef.current = null

                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
                    reconnectAttemptsRef.current++
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect()
                    }, delay)
                }
            }
        } catch {
            setIsConnected(false)
        }
    }, [chatId, accessToken])

    useEffect(() => {
        connect()

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }
        }
    }, [connect])

    const sendMessage = useCallback(async (content: string, messageType = 'text') => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'chat.message',
                content,
                message_type: messageType,
            }))
            return true
        } else {
            // Fallback: REST API if WebSocket not connected
            return api.post(`/marketplace/chats/${chatId}/send/`, {
                content,
                message_type: messageType,
            }).then(res => {
                const msg = res.data?.data || res.data
                if (msg) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev
                        return [...prev, msg]
                    })
                }
                return true
            }).catch(() => false)
        }
    }, [chatId])

    const sendTyping = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'chat.typing' }))
        }
    }, [])

    const markRead = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'chat.mark_read' }))
        } else {
            api.post(`/marketplace/chats/${chatId}/mark-read/`).catch(() => {})
        }
    }, [chatId])

    return { messages, setMessages, isConnected, isTyping, sendMessage, sendTyping, markRead }
}
