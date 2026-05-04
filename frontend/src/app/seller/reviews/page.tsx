'use client'

/**
 * Seller Reviews — Daraz-style.
 *
 * Lists every review left on this seller's products. The seller can read
 * the comment, see the rating, and reply inline. Filters: rating tabs +
 * "needs reply" toggle.
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Star, Loader2, Package, MessageSquare, Send, X, CheckCircle2, Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { absoluteMediaUrl } from '@/services/upload.service'
import { getInitials } from '@/lib/utils'

interface SellerReview {
    id: string
    product_id: string
    product_slug: string
    product_name: string
    product_image_url: string | null
    reviewer_name: string
    reviewer_avatar?: string | null
    rating: number
    comment: string
    seller_response: string | null
    seller_responded_at: string | null
    is_visible: boolean
    created_at: string
}

// 5-star inline display.
function StarRow({ value }: { value: number }) {
    return (
        <div className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                        i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                    }`}
                />
            ))}
        </div>
    )
}

export default function SellerReviewsPage() {
    const queryClient = useQueryClient()
    const [ratingFilter, setRatingFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')
    const [needsReplyOnly, setNeedsReplyOnly] = useState(false)
    const [replyingId, setReplyingId] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')

    // Build the params for the backend filter.
    const queryParams = useMemo(() => {
        const p: Record<string, string> = {}
        if (ratingFilter !== 'all') p.rating = ratingFilter
        if (needsReplyOnly) p.has_reply = 'false'
        return p
    }, [ratingFilter, needsReplyOnly])

    const { data: reviews = [], isLoading } = useQuery<SellerReview[]>({
        queryKey: ['seller-reviews', queryParams],
        queryFn: () =>
            api.get('/seller/reviews/', { params: queryParams })
                .then((r) => r.data?.data || []),
    })

    const replyMutation = useMutation({
        mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
            const { data } = await api.post(`/seller/reviews/${reviewId}/reply/`, { reply })
            return data
        },
        onSuccess: () => {
            toast.success('Reply posted.')
            queryClient.invalidateQueries({ queryKey: ['seller-reviews'] })
            setReplyingId(null)
            setReplyText('')
        },
        onError: (err: unknown) => {
            const e = err as { response?: { data?: { message?: string } } }
            toast.error(e.response?.data?.message || 'Failed to post reply.')
        },
    })

    const startReply = (r: SellerReview) => {
        setReplyingId(r.id)
        setReplyText(r.seller_response || '')
    }

    const submitReply = () => {
        if (!replyingId || !replyText.trim()) {
            toast.error('Reply cannot be empty.')
            return
        }
        replyMutation.mutate({ reviewId: replyingId, reply: replyText.trim() })
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-bold text-2xl text-gray-900">Customer Reviews</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Read what customers say about your products and reply to feedback.
                </p>
            </div>

            {/* Filter bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Rating:</span>
                </div>
                {(['all', '5', '4', '3', '2', '1'] as const).map((r) => (
                    <button
                        key={r}
                        onClick={() => setRatingFilter(r)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            ratingFilter === r
                                ? 'bg-brand-primary text-white border border-brand-primary'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-primary'
                        }`}
                    >
                        {r === 'all' ? 'All' : `${r} ★`}
                    </button>
                ))}

                <div className="ml-auto flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={needsReplyOnly}
                            onChange={(e) => setNeedsReplyOnly(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        Needs reply only
                    </label>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-amber-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No reviews here</h3>
                    <p className="text-sm text-gray-500">
                        {needsReplyOnly || ratingFilter !== 'all'
                            ? 'Try adjusting the filters.'
                            : "When customers leave reviews, you'll see them here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reviews.map((r) => {
                        const isEditing = replyingId === r.id
                        const productImg = absoluteMediaUrl(r.product_image_url || '')
                        const reviewerImg = absoluteMediaUrl(r.reviewer_avatar || '')
                        const hasReply = !!r.seller_response

                        return (
                            <div
                                key={r.id}
                                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                            >
                                {/* Header: product + date */}
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                                    <Link
                                        href={`/products/${r.product_slug}`}
                                        className="flex items-center gap-3 group"
                                        target="_blank"
                                    >
                                        <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                            {productImg ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={productImg} alt={r.product_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="h-4 w-4 text-gray-300" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-brand-primary truncate max-w-[280px]">
                                            {r.product_name}
                                        </span>
                                    </Link>
                                    <span className="text-xs text-gray-400">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Body: reviewer + rating + comment */}
                                <div className="p-5">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 shrink-0">
                                            {reviewerImg ? (
                                                <AvatarImage src={reviewerImg} alt={r.reviewer_name} />
                                            ) : (
                                                <AvatarFallback className="bg-brand-light text-brand-primary text-xs font-bold">
                                                    {getInitials(r.reviewer_name)}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-gray-900">{r.reviewer_name}</p>
                                                <StarRow value={r.rating} />
                                            </div>
                                            {r.comment && (
                                                <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                                                    {r.comment}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Existing reply or reply form */}
                                    {hasReply && !isEditing && (
                                        <div className="mt-4 ml-12 p-3 bg-gray-50 border-l-4 border-brand-primary rounded">
                                            <p className="text-xs font-bold text-brand-primary flex items-center gap-1.5 mb-1">
                                                <MessageSquare className="h-3 w-3" />
                                                Your Reply
                                                {r.seller_responded_at && (
                                                    <span className="text-[10px] text-gray-500 font-normal ml-2">
                                                        {new Date(r.seller_responded_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{r.seller_response}</p>
                                        </div>
                                    )}

                                    {isEditing && (
                                        <div className="mt-4 ml-12 space-y-2">
                                            <Textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                rows={3}
                                                placeholder="Thanks for your review!"
                                                className="resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={submitReply}
                                                    size="sm"
                                                    className="bg-brand-primary hover:bg-brand-dark"
                                                    disabled={replyMutation.isPending}
                                                >
                                                    <Send className="h-3 w-3 mr-1.5" />
                                                    {replyMutation.isPending ? 'Posting...' : 'Post Reply'}
                                                </Button>
                                                <Button
                                                    onClick={() => { setReplyingId(null); setReplyText('') }}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <X className="h-3 w-3 mr-1.5" /> Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer actions */}
                                {!isEditing && (
                                    <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-end gap-3">
                                        {hasReply ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-emerald-600 mr-auto">
                                                <CheckCircle2 className="h-3 w-3" /> Replied
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-amber-600 mr-auto">
                                                Awaiting reply
                                            </span>
                                        )}
                                        <button
                                            onClick={() => startReply(r)}
                                            className="text-xs font-bold uppercase tracking-wide text-brand-primary hover:underline flex items-center gap-1"
                                        >
                                            <MessageSquare className="h-3 w-3" />
                                            {hasReply ? 'Edit Reply' : 'Reply'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
