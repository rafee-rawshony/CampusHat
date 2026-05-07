'use client'

/**
 * Reusable image uploader.
 *
 * Two modes:
 *   - "avatar": circular preview, "Select / Change" button below
 *   - "rectangle": square/rectangular drop zone (good for product images,
 *     store logos, banners, etc.)
 *
 * Behaviour:
 *   - Validates type + size client-side before sending (faster feedback).
 *   - Shows a progress bar while the file is in flight.
 *   - On success calls onChange(url) with the URL the backend returned.
 *
 * Persistence is the parent's job: the component just produces a URL.
 */

import { useRef, useState } from 'react'
import { Camera, ImageIcon, Loader2, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { uploadImage, absoluteMediaUrl, type UploadCategory } from '@/services/upload.service'
import { cn } from '@/lib/utils'

interface Props {
    value?: string | null
    onChange: (url: string | null) => void
    category?: UploadCategory
    /** "avatar" = circle, "rectangle" = card */
    variant?: 'avatar' | 'rectangle'
    /** Used by avatar fallback initials when there's no image yet. */
    fallbackText?: string
    /** Pixel size for avatar variant. */
    size?: number
    label?: string
    className?: string
    disabled?: boolean
}

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export function ImageUpload({
    value,
    onChange,
    category = 'generic',
    variant = 'avatar',
    fallbackText = 'U',
    size = 128,
    label,
    className,
    disabled,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)

    const previewUrl = absoluteMediaUrl(value || '')

    // Triggered by the hidden <input type=file>.
    const handleFile = async (file: File) => {
        if (!ALLOWED.includes(file.type)) {
            toast.error('Only JPEG, PNG, or WebP images are allowed.')
            return
        }
        if (file.size > MAX_BYTES) {
            toast.error('Image must be under 5MB.')
            return
        }

        setUploading(true)
        setProgress(0)
        try {
            const result = await uploadImage(file, category, setProgress)
            onChange(result.url)
            toast.success('Image uploaded.')
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(err.response?.data?.message || 'Upload failed. Please try again.')
        } finally {
            setUploading(false)
            setProgress(0)
            // Reset the input so the same file can be re-selected.
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const onRemove = () => {
        onChange(null)
    }

    // ── Avatar variant ─────────────────────────────────────────────────
    if (variant === 'avatar') {
        return (
            <div className={cn('flex flex-col items-center', className)}>
                <div className="relative" style={{ width: size, height: size }}>
                    <Avatar className="border-2 border-gray-100 shadow-sm" style={{ width: size, height: size }}>
                        {previewUrl ? (
                            <AvatarImage src={previewUrl} alt="Profile" className="object-cover" />
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-brand-primary to-brand-dark text-white text-3xl font-bold">
                                {fallbackText}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    {uploading && (
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={onInputChange}
                    className="hidden"
                    disabled={disabled || uploading}
                />

                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2 border border-gray-200 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Camera className="h-4 w-4" />
                    {previewUrl ? 'Change Image' : 'Select Image'}
                </button>

                {previewUrl && !uploading && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="mt-2 text-xs text-red-600 hover:underline"
                    >
                        Remove
                    </button>
                )}

                {uploading && (
                    <div className="mt-2 w-full max-w-[160px]">
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-1">{progress}%</p>
                    </div>
                )}

                <p className="text-xs text-gray-400 mt-3 text-center max-w-[160px]">
                    {label || 'JPG, PNG or WebP — max 5MB.'}
                </p>
            </div>
        )
    }

    // ── Rectangle variant ──────────────────────────────────────────────
    return (
        <div className={cn('w-full', className)}>
            {label && (
                <p className="text-xs text-gray-500 font-medium mb-2">{label}</p>
            )}

            {previewUrl ? (
                // Filled state: show preview with a Replace / Remove overlay.
                <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    {!disabled && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="px-3 py-1.5 bg-white text-gray-800 text-xs font-bold rounded-md hover:bg-gray-100"
                            >
                                <Upload className="h-3 w-3 inline mr-1" /> Replace
                            </button>
                            <button
                                type="button"
                                onClick={onRemove}
                                className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-md hover:bg-red-600"
                            >
                                <X className="h-3 w-3 inline mr-1" /> Remove
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                // Empty state: dashed drop zone.
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="w-full aspect-video flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-primary hover:bg-brand-light/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
                            <p className="text-xs text-gray-500">{progress}%</p>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="h-10 w-10 text-gray-300" />
                            <p className="text-sm font-semibold text-gray-700">Click to upload</p>
                            <p className="text-xs text-gray-400">JPG, PNG or WebP — max 5MB</p>
                        </>
                    )}
                </button>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onInputChange}
                className="hidden"
                disabled={disabled || uploading}
            />
        </div>
    )
}
