'use client'

import React, { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Star, ImageIcon, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { uploadImage } from '@/services/upload.service'
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

interface UploadedImage {
    url: string
    previewUrl: string  // local object URL for instant preview
    uploading: boolean
    progress: number
}

const MAX_IMAGES = 3
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const RATING_LABELS: Record<number, string> = {
    1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent'
}

export function AddReviewModal({ isOpen, onOpenChange, productId, productName, productSlug }: AddReviewModalProps) {
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const [images, setImages] = useState<UploadedImage[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({})

    const resetForm = () => {
        setRating(0)
        setHoverRating(0)
        setComment('')
        // Revoke object URLs to free memory
        images.forEach(img => URL.revokeObjectURL(img.previewUrl))
        setImages([])
        setErrors({})
    }

    const handleClose = () => {
        resetForm()
        onOpenChange(false)
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        // Reset input so same file can be re-selected
        e.target.value = ''

        const slots = MAX_IMAGES - images.length
        if (slots <= 0) {
            toast.error(`Maximum ${MAX_IMAGES} photos allowed`)
            return
        }

        const toUpload = files.slice(0, slots)

        for (const file of toUpload) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                toast.error(`${file.name}: Only JPG, PNG, or WebP allowed`)
                continue
            }
            if (file.size > MAX_BYTES) {
                toast.error(`${file.name}: Must be under 5 MB`)
                continue
            }

            const previewUrl = URL.createObjectURL(file)
            // Add a placeholder entry immediately for instant preview
            const placeholder: UploadedImage = { url: '', previewUrl, uploading: true, progress: 0 }
            setImages(prev => [...prev, placeholder])

            try {
                const result = await uploadImage(file, 'review', (progress) => {
                    setImages(prev =>
                        prev.map(img => img.previewUrl === previewUrl ? { ...img, progress } : img)
                    )
                })
                // Replace placeholder with final URL from backend
                setImages(prev =>
                    prev.map(img => img.previewUrl === previewUrl
                        ? { ...img, url: result.url, uploading: false, progress: 100 }
                        : img
                    )
                )
            } catch {
                toast.error(`Failed to upload ${file.name}`)
                // Remove failed placeholder
                setImages(prev => prev.filter(img => img.previewUrl !== previewUrl))
                URL.revokeObjectURL(previewUrl)
            }
        }
    }

    const handleRemoveImage = (index: number) => {
        setImages(prev => {
            URL.revokeObjectURL(prev[index].previewUrl)
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = async () => {
        const newErrors: { rating?: string; comment?: string } = {}
        if (rating === 0) newErrors.rating = 'Please select a star rating.'
        if (comment.length < 20) newErrors.comment = 'Review must be at least 20 characters.'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        const stillUploading = images.some(img => img.uploading)
        if (stillUploading) {
            toast.error('Please wait for photos to finish uploading.')
            return
        }

        setIsSubmitting(true)
        setErrors({})

        try {
            await api.post(`/mall/products/${productSlug}/reviews/create/`, {
                rating,
                comment,
                evidence_urls: images.map(img => img.url).filter(Boolean)
            })

            toast.success('Review submitted!')
            queryClient.invalidateQueries({ queryKey: ['product', productSlug] })
            queryClient.invalidateQueries({ queryKey: ['product-reviews', productSlug] })
            queryClient.invalidateQueries({ queryKey: ['can-review', productSlug] })
            handleClose()
        } catch (error: any) {
            const msg = error.response?.data?.detail || error.response?.data?.message
                || 'Failed to submit. You can only review products you have purchased.'
            toast.error(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const activeRating = hoverRating || rating

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
            <DialogContent className="sm:max-w-md p-6 bg-white">
                <DialogHeader className="mb-4">
                    <DialogTitle className="font-bold text-2xl text-gray-900">Write a Review</DialogTitle>
                    <DialogDescription className="text-gray-500 truncate max-w-[85%]">
                        {productName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Star Rating */}
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
                                    <Star className={cn(
                                        "w-10 h-10 transition-colors duration-200",
                                        activeRating >= star
                                            ? "fill-[#FBBF24] text-[#FBBF24]"
                                            : "fill-gray-100 text-gray-200"
                                    )} />
                                </button>
                            ))}
                        </div>
                        <div className="h-5 mt-2">
                            {activeRating > 0 && (
                                <span className="text-sm font-semibold text-[#FBBF24] uppercase tracking-wider">
                                    {RATING_LABELS[activeRating]}
                                </span>
                            )}
                        </div>
                        {errors.rating && <p className="text-red-500 text-xs font-medium mt-1">{errors.rating}</p>}
                    </div>

                    {/* Comment */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800">Your Review</label>
                        <div className="relative">
                            <textarea
                                value={comment}
                                onChange={(e) => { if (e.target.value.length <= 500) setComment(e.target.value) }}
                                rows={4}
                                className={cn(
                                    "w-full resize-none rounded-xl border bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30 focus:border-[#4C3B8A] transition-all",
                                    errors.comment ? "border-red-300 ring-4 ring-red-50" : "border-gray-200"
                                )}
                                placeholder="Share your experience — what you loved or what could be improved..."
                            />
                            <div className="absolute bottom-2 right-3 text-xs text-gray-400 font-medium">
                                {comment.length}/500
                            </div>
                        </div>
                        {errors.comment && <p className="text-red-500 text-xs font-medium">{errors.comment}</p>}
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-800">
                                Add Photos <span className="font-normal text-gray-400">(optional)</span>
                            </label>
                            <span className="text-xs text-gray-400">{images.length}/{MAX_IMAGES}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {/* Uploaded / uploading thumbnails */}
                            {images.map((img, i) => (
                                <div key={img.previewUrl} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={img.previewUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />

                                    {/* Upload progress overlay */}
                                    {img.uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-0.5">
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                            <span className="text-[9px] text-white font-bold">{img.progress}%</span>
                                        </div>
                                    )}

                                    {/* Remove button (only when done uploading) */}
                                    {!img.uploading && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(i)}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Add photo button */}
                            {images.length < MAX_IMAGES && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#4C3B8A] hover:border-[#4C3B8A] hover:bg-purple-50 transition-colors shrink-0"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    <span className="text-[9px] font-semibold">Upload</span>
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-gray-400">JPG, PNG or WebP — max 5 MB each</p>

                        {/* Hidden file input — allows selecting multiple files at once */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>
                </div>

                {/* Actions */}
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
                        disabled={isSubmitting || images.some(img => img.uploading)}
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
