'use client'

import React from 'react'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ChatMessage } from '@/hooks/useWebSocket'

interface OfferMessageCardProps {
    message: ChatMessage
    isMe: boolean
    isSeller: boolean
    listingId: string | number
    onAcceptOffer: (offerId: string | number) => void
    onDeclineOffer: (offerId: string | number) => void
}

export function OfferMessageCard({
    message,
    isMe,
    isSeller,
    listingId,
    onAcceptOffer,
    onDeclineOffer,
}: OfferMessageCardProps) {
    const offer = message.offer
    if (!offer) return null

    const statusConfig = {
        accepted: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, text: 'text-emerald-700', label: 'Offer Accepted' },
        rejected: { bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle className="w-4 h-4 text-red-500" />, text: 'text-red-600', label: 'Offer Declined' },
        pending: { bg: 'bg-white', border: 'border-gray-200', icon: null, text: '', label: '' },
    }

    const status = statusConfig[offer.status] || statusConfig.pending

    return (
        <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${!isMe ? 'pl-9' : ''}`}>
            <div className={`${status.bg} border ${status.border} rounded-2xl p-4 max-w-[300px] shadow-sm`}>
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4C3B8A]/10 flex items-center justify-center">
                        <Banknote className="w-4 h-4 text-[#4C3B8A]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                        {isMe ? 'You made an Offer' : 'Received an Offer'}
                    </span>
                </div>

                {/* Price */}
                <p className="text-2xl font-bold text-[#4C3B8A] mb-1">
                    ৳{Number(offer.amount).toLocaleString()}
                </p>

                {/* Message */}
                {offer.message && (
                    <p className="text-sm text-gray-500 italic mb-3 leading-relaxed">&quot;{offer.message}&quot;</p>
                )}

                <div className="border-t border-gray-100 pt-3 mt-2">
                    {offer.status === 'pending' && isSeller && !isMe && (
                        <div className="flex gap-2">
                            <Button
                                onClick={() => onDeclineOffer(offer.id)}
                                variant="outline"
                                className="flex-1 border-red-200 text-red-500 text-sm py-1.5 px-4 rounded-xl hover:bg-red-50 h-9"
                            >
                                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                Decline
                            </Button>
                            <Button
                                onClick={() => onAcceptOffer(offer.id)}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm py-1.5 px-4 rounded-xl h-9 shadow-sm"
                            >
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                Accept
                            </Button>
                        </div>
                    )}

                    {offer.status === 'pending' && (isMe || !isSeller) && (
                        <p className="text-xs text-gray-400 italic text-center py-1">
                            Waiting for response...
                        </p>
                    )}

                    {offer.status !== 'pending' && (
                        <div className="flex items-center gap-2 justify-center py-1">
                            {status.icon}
                            <span className={`font-semibold text-sm ${status.text}`}>{status.label}</span>
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                <p className="text-[10px] text-gray-400 text-right mt-2 tabular-nums">
                    {format(new Date(message.created_at), 'h:mm a')}
                </p>
            </div>
        </div>
    )
}
