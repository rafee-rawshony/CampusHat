'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProductImage {
    id: string
    image: string
    alt_text?: string | null
    order?: number
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
    const sortedImages = hasImages ? [...images].sort((a, b) => (a.order || 0) - (b.order || 0)) : []
    
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [lightboxOpen, setLightboxOpen] = useState(false)

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
            const index = sortedImages.findIndex(img => img.image.includes(activeImageOverride))
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
    return (
        <div className="sticky top-4 flex flex-col gap-3">
            {/* VIEWPORT ROW (Main Image) */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
                
                {/* Embla Wrapper */}
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex touch-pan-y">
                        {sortedImages.map((img) => (
                            <div 
                                key={img.id} 
                                className="flex-[0_0_100%] min-w-0 aspect-[4/3] relative cursor-zoom-in"
                                onClick={() => setLightboxOpen(true)}
                            >
                                <Image
                                    src={img.image}
                                    alt={img.alt_text || productName}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 100vw, 55vw"
                                    priority
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Counter Badge */}
                {sortedImages.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full z-10 pointer-events-none">
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
                                    "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                                    selectedIndex === i ? "bg-[#4C3B8A] w-5" : "bg-gray-300 w-1.5"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* DESKTOP THUMBNAILS (Hidden on Mobile) */}
            {sortedImages.length > 1 && (
                <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {sortedImages.map((img, idx) => (
                        <button
                            key={img.id}
                            onClick={() => emblaApi?.scrollTo(idx)}
                            className={cn(
                                "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all relative shrink-0 snap-start",
                                selectedIndex === idx 
                                    ? "border-[#4C3B8A] shadow-md" 
                                    : "border-gray-100 hover:border-gray-300 opacity-70 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={img.image}
                                alt="Thumbnail"
                                fill
                                className="object-cover"
                                sizes="64px"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* LIGHTBOX OVERLAY */}
            {lightboxOpen && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full z-[101]"
                        onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <button
                        className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-3 rounded-full z-[101]"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIndex(p => (p > 0 ? p - 1 : sortedImages.length - 1))
                        }}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>

                    <div 
                        className="relative w-full max-w-5xl h-[85vh] mx-16 select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={sortedImages[selectedIndex].image}
                            alt={sortedImages[selectedIndex].alt_text || productName}
                            fill
                            className="object-contain drop-shadow-2xl"
                            sizes="100vw"
                            quality={100}
                        />
                    </div>

                    <button
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-3 rounded-full z-[101]"
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIndex(p => (p < sortedImages.length - 1 ? p + 1 : 0))
                        }}
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 font-medium tracking-wide">
                        {selectedIndex + 1} / {sortedImages.length}
                    </div>
                </div>
            )}
        </div>
    )
}
