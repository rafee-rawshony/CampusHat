'use client'

/**
 * My Reviews (Daraz-style).
 *
 * Lists every review the user has written across the Mall, with the
 * product image, rating stars, comment, and seller's reply (if any).
 * Each review can be edited or deleted.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Star, Edit2, Trash2, Loader2, Package, MessageSquare } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    listMyReviews, updateMyReview, deleteMyReview,
    type MyReview,
} from '@/services/reviews.service'
import { absoluteMediaUrl } from '@/services/upload.service'

// Render the 5-star row.
function StarRow({ value, size = 'md', editable, onChange }: {
    value: number
    size?: 'sm' | 'md'
    editable?: boolean
    onChange?: (v: number) => void
}) {
    const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => {
                const filled = i <= value
                const StarIcon = (
                    <Star className={`${px} ${filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                )
                if (editable) {
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onChange?.(i)}
                            className="focus:outline-none focus:ring-2 focus:ring-brand-primary/30 rounded"
                        >
                            {StarIcon}
                        </button>
                    )
                }
                return <span key={i}>{StarIcon}</span>
            })}
        </div>
    )
}

export default function MyReviewsPage() {
    const queryClient = useQueryClient()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editRating, setEditRating] = useState(0)
    const [editComment, setEditComment] = useState('')
    const [saving, setSaving] = useState(false)

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['my-reviews'],
        queryFn: listMyReviews,
        staleTime: 30_000,
    })

    const startEdit = (r: MyReview) => {
        setEditingId(r.id)
        setEditRating(r.rating)
        setEditComment(r.comment || '')
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditRating(0)
        setEditComment('')
    }

    const saveEdit = async (id: string) => {
        if (editRating < 1) {
            toast.error('Pick a star rating.')
            return
        }
        setSaving(true)
        try {
            await updateMyReview(id, { rating: editRating, comment: editComment })
            toast.success('Review updated.')
            queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
            cancelEdit()
        } catch {
            toast.error('Failed to update review.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this review? This cannot be undone.')) return
        try {
            await deleteMyReview(id)
            toast.success('Review deleted.')
            queryClient.invalidateQueries({ queryKey: ['my-reviews'] })
        } catch {
            toast.error('Failed to delete review.')
        }
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 sm:px-6 md:px-8 py-5">
                <h1 className="text-xl font-bold text-gray-900">My Reviews</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    All the reviews you&apos;ve written for products.
                </p>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
            )}

            {/* Empty */}
            {!isLoading && reviews.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-amber-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No reviews yet</h3>
                    <p className="text-sm text-gray-500 mb-5">
                        Buy a product and leave a review to see it here.
                    </p>
                    <Link href="/account/orders">
                        <Button variant="outline">View My Orders</Button>
                    </Link>
                </div>
            )}

            {/* List */}
            {!isLoading && reviews.length > 0 && (
                <div className="space-y-4">
                    {reviews.map((r) => {
                        const isEditing = editingId === r.id
                        const productImg = absoluteMediaUrl(r.product_image_url || '')
                        return (
                            <div
                                key={r.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                {/* Header row — store + date */}
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-sm font-semibold text-gray-700 truncate">
                                        {r.store_name || 'Store'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(r.created_at).toLocaleDateString('en-GB', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                    </span>
                                </div>

                                {/* Product + review body */}
                                <div className="p-5 flex gap-4">
                                    <Link
                                        href={`/products/${r.product_slug}`}
                                        className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 hover:ring-2 hover:ring-brand-primary/40 transition-all"
                                    >
                                        {productImg ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={productImg} alt={r.product_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="h-7 w-7 text-gray-300" />
                                        )}
                                    </Link>

                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/products/${r.product_slug}`}
                                            className="block text-sm font-bold text-gray-900 hover:text-brand-primary transition-colors truncate"
                                        >
                                            {r.product_name}
                                        </Link>

                                        {/* Rating + comment — edit mode swaps to inputs */}
                                        {isEditing ? (
                                            <div className="mt-2 space-y-3">
                                                <StarRow value={editRating} editable onChange={setEditRating} />
                                                <Textarea
                                                    value={editComment}
                                                    onChange={(e) => setEditComment(e.target.value)}
                                                    rows={3}
                                                    placeholder="Update your review..."
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="bg-brand-primary hover:bg-brand-dark"
                                                        disabled={saving}
                                                        onClick={() => saveEdit(r.id)}
                                                    >
                                                        {saving ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={saving}
                                                        onClick={cancelEdit}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mt-1.5">
                                                    <StarRow value={r.rating} size="sm" />
                                                </div>
                                                {r.comment && (
                                                    <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                                                        {r.comment}
                                                    </p>
                                                )}
                                                {/* Seller response */}
                                                {r.seller_response && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            Seller&apos;s Reply
                                                        </p>
                                                        <p className="text-xs text-gray-600 leading-relaxed">
                                                            {r.seller_response}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Footer actions */}
                                {!isEditing && (
                                    <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex justify-end gap-3">
                                        <button
                                            onClick={() => startEdit(r)}
                                            className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-brand-primary flex items-center gap-1 px-3 py-1.5"
                                        >
                                            <Edit2 className="h-3 w-3" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-red-600 flex items-center gap-1 px-3 py-1.5"
                                        >
                                            <Trash2 className="h-3 w-3" /> Delete
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
