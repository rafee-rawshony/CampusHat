'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { absoluteMediaUrl } from '@/services/upload.service'

export interface ProductImage {
    id: string
    image_url: string
    alt_text?: string | null
    sort_order?: number
    is_primary?: boolean
}

interface ProductImageGalleryProps {
    images: ProductImage[]
    productName: string
    categorySlug?: string
    // Allows parent variant selector to override the gallery focus
    activeImageOverride?: string | null
}

export function ProductImageGallery({ images, productName, activeImageOverride }: ProductImageGalleryProps) {
    // -------------------------
    // STATE & REFS
    // -------------------------
    const hasImages = images && images.length > 0
    const sortedImages = hasImages ? [...images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : []
    
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    // Embla Setup
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

    // Embla sync logic -> Component state
    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        emblaApi.on('select', onSelect)
        onSelect()
    }, [emblaApi, onSelect])

    // Parent override logic (Variant selector updates image)
    useEffect(() => {
        if (activeImageOverride && hasImages) {
            const index = sortedImages.findIndex(img => img.image_url.includes(activeImageOverride))
            if (index !== -1 && emblaApi) {
                emblaApi.scrollTo(index)
            }
        }
    }, [activeImageOverride, hasImages, sortedImages, emblaApi])

    // Keyboard Lightbox Navigation
    useEffect(() => {
        if (!lightboxOpen) return
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false)
            if (e.key === 'ArrowLeft') setSelectedIndex(p => (p > 0 ? p - 1 : sortedImages.length - 1))
            if (e.key === 'ArrowRight') setSelectedIndex(p => (p < sortedImages.length - 1 ? p + 1 : 0))
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [lightboxOpen, sortedImages.length])

    // -------------------------
    // EMPTY STATE
    // -------------------------
    if (!hasImages) {
        return (
            <div className="sticky top-4">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#4C3B8A] to-[#2D1B69] flex flex-col justify-center items-center p-6 text-center shadow-inner relative overflow-hidden">
                    <span className="text-white/10 absolute -right-10 -bottom-10 text-[200px] leading-none pointer-events-none">🎓</span>
                    <h2 className="text-white font-bold text-xl sm:text-2xl z-10 max-w-sm drop-shadow-md">
                        {productName}
                    </h2>
                    <p className="text-white/70 text-sm mt-2 z-10">Image unavailable</p>
                </div>
            </div>
        )
    }

    // -------------------------
    // GALLERY RENDER
    // -------------------------
    const lightboxJSX = (
        <div
            className="fixed inset-0 bg-black/85 flex items-center justify-center"
            style={{ zIndex: 9999 }}
            onClick={() => setLightboxOpen(false)}
        >
            {/* Close button */}
            <button
                className="absolute top-4 right-4 sm:top-5 sm:right-5 text-white bg-white/15 hover:bg-white/25 p-2.5 rounded-full transition-colors"
                style={{ zIndex: 10000 }}
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            >
                <X className="w-5 h-5" />
            </button>

            {/* Prev */}
            {sortedImages.length > 1 && (
                <button
                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white bg-white/15 hover:bg-white/25 p-3 rounded-full transition-colors"
                    style={{ zIndex: 10000 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        setSelectedIndex(p => (p > 0 ? p - 1 : sortedImages.length - 1))
                    }}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}

            {/* Image — centered, no fixed height so it never clips */}
            <div
                className="flex items-center justify-center w-full max-w-5xl px-20 sm:px-28 select-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={absoluteMediaUrl(sortedImages[selectedIndex].image_url)}
                    alt={sortedImages[selectedIndex].alt_text || productName}
                    className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
                    draggable={false}
                />
            </div>

            {/* Next */}
            {sortedImages.length > 1 && (
                <button
                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white bg-white/15 hover:bg-white/25 p-3 rounded-full transition-colors"
                    style={{ zIndex: 10000 }}
                    onClick={(e) => {
                        e.stopPropagation()
                        setSelectedIndex(p => (p < sortedImages.length - 1 ? p + 1 : 0))
                    }}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}

            {/* Counter + hint */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                {sortedImages.length > 1 && (
                    <span className="text-white/80 text-sm font-semibold bg-black/30 px-4 py-1 rounded-full">
                        {selectedIndex + 1} / {sortedImages.length}
                    </span>
                )}
                <span className="text-white/40 text-xs">Click outside to close</span>
            </div>
        </div>
    )

    return (
        <div className="sticky top-4 flex flex-col gap-3">
            {/* MAIN IMAGE */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm group/gallery">

                {/* Embla Wrapper */}
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex touch-pan-y">
                        {sortedImages.map((img) => (
                            <div
                                key={img.id}
                                className="flex-[0_0_100%] min-w-0 aspect-[4/3] relative"
                            >
                                <Image
                                    src={absoluteMediaUrl(img.image_url)}
                                    alt={img.alt_text || productName}
                                    fill
                                    unoptimized
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 55vw"
                                    priority
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Zoom button — appears on hover */}
                <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute bottom-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-700 hover:text-[#4C3B8A] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-200"
                >
                    <ZoomIn className="w-3.5 h-3.5" />
                    Zoom
                </button>

                {/* Counter Badge */}
                {sortedImages.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full z-10 pointer-events-none">
                        {selectedIndex + 1} / {sortedImages.length}
                    </div>
                )}

                {/* Mobile Dots */}
                {sortedImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 md:hidden">
                        {sortedImages.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'h-1.5 rounded-full transition-all duration-300 shadow-sm',
                                    selectedIndex === i ? 'bg-[#4C3B8A] w-5' : 'bg-gray-300 w-1.5'
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* THUMBNAILS */}
            {sortedImages.length > 1 && (
                <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {sortedImages.map((img, idx) => (
                        <button
                            key={img.id}
                            onClick={() => emblaApi?.scrollTo(idx)}
                            className={cn(
                                'w-16 h-16 rounded-xl overflow-hidden border-2 transition-all relative shrink-0 snap-start',
                                selectedIndex === idx
                                    ? 'border-[#4C3B8A] shadow-md'
                                    : 'border-gray-100 hover:border-gray-300 opacity-70 hover:opacity-100'
                            )}
                        >
                            <Image
                                src={absoluteMediaUrl(img.image_url)}
                                alt="Thumbnail"
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="64px"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* LIGHTBOX — rendered via portal directly on <body> to escape all stacking contexts */}
            {lightboxOpen && mounted && createPortal(lightboxJSX, document.body)}
        </div>
    )
}
