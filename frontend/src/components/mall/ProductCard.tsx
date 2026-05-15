'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/shared/StarRating'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { cn } from '@/lib/utils'
import { absoluteMediaUrl } from '@/services/upload.service'
import { api } from '@/lib/api'

export interface Product {
    id: string
    slug: string
    name: string
    category_name: string
    base_price: string
    discount_price?: string | null
    images: { id: string, image_url: string, is_primary: boolean }[]
    stock_quantity: number
    has_variants: boolean
    rating_avg: number
    rating_count: number
    is_featured: boolean
    tags?: string[]
    sold_count?: number
}

interface ProductCardProps {
    product: Product
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCartStore()
    const router = useRouter()
    const [isWishlisted, setIsWishlisted] = useState(false)

    const primaryImage = absoluteMediaUrl(
        product.images?.find(img => img.is_primary)?.image_url ||
        product.images?.[0]?.image_url ||
        null
    )
    const isOutOfStock = product.stock_quantity <= 0
    const price = product.discount_price
        ? parseFloat(product.discount_price)
        : parseFloat(product.base_price)

    let discountPercent = 0
    if (product.discount_price && parseFloat(product.base_price) > parseFloat(product.discount_price)) {
        discountPercent = Math.round(
            ((parseFloat(product.base_price) - parseFloat(product.discount_price)) / parseFloat(product.base_price)) * 100
        )
    }

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        if (product.has_variants) {
            router.push(`/products/${product.slug}`)
            return
        }
        const { isAuthenticated } = useAuthStore.getState()
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
            return
        }
        addItem({
            id: crypto.randomUUID(),
            product_id: product.id,
            name: product.name,
            slug: product.slug,
            price: price.toString(),
            image_url: primaryImage || undefined,
            quantity: 1,
        })
        toast.success('Added to cart')
    }

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault()
        const { isAuthenticated } = useAuthStore.getState()
        if (!isAuthenticated) {
            router.push('/auth/login')
            return
        }
        const prev = isWishlisted
        setIsWishlisted(!prev)
        try {
            await api.post('/wishlist/toggle/', { product_id: product.id })
            toast.success(prev ? 'Removed from wishlist' : 'Saved to wishlist')
        } catch {
            setIsWishlisted(prev)
            toast.error('Failed to update wishlist')
        }
    }

    return (
        <Link href={`/products/${product.slug}`} className="group block h-full">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full transition-all duration-200 hover:shadow-[0_4px_20px_rgba(76,59,138,0.12)] hover:border-[#4C3B8A]/20">

                {/* ── IMAGE ── */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden shrink-0">

                    {/* Discount badge */}
                    {discountPercent > 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-[#e84040] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-4 shadow-sm">
                            -{discountPercent}%
                        </div>
                    )}

                    {/* Featured badge */}
                    {product.is_featured && discountPercent === 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-[#4C3B8A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-4 shadow-sm">
                            Featured
                        </div>
                    )}

                    {/* Wishlist */}
                    <button
                        onClick={toggleWishlist}
                        className={cn(
                            'absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all duration-200',
                            isWishlisted
                                ? 'bg-red-500 text-white scale-110'
                                : 'bg-white/90 text-gray-400 hover:bg-white hover:text-red-500 hover:scale-110'
                        )}
                    >
                        <Heart className="w-3.5 h-3.5" fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>

                    {/* Product image */}
                    {primaryImage ? (
                        <Image
                            src={primaryImage}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <span className="text-4xl font-black text-gray-200 select-none">
                                {product.name.charAt(0)}
                            </span>
                        </div>
                    )}

                    {/* Out of stock overlay */}
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-gray-800/80 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow">
                                Out of Stock
                            </span>
                        </div>
                    )}

                    {/* Add to cart — slides up on hover (desktop) */}
                    {!isOutOfStock && (
                        <div className="absolute inset-x-0 bottom-0 hidden sm:block translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                            <button
                                onClick={handleAddToCart}
                                className="w-full bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                {product.has_variants ? 'View Options' : 'Add to Cart'}
                            </button>
                        </div>
                    )}

                    {/* Floating Add Button — always visible on mobile (no hover) */}
                    {!isOutOfStock && (
                        <button
                            onClick={handleAddToCart}
                            aria-label="Add to cart"
                            className="absolute sm:hidden bottom-2 right-2 z-10 w-9 h-9 rounded-full bg-[#4C3B8A] text-white shadow-lg shadow-brand-primary/30 flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <ShoppingBag className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* ── CONTENT ── */}
                <div className="p-2.5 sm:p-3 flex flex-col flex-1 gap-1">

                    {/* Category label */}
                    {product.category_name && (
                        <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400 uppercase tracking-wide truncate">
                            {product.category_name}
                        </span>
                    )}

                    {/* Name — 2 lines, fixed min-height so all cards align */}
                    <h3 className="text-[12px] sm:text-[13px] font-medium text-gray-800 line-clamp-2 leading-[1.4] sm:leading-[1.45] min-h-[2.8em] sm:min-h-[2.9em] group-hover:text-[#4C3B8A] transition-colors">
                        {product.name}
                    </h3>

                    {/* Rating + sold */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRating rating={product.rating_avg} count={0} size="sm" />
                        {(product.rating_count > 0 || (product.sold_count ?? 0) > 0) && (
                            <span className="text-[10px] text-gray-400">
                                {product.rating_count > 0 && `(${product.rating_count})`}
                                {product.sold_count && product.sold_count > 0 && (
                                    <> · {product.sold_count} sold</>
                                )}
                            </span>
                        )}
                    </div>

                    {/* Price — pushed to bottom */}
                    <div className="mt-auto pt-2 border-t border-gray-50">
                        <CurrencyDisplay
                            amount={price}
                            className="text-[15px] font-bold text-[#4C3B8A] leading-none"
                        />
                        {product.discount_price && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <CurrencyDisplay
                                    amount={parseFloat(product.base_price)}
                                    className="text-[11px] text-gray-400 line-through"
                                />
                                {discountPercent > 0 && (
                                    <span className="text-[10px] font-bold text-[#e84040]">
                                        -{discountPercent}%
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full animate-pulse">
            <div className="aspect-square bg-gray-100 shrink-0" />
            <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="h-2.5 bg-gray-100 rounded-full w-16" />
                <div className="h-3.5 bg-gray-100 rounded-lg w-full mt-1" />
                <div className="h-3.5 bg-gray-100 rounded-lg w-3/4" />
                <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-3 h-3 bg-gray-100 rounded-sm" />
                    ))}
                </div>
                <div className="mt-auto pt-2 border-t border-gray-50">
                    <div className="h-4 bg-gray-100 rounded-lg w-20" />
                </div>
            </div>
        </div>
    )
}
