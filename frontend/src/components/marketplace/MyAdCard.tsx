import React from 'react'
import Image from 'next/image'
import { EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { AdStatusBadge, AdStatus } from './AdStatusBadge'
import { absoluteMediaUrl } from '@/services/upload.service'

interface MyAdCardProps {
    ad: {
        id: string | number
        title: string
        price: string | number
        post_type: string
        status: AdStatus
        images?: Array<{ image?: string; image_url?: string } | string>
        expires_at: string
        created_at?: string
        rejection_reason?: string
        is_hidden_by_admin?: boolean
    }
    actions: React.ReactNode
}

export function MyAdCard({ ad, actions }: MyAdCardProps) {
    const imageCandidate =
        ad.images && ad.images.length > 0
            ? typeof ad.images[0] === 'string'
                ? ad.images[0]
                : ad.images[0].image_url || ad.images[0].image || null
            : null
    const imageUrl = absoluteMediaUrl(imageCandidate)
    const hasImage = !!imageUrl
    
    // Safety check for created_at, fallback to expires - duration roughly
    const postedDate = ad.created_at ? new Date(ad.created_at) : new Date(new Date(ad.expires_at).getTime() - 86400000 * 15)

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col sm:hidden">
            {/* Top Row */}
            <div className="flex gap-3 mb-3">
                <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 relative flex justify-center items-center">
                    {hasImage ? (
                        <Image src={imageUrl} alt={ad.title} fill unoptimized className="object-cover" />
                    ) : (
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{ad.post_type}</span>
                    )}
                </div>
                
                <div className="flex-1 pr-14"> {/* Space for top-right absolute badge */}
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight group-hover:text-brand-primary">{ad.title}</h3>
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 mt-1 inline-block">{ad.post_type}</span>
                </div>
            </div>

            {/* Absolute Status Badge */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                <AdStatusBadge status={ad.status} rejectionReason={ad.rejection_reason} />
                {ad.is_hidden_by_admin && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Admin Hidden
                    </span>
                )}
            </div>

            {/* Middle Row */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-50">
                <span className="font-extrabold text-gray-900 text-base">
                    ৳{Number(ad.price).toLocaleString()}
                    {ad.post_type === 'rental' && <span className="text-gray-500 font-medium text-xs ml-0.5">/mo</span>}
                </span>
                <span className="text-xs text-gray-400">
                    Posted: {format(postedDate, 'MMM d, yyyy')}
                </span>
            </div>

            {/* Bottom Row - Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                {actions}
            </div>
            
            {/* Inline Rejection Reason for Mobile if needed */}
            {ad.status === 'rejected' && ad.rejection_reason && (
                <div className="mt-3 bg-red-50 p-2 rounded border border-red-100 text-xs text-red-600 font-medium w-full">
                    Reason: {ad.rejection_reason}
                </div>
            )}
        </div>
    )
}
