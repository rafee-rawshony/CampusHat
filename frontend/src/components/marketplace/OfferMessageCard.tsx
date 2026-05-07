'use client'

import React from 'react'
import Image from 'next/image'
import { format, isToday, isYesterday, differenceInMinutes, differenceInHours } from 'date-fns'
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

    return (
        <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-[280px] shadow-sm">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <Banknote className="w-4 h-4 text-[#4C3B8A]" />
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
                    <p className="text-sm text-gray-500 italic mb-3">&quot;{offer.message}&quot;</p>
                )}

                <div className="border-t border-gray-100 pt-3 mt-2">
                    {offer.status === 'pending' && isSeller && !isMe && (
                        <div className="flex gap-2">
                            <Button
                                onClick={() => onDeclineOffer(offer.id)}
                                variant="outline"
                                className="flex-1 border-red-300 text-red-500 text-sm py-1.5 px-4 rounded-lg hover:bg-red-50 h-9"
                            >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Decline
                            </Button>
                            <Button
                                onClick={() => onAcceptOffer(offer.id)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-1.5 px-4 rounded-lg h-9"
                            >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Accept
                            </Button>
                        </div>
                    )}

                    {offer.status === 'pending' && isMe && (
                        <p className="text-sm text-gray-400 italic text-center">
                            Waiting for seller response...
                        </p>
                    )}

                    {offer.status === 'accepted' && (
                        <div className="flex items-center gap-1.5 justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-semibold text-sm">Offer Accepted</span>
                        </div>
                    )}

                    {offer.status === 'rejected' && (
                        <div className="flex items-center gap-1.5 justify-center">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-500 text-sm">Offer Declined</span>
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                <p className="text-[10px] text-gray-400 text-right mt-2">
                    {format(new Date(message.created_at), 'h:mm a')}
                </p>
            </div>
        </div>
    )
}
