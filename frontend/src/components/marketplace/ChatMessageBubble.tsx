'use client'

import React from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
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
                <div className="w-6 shrink-0 self-end">
                    {showAvatar && (
                        <div className="w-6 h-6 rounded-full overflow-hidden">
                            {otherUser?.profile_picture ? (
                                <Image
                                    src={absoluteMediaUrl(otherUser.profile_picture)}
                                    alt={otherUser.full_name || 'User'}
                                    width={24}
                                    height={24}
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

            <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isTemp ? 'opacity-70' : ''}`}>
                {message.message_type === 'image' ? (
                    <div className={`rounded-2xl overflow-hidden border ${
                        isMe ? 'rounded-tr-sm border-[#4C3B8A]/20' : 'rounded-tl-sm border-gray-200'
                    }`}>
                        <Image src={absoluteMediaUrl(message.content)} alt="Shared image" width={280} height={200} unoptimized className="object-cover w-full" />
                    </div>
                ) : (
                    <div className={`px-3.5 py-2 text-[14px] leading-relaxed ${
                        isMe
                            ? 'bg-[#4C3B8A] text-white rounded-2xl rounded-tr-sm'
                            : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm'
                    }`}>
                        <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                )}

                <p className={`text-[10px] mt-0.5 px-1 ${isMe ? 'text-gray-400 text-right' : 'text-gray-400'}`}>
                    {format(new Date(message.created_at), 'h:mm a')}
                </p>
            </div>
        </div>
    )
}
