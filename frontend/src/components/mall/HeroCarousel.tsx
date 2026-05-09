'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
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
            <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-8">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
                    <div className="aspect-[16/9] md:aspect-[21/9] rounded-2xl bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm relative">
                <div className="overflow-hidden rounded-xl" ref={emblaRef}>
                    <div className="flex touch-pan-y">
                        {banners.map((banner) => (
                            <div key={banner.id} className="flex-[0_0_100%] min-w-0">
                                <div className="grid md:grid-cols-2 gap-5 md:gap-6 items-stretch min-h-[260px] md:min-h-[340px]">
                                    {/* Left: text on light bg */}
                                    <div className="flex flex-col justify-center px-2 sm:px-4 py-6 md:py-10">
                                        {banner.badge_text && (
                                            <span className="bg-[#4C3B8A]/10 text-[#4C3B8A] text-xs font-semibold px-3 py-1 rounded-full inline-block w-max mb-4">
                                                {banner.badge_text}
                                            </span>
                                        )}
                                        <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-gray-900 leading-tight tracking-tight mb-3 max-w-md">
                                            {banner.title}
                                        </h1>
                                        <p className="text-sm sm:text-base text-gray-500 mb-5 max-w-md leading-relaxed">
                                            {banner.subtitle}
                                        </p>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <Link
                                                href={banner.cta_href || '/shop'}
                                                className="bg-[#4C3B8A] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#34285e] transition inline-flex items-center gap-2 text-sm group shrink-0"
                                            >
                                                {banner.cta_text || 'Shop Now'}
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </Link>
                                            {banner.price_text && (
                                                <span className="font-bold text-xl sm:text-2xl text-red-500 tracking-tight">
                                                    {banner.price_text}
                                                </span>
                                            )}
                                        </div>
                                        {banner.price_text && (
                                            <p className="text-xs text-gray-400 mt-3">Limited time student discount.</p>
                                        )}
                                    </div>

                                    {/* Right: solid colored panel */}
                                    <div
                                        className="rounded-xl flex items-center justify-center p-6 md:p-8 relative overflow-hidden min-h-[180px] md:min-h-full"
                                        style={{ backgroundColor: banner.bg_color || '#4C3B8A' }}
                                    >
                                        {banner.image_url ? (
                                            <Image
                                                src={banner.image_url}
                                                alt={banner.title}
                                                width={420}
                                                height={320}
                                                className="object-contain max-h-[280px] relative z-10 drop-shadow-xl"
                                                priority
                                            />
                                        ) : (
                                            <h2
                                                className="text-3xl sm:text-4xl xl:text-5xl font-bold text-center tracking-tight px-2 leading-tight drop-shadow"
                                                style={{ color: banner.text_color || '#FFFFFF' }}
                                            >
                                                {banner.title}
                                            </h2>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dot Indicators — below carousel on light bg */}
                {banners.length > 1 && (
                    <div className="flex gap-2 justify-center mt-5">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => emblaApi?.scrollTo(index)}
                                className={cn(
                                    'h-2 rounded-full transition-all duration-300',
                                    selectedIndex === index
                                        ? 'bg-[#4C3B8A] w-6'
                                        : 'bg-gray-300 w-2 hover:bg-gray-400'
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
                            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white shadow-md rounded-full items-center justify-center hover:bg-gray-50 border border-gray-100 transition-all duration-200"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="text-gray-700 w-5 h-5" />
                        </button>
                        <button
                            onClick={() => emblaApi?.scrollNext()}
                            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white shadow-md rounded-full items-center justify-center hover:bg-gray-50 border border-gray-100 transition-all duration-200"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="text-gray-700 w-5 h-5" />
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
