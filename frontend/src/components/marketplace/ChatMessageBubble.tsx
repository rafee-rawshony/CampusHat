'use client'

import React from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Check, CheckCheck } from 'lucide-react'
import { absoluteMediaUrl } from '@/services/upload.service'
import type { ChatMessage } from '@/hooks/useWebSocket'

interface ChatMessageBubbleProps {
    message: ChatMessage
    isMe: boolean
    showAvatar: boolean
    otherUser?: {
        full_name: string
        profile_picture?: string | null
    }
}

export function ChatMessageBubble({ message, isMe, showAvatar, otherUser }: ChatMessageBubbleProps) {
    const initials = otherUser?.full_name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'

    const isTemp = typeof message.id === 'string' && message.id.startsWith('temp-')

    return (
        <div className={`flex w-full gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {!isMe && (
                <div className="w-7 shrink-0 self-end">
                    {showAvatar && (
                        <div className="w-7 h-7 rounded-full overflow-hidden shadow-sm">
                            {otherUser?.profile_picture ? (
                                <Image
                                    src={absoluteMediaUrl(otherUser.profile_picture)}
                                    alt={otherUser.full_name || 'User'}
                                    width={28}
                                    height={28}
                                    unoptimized
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#4C3B8A] to-[#6B5AAE] text-white flex items-center justify-center">
                                    <span className="text-[9px] font-bold">{initials}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isTemp ? 'opacity-60' : ''}`}>
                {message.message_type === 'image' ? (
                    <div className={`rounded-2xl overflow-hidden border shadow-sm ${
                        isMe ? 'rounded-br-md border-[#4C3B8A]/20' : 'rounded-bl-md border-gray-200'
                    }`}>
                        <Image src={absoluteMediaUrl(message.content)} alt="Shared image" width={280} height={200} unoptimized className="object-cover w-full" />
                    </div>
                ) : (
                    <div className={`px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                        isMe
                            ? 'bg-[#4C3B8A] text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100'
                    }`}>
                        <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                )}

                <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                        {format(new Date(message.created_at), 'h:mm a')}
                    </span>
                    {isMe && !isTemp && (
                        <CheckCheck className="w-3.5 h-3.5 text-[#4C3B8A]/50" />
                    )}
                    {isMe && isTemp && (
                        <Check className="w-3 h-3 text-gray-300" />
                    )}
                </div>
            </div>
        </div>
    )
}
