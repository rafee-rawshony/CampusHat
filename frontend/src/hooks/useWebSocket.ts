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
    message_type: 'text' | 'image' | 'offer'
    offer?: {
        id: string | number
        amount: string
        message?: string
        status: 'pending' | 'accepted' | 'rejected'
    }
    created_at: string
}

export default function useWebSocket(chatId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const reconnectAttemptsRef = useRef(0)
    const maxReconnectAttempts = 5
    const { accessToken } = useAuthStore()

    const connect = useCallback(() => {
        if (!chatId || !accessToken) return

        const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
        const wsUrl = `${wsBase}/ws/chat/${chatId}/?token=${accessToken}`

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
                    if (data.type === 'message' || data.type === 'chat_message') {
                        const newMsg: ChatMessage = data.message || data
                        setMessages(prev => {
                            // Deduplicate by id
                            if (prev.some(m => m.id === newMsg.id)) return prev
                            return [...prev, newMsg]
                        })
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

                // Attempt reconnect with exponential backoff
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
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }
        }
    }, [connect])

    const sendMessage = useCallback((content: string, messageType = 'text') => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'message',
                content,
                message_type: messageType,
            }))
        } else {
            // Fallback: REST API if WebSocket not connected
            api.post(`/marketplace/chats/${chatId}/messages/`, {
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
            }).catch(() => {
                // Silent fail — message will be retried or user can resend
            })
        }
    }, [chatId])

    return { messages, setMessages, isConnected, sendMessage }
}
