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
}

interface ProductCardProps {
    product: Product
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCartStore()
    const router = useRouter()
    const [isWishlisted, setIsWishlisted] = useState(false) // Optimistic state for now

    const primaryImage = product.images?.find(img => img.is_primary)?.image_url || product.images?.[0]?.image_url || null
    const isOutOfStock = product.stock_quantity <= 0
    const price = product.discount_price ? parseFloat(product.discount_price) : parseFloat(product.base_price)

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        if (product.has_variants) {
            // In a robust implementation, this might open a quick-view modal.
            // Since we're navigating to the product page instead, we just let the link wrapping act,
            // or we could explicitly push here. We will just use the link in this setup.
            return
        }

        const { isAuthenticated } = useAuthStore.getState()
        if (!isAuthenticated) {
            // Preserve the current URL as redirect destination
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
        <Link href={`/products/${product.slug}`} className="group block">
            <Card className="rounded-2xl border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full bg-white relative">

                {/* Top Action Layer */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
                    {discountPercent > 0 ? (
                        <DiscountBadge percentage={discountPercent} />
                    ) : (
                        <div></div> // Spacer 
                    )}
                    <button
                        onClick={toggleWishlist}
                        className={cn(
                            "bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm transition-colors pointer-events-auto",
                            isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-500"
                        )}
                    >
                        <Heart className="h-4 w-4" fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                </div>

                {/* Bottom Left Badge */}
                <div className="absolute top-[45%] lg:top-[50%] left-3 z-10 -translate-y-full">
                    {(product.stock_quantity > 0 && product.stock_quantity < 10) && (
                        <StockBadge quantity={product.stock_quantity} />
                    )}
                    {isOutOfStock && (
                        <Badge variant="secondary" className="bg-gray-800 text-white font-semibold text-[10px] px-2 py-0.5">Out of Stock</Badge>
                    )}
                </div>

                {/* Image Box */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
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
                </div>

                {/* Content Box */}
                <div className="p-4 flex flex-col flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        {product.category_name}
                    </p>

                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight flex-1 group-hover:text-brand-primary transition-colors">
                        {product.name}
                    </h3>

                    <div className="mt-2 text-xs">
                        <StarRating rating={product.rating_avg} count={product.rating_count} />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <CurrencyDisplay
                            amount={price}
                            className="text-lg font-bold text-gray-900"
                        />
                        {product.discount_price && (
                            <>
                                <CurrencyDisplay
                                    amount={parseFloat(product.base_price)}
                                    className="text-sm text-gray-400 line-through"
                                />
                                <div className="ml-auto">
                                    <p className="text-xs text-gray-500 font-medium">Sale ends soon. Don&apos;t miss out!</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 shrink-0">
                        {isOutOfStock ? (
                            <Button className="w-full bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed" disabled>
                                Out of Stock
                            </Button>
                        ) : product.has_variants ? (
                            <Button
                                className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white"
                                onClick={() => {
                                    // Let default navigation happen
                                }}
                            >
                                Select Options
                            </Button>
                        ) : (
                            <Button
                                className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white gap-2 transition-transform active:scale-95"
                                onClick={handleAddToCart}
                            >
                                <ShoppingBag className="h-4 w-4" /> Add to Cart
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    )
}

export function ProductCardSkeleton() {
    return (
        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden flex flex-col h-full bg-white relative">
            <div className="aspect-[4/3] w-full bg-gray-100 animate-pulse"></div>
            <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="h-3 bg-gray-100 w-1/3 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-100 w-full rounded animate-pulse"></div>
                <div className="h-4 bg-gray-100 w-2/3 rounded animate-pulse"></div>
                <div className="mt-auto h-5 bg-gray-100 w-1/2 rounded animate-pulse"></div>
                <div className="mt-2 h-10 bg-gray-100 w-full rounded-xl animate-pulse"></div>
            </div>
        </Card>
    )
}
