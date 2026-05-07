'use client'

/**
 * Marketplace ad photo uploader.
 *
 * Drives the `images` field array on the post-ad form. Each row is a
 * real file upload (not a URL paste) — the uploaded URL gets stored
 * back on the same hidden form field so existing form-submission code
 * doesn't have to change.
 */

import React from 'react'
import { X, Upload, Loader2, Image as ImageIcon, Star } from 'lucide-react'
import { Control, useFieldArray, UseFormRegister } from 'react-hook-form'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { uploadImage, absoluteMediaUrl } from '@/services/upload.service'

interface PhotoUploadSectionProps {
    control: Control<any>
    register: UseFormRegister<any>
    errors?: any
}

const MAX_PHOTOS = 8
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export function PhotoUploadSection({ control, register, errors }: PhotoUploadSectionProps) {
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'images',
    })

    // Track per-slot upload progress so the user sees real feedback
    // when multiple uploads run at once.
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
    const [progress, setProgress] = useState(0)

    const onPickFile = async (file: File, slotIndex?: number) => {
        if (!ALLOWED.includes(file.type)) {
            toast.error('Only JPEG, PNG, or WebP images are allowed.')
            return
        }
        if (file.size > MAX_BYTES) {
            toast.error('Image must be under 5MB.')
            return
        }

        // Decide whether we replace an existing row or append a new one.
        const targetIndex = slotIndex ?? fields.length
        if (slotIndex === undefined && fields.length >= MAX_PHOTOS) {
            toast.error(`You can upload up to ${MAX_PHOTOS} photos.`)
            return
        }

        setUploadingIndex(targetIndex)
        setProgress(0)

        try {
            const result = await uploadImage(file, 'product', setProgress)
            if (slotIndex === undefined) {
                append({ url: result.url })
            } else {
                update(slotIndex, { url: result.url })
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(err.response?.data?.message || 'Upload failed.')
        } finally {
            setUploadingIndex(null)
            setProgress(0)
        }
    }

    return (
        <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2">
                <h2 className="text-lg font-bold text-gray-900 inline-flex items-center">
                    <span className="text-[#4C3B8A] mr-1">3.</span> Add Photos
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Upload at least one photo. The first one becomes the main image.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 border border-gray-100 rounded-xl">
                {fields.map((field, index) => {
                    // Each field row is a slot (filled or uploading).
                    const url = (field as { url?: string }).url
                    const previewUrl = absoluteMediaUrl(url || '')
                    const isMain = index === 0
                    const isUploadingThis = uploadingIndex === index

                    return (
                        <div
                            key={field.id}
                            className={`relative aspect-square rounded-lg border-2 overflow-hidden bg-white group ${
                                isMain ? 'border-[#4C3B8A]' : 'border-gray-200'
                            }`}
                        >
                            {/* Hidden field that the form library reads on submit */}
                            <input type="hidden" {...register(`images.${index}.url`)} />

                            {previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <ImageIcon className="h-8 w-8 text-gray-300" />
                                </div>
                            )}

                            {/* Main badge */}
                            {isMain && previewUrl && (
                                <span className="absolute top-1 left-1 inline-flex items-center gap-1 bg-[#4C3B8A] text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                                    <Star className="h-2.5 w-2.5 fill-current" /> Main
                                </span>
                            )}

                            {/* Loading overlay */}
                            {isUploadingThis && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="text-xs mt-1 font-bold">{progress}%</span>
                                </div>
                            )}

                            {/* Hover actions */}
                            {!isUploadingThis && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                                    <label className="cursor-pointer px-2 py-1 bg-white rounded text-[10px] font-bold uppercase">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0]
                                                if (f) onPickFile(f, index)
                                                e.target.value = ''
                                            }}
                                        />
                                        Replace
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="px-2 py-1 bg-red-500 text-white rounded text-[10px] font-bold uppercase"
                                    >
                                        <X className="h-3 w-3 inline" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Add new tile */}
                {fields.length < MAX_PHOTOS && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#4C3B8A] hover:bg-[#4C3B8A]/5 cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#4C3B8A] transition-colors">
                        {uploadingIndex === fields.length ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="text-[10px] font-bold">{progress}%</span>
                            </>
                        ) : (
                            <>
                                <Upload className="h-5 w-5" />
                                <span className="text-[10px] font-bold uppercase">Add Photo</span>
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) onPickFile(f)
                                e.target.value = ''
                            }}
                        />
                    </label>
                )}
            </div>

            <p className="text-xs text-gray-500">
                Up to {MAX_PHOTOS} photos · JPG / PNG / WebP · max 5MB each.
            </p>

            {errors?.images?.message && typeof errors.images.message === 'string' && (
                <p className="text-sm font-bold text-red-500">{errors.images.message}</p>
            )}
        </div>
    )
}
