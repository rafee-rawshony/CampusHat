'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, MessageSquare, Star, User } from 'lucide-react'
import { api } from '@/lib/api'
import { StarRating } from '@/components/shared/StarRating'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/utils' // or simply format date locally if not available
import { AddReviewModal } from './AddReviewModal'
import { getInitials } from '@/lib/initials'
import { useRouter } from 'next/navigation'

interface ProductReviewsTabProps {
    productId: string
    productSlug: string
    productName: string
}

// Ensure local time mapping fallback
const formatTimeAgo = (dateStr: string) => {
    try {
        if (typeof timeAgo === 'function') return timeAgo(dateStr)
    } catch {}
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ProductReviewsTab({ productId, productSlug, productName }: ProductReviewsTabProps) {
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()
    const [page, setPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { data: reviewsData, isLoading } = useQuery({
        queryKey: ['product-reviews', productSlug, page],
        queryFn: () => api.get(`/mall/products/${productId}/reviews/`, {
            params: { ordering: '-created_at', page, page_size: 10 }
        }).then(r => r.data),
    })

    // Extract stats (we derive from list if endpoint doesn't serve aggregates natively)
    const reviewsList = reviewsData?.results || (Array.isArray(reviewsData) ? reviewsData : [])
    const totalCount = reviewsData?.count || reviewsList.length
    
    // Simulate aggregates from active list if not provided globally by API (usually provided via product model)
    // For pure UI fidelity matching prompt:
    const avgRatingObj = reviewsList.length > 0
        ? reviewsList.reduce((acc: any, r: any) => acc + (r.rating || 0), 0) / reviewsList.length
        : 0

    // Count distributions 5 to 1
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>
    reviewsList.forEach((r: any) => { if (dist[r.rating] !== undefined) dist[r.rating]++ })

    const handleWriteReviewClick = () => {
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/products/${productSlug}`)
            return
        }
        setIsModalOpen(true)
    }

    return (
        <div className="w-full">
            {/* Top Review Summary Block */}
            <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start mb-12 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
                
                {/* Left: Overall Score */}
                <div className="flex flex-col items-center justify-center min-w-[140px] shrink-0 text-center mx-auto md:mx-0">
                    <span className="text-5xl font-black text-gray-900 leading-none mb-2">
                        {Number(avgRatingObj || 0).toFixed(1)}
                    </span>
                    <StarRating rating={avgRatingObj} count={0} size="lg" />
                    <span className="text-sm text-gray-500 font-medium mt-2">{totalCount} reviews</span>
                </div>

                {/* Middle: Rating Bars */}
                <div className="flex-1 w-full flex flex-col gap-2.5 justify-center">
                    {[5, 4, 3, 2, 1].map(stars => {
                        const count = dist[stars]
                        const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0
                        return (
                            <div key={stars} className="flex items-center gap-3 w-full max-w-sm mx-auto md:mx-0">
                                <div className="text-sm font-semibold text-gray-600 w-8 flex justify-end gap-1 items-center shrink-0">
                                    {stars} <Star className="w-3.5 h-3.5 fill-gray-400 text-gray-400" />
                                </div>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    {percentage > 0 && (
                                        <div 
                                            className="h-full bg-[#FBBF24] rounded-full transition-all duration-500" 
                                            style={{ width: `${percentage}%` }} 
                                        />
                                    )}
                                </div>
                                <div className="text-sm text-gray-400 w-6 font-medium">
                                    {count}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Right: CTA */}
                <div className="shrink-0 w-full md:w-auto flex flex-col items-center md:items-end justify-center h-full">
                    <Button 
                        onClick={handleWriteReviewClick}
                        className="bg-[#4C3B8A] hover:bg-[#34285e] text-white font-semibold px-6 lg:px-8 py-6 rounded-xl w-full sm:w-auto shadow-sm"
                    >
                        Write a Review
                    </Button>
                    <p className="text-xs text-gray-400 mt-3 font-medium flex items-center justify-center gap-1.5 opacity-80">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Only verified buyers can review
                    </p>
                </div>
            </div>

            {/* Reviews Feed List */}
            <div className="space-y-6">
                {isLoading ? (
                    Array(3).fill(null).map((_, i) => (
                        <div key={i} className="animate-pulse border-b border-gray-100 pb-6">
                            <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                <div className="flex flex-col gap-2">
                                    <div className="w-32 h-4 bg-gray-200 rounded" />
                                    <div className="w-20 h-3 bg-gray-200 rounded" />
                                </div>
                            </div>
                            <div className="w-full h-16 bg-gray-200 rounded mt-4" />
                        </div>
                    ))
                ) : reviewsList.length > 0 ? (
                    reviewsList.map((review: any) => {
                        const user = review.user || {}
                        const profilePic = user.profile_picture
                        const fullName = user.full_name || 'Anonymous User'

                        return (
                            <div key={review.id} className="border-b border-gray-100 pb-8 pt-2 last:border-0 last:pb-0">
                                
                                <div className="flex items-start justify-between mb-3">
                                    {/* User Block */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                                            {profilePic ? (
                                                <Image src={profilePic} alt={fullName} width={40} height={40} className="object-cover w-full h-full" />
                                            ) : (
                                                <span className="text-sm font-bold text-gray-500">{getInitials(fullName)}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{fullName}</span>
                                            <div className="mt-0.5">
                                                <StarRating rating={review.rating} count={0} size="sm" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date & Verified Badge */}
                                    <div className="flex flex-col items-end gap-1.5">
                                        {review.is_verified_purchase && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <CheckCircle2 className="w-3 h-3 stroke-[3px]" /> Verified
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400 font-medium">{formatTimeAgo(review.created_at)}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <p className="text-sm text-gray-700 leading-relaxed max-w-4xl">
                                    {review.comment}
                                </p>

                                {/* Attachments */}
                                {review.images && review.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {review.images.map((imgUrl: string, idx: number) => (
                                            <a 
                                                key={idx} 
                                                href={imgUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-200 hover:border-brand-primary transition-colors block"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={imgUrl} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-gray-50 p-12 rounded-2xl flex flex-col items-center justify-center text-center border text-gray-500 border-gray-100 shadow-sm border-dashed">
                        <MessageSquare className="h-12 w-12 text-gray-300 mb-4 bg-white p-3 rounded-full shadow-sm" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No reviews yet</h3>
                        <p className="text-sm font-medium mb-5 max-w-sm text-gray-500">
                            Be the first to review this product and help other students make informed decisions!
                        </p>
                        <Button 
                            onClick={handleWriteReviewClick}
                            variant="outline"
                            className="bg-white border-2 border-gray-200 text-gray-700 font-semibold"
                        >
                            Write the first review
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal portal */}
            <AddReviewModal 
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                productId={productId}
                productName={productName}
                productSlug={productSlug}
            />
        </div>
    )
}
