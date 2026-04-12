'use client'

import React from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
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

    return (
        <div className={`flex w-full gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar for other person */}
            {!isMe && (
                <div className="w-6 shrink-0 self-end">
                    {showAvatar && (
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-[#4C3B8A] flex items-center justify-center">
                            {otherUser?.profile_picture ? (
                                <Image
                                    src={otherUser.profile_picture}
                                    alt={otherUser.full_name || 'User'}
                                    width={24}
                                    height={24}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <span className="text-[9px] text-white font-bold">{initials}</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col max-w-[70%]">
                {/* Bubble */}
                {message.message_type === 'image' ? (
                    <div
                        className={`rounded-2xl overflow-hidden border ${
                            isMe
                                ? 'rounded-tr-sm border-[#4C3B8A]/20'
                                : 'rounded-tl-sm border-gray-200'
                        }`}
                    >
                        <Image
                            src={message.content}
                            alt="Shared image"
                            width={280}
                            height={200}
                            className="object-cover w-full"
                        />
                    </div>
                ) : (
                    <div
                        className={`px-4 py-2.5 text-[15px] leading-relaxed ${
                            isMe
                                ? 'bg-[#4C3B8A] text-white rounded-2xl rounded-tr-sm'
                                : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'
                        }`}
                    >
                        <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                )}

                {/* Timestamp */}
                <p
                    className={`text-[10px] mt-1 ${
                        isMe ? 'text-[#4C3B8A]/60 text-right' : 'text-gray-400'
                    }`}
                >
                    {format(new Date(message.created_at), 'h:mm a')}
                </p>
            </div>
        </div>
    )
}
