import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'

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

export function useMarketplaceChatInbox(enabled = true) {
    const queryClient = useQueryClient()
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const attemptsRef = useRef(0)
    const { accessToken } = useAuthStore()

    useEffect(() => {
        if (!enabled || !accessToken) return

        let closedByEffect = false

        const connect = () => {
            const wsBase = getWebSocketBaseUrl()
            const ws = new WebSocket(`${wsBase}/ws/marketplace/chats/?token=${accessToken}`)
            wsRef.current = ws

            ws.onopen = () => {
                attemptsRef.current = 0
            }

            ws.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data)
                    if (payload.type === 'chat.thread_update') {
                        queryClient.invalidateQueries({ queryKey: ['chat-threads'] })
                        queryClient.invalidateQueries({ queryKey: ['marketplace-chats'] })
                        if (payload.data?.chat_id) {
                            queryClient.invalidateQueries({ queryKey: ['chat-detail', payload.data.chat_id] })
                        }
                    }
                } catch {
                    // Ignore malformed socket messages.
                }
            }

            ws.onclose = () => {
                wsRef.current = null
                if (closedByEffect || attemptsRef.current >= 5) return
                const delay = Math.min(1000 * Math.pow(2, attemptsRef.current), 30000)
                attemptsRef.current += 1
                reconnectRef.current = setTimeout(connect, delay)
            }
        }

        connect()

        return () => {
            closedByEffect = true
            if (reconnectRef.current) clearTimeout(reconnectRef.current)
            wsRef.current?.close()
            wsRef.current = null
        }
    }, [accessToken, enabled, queryClient])
}
