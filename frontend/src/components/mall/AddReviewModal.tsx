'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Star, Link as LinkIcon, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface AddReviewModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    productId: string
    productName: string
    productSlug: string
}

export function AddReviewModal({ isOpen, onOpenChange, productId, productName, productSlug }: AddReviewModalProps) {
    const queryClient = useQueryClient()
    
    // Form state
    const [rating, setRating] = useState<number>(0)
    const [hoverRating, setHoverRating] = useState<number>(0)
    const [comment, setComment] = useState('')
    const [imageUrls, setImageUrls] = useState<string[]>([])
    
    // UI state
    const [showImageInput, setShowImageInput] = useState(false)
    const [tempImageUrl, setTempImageUrl] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({})

    const RATING_LABELS: Record<number, string> = {
        1: "Poor",
        2: "Fair",
        3: "Good",
        4: "Very Good",
        5: "Excellent"
    }

    const resetForm = () => {
        setRating(0)
        setHoverRating(0)
        setComment('')
        setImageUrls([])
        setShowImageInput(false)
        setTempImageUrl('')
        setErrors({})
    }

    const handleClose = () => {
        resetForm()
        onOpenChange(false)
    }

    const handleAddImage = () => {
        if (!tempImageUrl.trim()) return
        if (imageUrls.length >= 3) {
            toast.error("Maximum 3 images allowed")
            return
        }
        
        try {
            new URL(tempImageUrl) // simple validation
            setImageUrls(prev => [...prev, tempImageUrl])
            setTempImageUrl('')
            setShowImageInput(false)
        } catch {
            toast.error("Please enter a valid image URL")
        }
    }

    const handleRemoveImage = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        // Validation
        const newErrors: { rating?: string; comment?: string } = {}
        if (rating === 0) newErrors.rating = "Please select a star rating."
        if (comment.length < 20) newErrors.comment = "Review must be at least 20 characters long."
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setIsSubmitting(true)
        setErrors({})

        try {
            await api.post(`/mall/products/${productSlug}/reviews/create/`, {
                rating,
                comment,
                evidence_urls: imageUrls
            })
            
            toast.success("Review submitted successfully!")
            
            // Invalidate queries to refresh the product and its reviews
            queryClient.invalidateQueries({ queryKey: ['product', productSlug] })
            queryClient.invalidateQueries({ queryKey: ['product-reviews', productSlug] })
            
            handleClose()
        } catch (error: any) {
            console.error('Review submit error', error)
            const msg = error.response?.data?.detail || error.response?.data?.message || "Failed to submit review. You can only review products you have purchased."
            toast.error(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose()
        }}>
            <DialogContent className="sm:max-w-md p-6 overflow-hidden bg-white">
                <DialogHeader className="mb-4">
                    <DialogTitle className="font-bold text-2xl text-gray-900">Write a Review</DialogTitle>
                    <DialogDescription className="text-gray-500 truncate max-w-[85%] inline-block">
                        {productName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Star Selector */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                >
                                    <Star 
                                        className={cn(
                                            "w-10 h-10 transition-colors duration-200",
                                            (hoverRating || rating) >= star 
                                                ? "fill-[#FBBF24] text-[#FBBF24]" 
                                                : "fill-gray-100 text-gray-200"
                                        )} 
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="h-5 mt-2">
                            {(hoverRating || rating) > 0 && (
                                <span className="text-sm font-semibold text-[#FBBF24] uppercase tracking-wider">
                                    {RATING_LABELS[hoverRating || rating]}
                                </span>
                            )}
                        </div>
                        {errors.rating && <p className="text-red-500 text-xs font-medium mt-1">{errors.rating}</p>}
                    </div>

                    {/* Comment Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Your Review</label>
                        <div className="relative">
                            <textarea
                                value={comment}
                                onChange={(e) => {
                                    if (e.target.value.length <= 500) setComment(e.target.value)
                                }}
                                rows={4}
                                className={cn(
                                    "w-full resize-none rounded-xl border bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30 focus:border-[#4C3B8A] transition-all",
                                    errors.comment ? "border-red-300 ring-4 ring-red-50" : "border-gray-200"
                                )}
                                placeholder="Share your experience, what you loved or what could be improved..."
                            />
                            <div className="absolute bottom-2 right-3 text-xs text-gray-400 font-medium">
                                {comment.length}/500
                            </div>
                        </div>
                        {errors.comment && <p className="text-red-500 text-xs font-medium">{errors.comment}</p>}
                    </div>

                    {/* Image Attachments */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-800 flex justify-between items-center">
                            <span>Add Photos <span className="font-normal text-gray-400">(optional)</span></span>
                            <span className="text-xs text-gray-400">{imageUrls.length}/3</span>
                        </label>
                        
                        <div className="flex flex-wrap gap-2">
                            {imageUrls.map((url, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt={`Review photo ${i+1}`} className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveImage(i)}
                                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            
                            {imageUrls.length < 3 && !showImageInput && (
                                <button
                                    type="button"
                                    onClick={() => setShowImageInput(true)}
                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-[#4C3B8A] hover:border-[#4C3B8A] hover:bg-gray-50 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {showImageInput && (
                            <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-2">
                                <div className="relative flex-1">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="url"
                                        value={tempImageUrl}
                                        onChange={(e) => setTempImageUrl(e.target.value)}
                                        placeholder="Paste image URL here..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#4C3B8A]"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                                        autoFocus
                                    />
                                </div>
                                <Button type="button" onClick={handleAddImage} className="bg-gray-900 hover:bg-gray-800 text-white" size="sm">Add</Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setShowImageInput(false)} className="text-gray-500 shrink-0">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-8">
                    <Button 
                        variant="outline" 
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl text-gray-600 font-semibold border-gray-200"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl bg-[#4C3B8A] hover:bg-[#34285e] text-white font-semibold flex items-center justify-center gap-2"
                    >
                        {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
