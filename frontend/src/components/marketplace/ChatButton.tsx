'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface ChatButtonProps {
    listingId: string | number
    className?: string
    variant?: React.ComponentProps<typeof Button>['variant']
    children?: React.ReactNode
}

export function ChatButton({
    listingId,
    className,
    variant,
    children = 'Send Message',
}: ChatButtonProps) {
    const router = useRouter()
    const [isStarting, setIsStarting] = useState(false)

    const handleStartChat = async () => {
        if (isStarting) return
        setIsStarting(true)
        try {
            const res = await api.post('/marketplace/chats/start/', { product_id: listingId })
            const chatData = res.data?.data || res.data
            const chatId = chatData?.id || chatData?.chat_id
            if (!chatId) throw new Error('Missing chat id')
            router.push(`/marketplace/chat/${chatId}`)
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Unable to start chat right now.'
            toast.error(message)
        } finally {
            setIsStarting(false)
        }
    }

    return (
        <Button
            type="button"
            variant={variant}
            onClick={handleStartChat}
            disabled={isStarting}
            className={cn('gap-2', className)}
        >
            {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
            {children}
        </Button>
    )
}
