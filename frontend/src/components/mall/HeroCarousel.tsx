'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Banner {
    id: string
    title: string
    subtitle: string
    badge_text: string
    price_text: string
    cta_text: string
    cta_href: string
    image_url: string | null
    bg_color: string
    text_color: string
    is_active: boolean
    display_order: number
}

const FALLBACK_BANNER: Banner = {
    id: 'fallback',
    title: 'Welcome to CampusHat Mall',
    subtitle: 'Discover products from verified campus sellers',
    badge_text: 'Student Exclusive',
    price_text: '',
    cta_text: 'Shop Now',
    cta_href: '/shop',
    image_url: null,
    bg_color: '#4C3B8A',
    text_color: '#FFFFFF',
    is_active: true,
    display_order: 0,
}

export function HeroCarousel() {
    const { data: bannersRaw, isLoading } = useQuery({
        queryKey: ['mall-banners'],
        queryFn: async () => {
            const res = await api.get('/mall/banners/', { params: { is_active: true } })
            const d = res.data?.data ?? res.data
            return Array.isArray(d) ? d : (d?.results ?? [])
        },
        staleTime: 300_000,
    })

    const banners: Banner[] = (bannersRaw && bannersRaw.length > 0) ? bannersRaw : [FALLBACK_BANNER]

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 5000, stopOnInteraction: true }),
    ])
    const [selectedIndex, setSelectedIndex] = useState(0)

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        emblaApi.on('select', onSelect)
        onSelect()
    }, [emblaApi, onSelect])

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-10">
                <div className="aspect-[21/9] md:aspect-[21/9] aspect-[16/9] rounded-2xl bg-gray-200 animate-pulse" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-10">
            <div className="relative rounded-2xl overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y">
                    {banners.map((banner) => (
                        <div key={banner.id} className="flex-[0_0_100%] min-w-0">
                            <div
                                className="flex flex-col md:flex-row items-center w-full relative aspect-[16/9] md:aspect-[21/9]"
                                style={{
                                    background: `linear-gradient(135deg, ${banner.bg_color} 0%, ${banner.bg_color}DD 100%)`,
                                }}
                            >
                                {/* Left Content */}
                                <div className="flex-1 pl-6 md:pl-12 pr-6 flex flex-col justify-center z-10 py-6 md:py-0">
                                    {banner.badge_text && (
                                        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block w-max">
                                            {banner.badge_text}
                                        </span>
                                    )}
                                    <h1
                                        className="text-2xl sm:text-3xl xl:text-4xl font-bold leading-tight max-w-md"
                                        style={{ color: banner.text_color || '#FFFFFF' }}
                                    >
                                        {banner.title}
                                    </h1>
                                    <p
                                        className="text-base mt-2 max-w-sm opacity-80"
                                        style={{ color: banner.text_color || '#FFFFFF' }}
                                    >
                                        {banner.subtitle}
                                    </p>
                                    {banner.price_text && (
                                        <p
                                            className="text-sm font-medium mt-3 opacity-90"
                                            style={{ color: banner.text_color || '#FFFFFF' }}
                                        >
                                            {banner.price_text}
                                        </p>
                                    )}
                                    <Link
                                        href={banner.cta_href || '/shop'}
                                        className="mt-5 bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition inline-flex items-center gap-2 w-max text-sm"
                                    >
                                        {banner.cta_text || 'Shop Now'}
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>

                                {/* Right Image */}
                                <div className="hidden md:flex flex-1 items-center justify-center p-8 relative overflow-hidden">
                                    {/* Decorative shapes */}
                                    <div className="w-64 h-64 rounded-full bg-white/10 blur-3xl absolute top-8 right-8" />
                                    <div className="w-48 h-48 rounded-full bg-black/10 blur-3xl absolute bottom-8 left-8" />

                                    {banner.image_url ? (
                                        <Image
                                            src={banner.image_url}
                                            alt={banner.title}
                                            width={400}
                                            height={320}
                                            className="object-contain max-h-[320px] relative z-10"
                                            priority
                                        />
                                    ) : (
                                        <div className="relative z-10 w-full max-w-xs aspect-square bg-white/10 rounded-full border border-white/20 shadow-2xl backdrop-blur-sm flex items-center justify-center">
                                            <span className="text-7xl">🎓</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dot Indicators */}
                {banners.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => emblaApi?.scrollTo(index)}
                                className={cn(
                                    'h-2 rounded-full transition-all duration-300',
                                    selectedIndex === index
                                        ? 'bg-white w-6'
                                        : 'bg-white/40 w-2 hover:bg-white/60'
                                )}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Prev/Next Arrows — desktop only */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={() => emblaApi?.scrollPrev()}
                            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center hover:bg-white/30 transition"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="text-white w-5 h-5" />
                        </button>
                        <button
                            onClick={() => emblaApi?.scrollNext()}
                            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center hover:bg-white/30 transition"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="text-white w-5 h-5" />
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
