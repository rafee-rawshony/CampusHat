'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'
import { DiscountBadge } from '@/components/shared/DiscountBadge'
import { StockBadge } from '@/components/shared/StockBadge'
import { StarRating } from '@/components/shared/StarRating'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { cn } from '@/lib/utils'
import { absoluteMediaUrl } from '@/services/upload.service'

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
    const [isWishlisted, setIsWishlisted] = useState(false) // Optimistic state for now

    const primaryImage = absoluteMediaUrl(product.images?.find(img => img.is_primary)?.image_url || product.images?.[0]?.image_url || null)
    const isOutOfStock = product.stock_quantity <= 0
    const price = product.discount_price ? parseFloat(product.discount_price) : parseFloat(product.base_price)

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        if (product.has_variants) {
            return
        }

        const { isAuthenticated } = useAuthStore.getState()
        if (!isAuthenticated) {
            const currentPath = window.location.pathname
            router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
            return
        }

        addItem({
            id: crypto.randomUUID(), // Temp ID for the cart item instance
            product_id: product.id,
            name: product.name,
            slug: product.slug,
            price: price.toString(),
            image_url: primaryImage || null,
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
            toast.success(prev ? 'Removed from wishlist' : 'Added to wishlist')
        } catch {
            setIsWishlisted(prev)
            toast.error('Failed to update wishlist')
        }
    }

    // Determine Discount %
    let discountPercent = 0
    if (product.discount_price && parseFloat(product.base_price) > parseFloat(product.discount_price)) {
        discountPercent = Math.round(((parseFloat(product.base_price) - parseFloat(product.discount_price)) / parseFloat(product.base_price)) * 100)
    }

    return (
        <Link href={`/products/${product.slug}`} className="group block h-full">
            <Card className="rounded-sm flex flex-col h-full bg-white relative overflow-hidden border-none shadow-none hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300">

                {/* Top Action Layer */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10 pointer-events-none">
                    {discountPercent > 0 ? (
                        <DiscountBadge percentage={discountPercent} />
                    ) : (
                        <div></div> // Spacer 
                    )}
                    <button
                        onClick={toggleWishlist}
                        className={cn(
                            "bg-white/90 backdrop-blur p-1.5 rounded-full shadow-sm transition-colors pointer-events-auto",
                            isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-500"
                        )}
                    >
                        <Heart className="h-4 w-4" fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                </div>

                {/* Bottom Left Badge */}
                <div className="absolute top-[45%] lg:top-[50%] left-2 z-10 -translate-y-full">
                    {(product.stock_quantity > 0 && product.stock_quantity < 10) && (
                        <StockBadge quantity={product.stock_quantity} />
                    )}
                    {isOutOfStock && (
                        <Badge variant="secondary" className="bg-gray-800 text-white font-semibold text-[10px] px-2 py-0.5">Out of Stock</Badge>
                    )}
                </div>

                {/* Image Box (1:1 ratio like Daraz) */}
                <div className="relative aspect-square w-full overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    {primaryImage ? (
                        <Image
                            src={primaryImage}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="text-xl font-bold text-gray-300 tracking-wider">
                            {product.name.charAt(0)}
                        </div>
                    )}
                    
                    {/* Hover Overlay Action (Daraz Style) */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/50 to-transparent flex justify-center z-20">
                        {isOutOfStock ? (
                           <span className="text-white text-xs font-semibold drop-shadow-md">Out of Stock</span>
                        ) : product.has_variants ? (
                            <Button 
                                size="sm" 
                                className="w-full bg-[#f85606] hover:bg-[#d04805] text-white shadow-md text-xs h-8"
                                onClick={(e) => {
                                    // Prevent link navigation if we want a quickview modal in the future.
                                    // For now, let it navigate.
                                }}
                            >
                                Select Options
                            </Button>
                        ) : (
                            <Button 
                                size="sm" 
                                className="w-full bg-[#f85606] hover:bg-[#d04805] text-white gap-2 shadow-md text-xs h-8"
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleAddToCart(e)
                                }}
                            >
                                <ShoppingBag className="h-3 w-3" /> Add to Cart
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content Box */}
                <div className="p-2 flex flex-col flex-1 bg-white">
                    <h3 className="font-normal text-[#212121] line-clamp-2 text-[13px] md:text-[14px] leading-[18px] md:leading-[20px] flex-1 group-hover:text-[#f85606] transition-colors mt-1 h-[36px] md:h-[40px]">
                        {product.name}
                    </h3>

                    <div className="mt-1 flex flex-col justify-end">
                        <CurrencyDisplay
                            amount={price}
                            className="text-[16px] md:text-[18px] leading-[22px] font-medium text-[#f85606]"
                        />
                        {product.discount_price && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <CurrencyDisplay
                                    amount={parseFloat(product.base_price)}
                                    className="text-[12px] text-[#9e9e9e] line-through"
                                />
                                {discountPercent > 0 && (
                                    <span className="text-[12px] text-[#212121]">-{discountPercent}%</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] md:text-[12px] text-[#9e9e9e]">
                        <div className="flex items-center">
                            <StarRating rating={product.rating_avg} count={product.rating_count} />
                        </div>
                        {product.sold_count !== undefined && (
                            <span className="ml-1">{product.sold_count} Sold</span>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    )
}

export function ProductCardSkeleton() {
    return (
        <Card className="rounded flex flex-col h-full bg-white relative overflow-hidden border border-gray-100 shadow-sm">
            <div className="aspect-square w-full bg-gray-100 animate-pulse"></div>
            <div className="p-2.5 flex flex-col flex-1 gap-2">
                <div className="h-4 bg-gray-100 w-full rounded animate-pulse"></div>
                <div className="h-4 bg-gray-100 w-2/3 rounded animate-pulse"></div>
                <div className="mt-1 h-5 bg-gray-100 w-1/2 rounded animate-pulse"></div>
                <div className="mt-auto h-3 bg-gray-100 w-full rounded animate-pulse"></div>
            </div>
        </Card>
    )
}
