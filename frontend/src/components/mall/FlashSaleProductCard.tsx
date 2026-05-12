'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { DiscountBadge } from '@/components/shared/DiscountBadge'
import { StarRating } from '@/components/shared/StarRating'
import toast from 'react-hot-toast'

interface FlashSaleItem {
    id: string
    product: {
        id: string
        name: string
        slug: string
        images?: { image: string; image_url?: string }[]
        primary_image_url?: string
        base_price: number | string
        rating_avg: number
        rating_count?: number
        review_count?: number
        stock_quantity: number
        category?: { name: string }
        category_name?: string
    }
    sale_price?: number | string | null
    override_price?: number | string | null
    quantity_limit: number | null
    sold_count: number
}

interface FlashSaleProductCardProps {
    item: FlashSaleItem
}

export function FlashSaleProductCard({ item }: FlashSaleProductCardProps) {
    const router = useRouter()
    const { addItem } = useCartStore()
    const { product } = item

    const basePrice = typeof product.base_price === 'string' ? parseFloat(product.base_price) : (product.base_price || 0)
    const rawSale = item.sale_price ?? item.override_price
    const salePrice = (typeof rawSale === 'string' ? parseFloat(rawSale) : rawSale) || basePrice
    const discountPercent = basePrice > 0 ? Math.round((1 - salePrice / basePrice) * 100) : 0
    const imageUrl = product.primary_image_url || product.images?.[0]?.image_url || product.images?.[0]?.image || null
    const remaining = item.quantity_limit != null ? item.quantity_limit - item.sold_count : null
    const isStockOut = remaining !== null && remaining <= 0
    const categoryName = product.category_name || product.category?.name || 'Category'
    const reviewCount = product.review_count ?? product.rating_count ?? 0
    const soldPercent = item.quantity_limit ? Math.min(Math.round((item.sold_count / item.quantity_limit) * 100), 100) : 0

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isStockOut) {
            toast.error('This item is sold out')
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
            price: salePrice.toString(),
            image_url: imageUrl || undefined,
            quantity: 1,
        })
        toast.success('Added to cart')
    }

    return (
        <Link
            href={`/products/${product.slug}`}
            className={`w-[160px] sm:w-[200px] shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow group block ${isStockOut ? 'opacity-75' : ''}`}
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${isStockOut ? 'grayscale' : ''}`}
                        sizes="200px"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#4C3B8A]/20 to-[#4C3B8A]/5 flex items-center justify-center">
                        <span className="text-gray-400 font-semibold text-xs text-center px-2">{product.name}</span>
                    </div>
                )}

                {discountPercent > 0 && !isStockOut && <DiscountBadge percentage={discountPercent} />}

                {/* Stock Out overlay */}
                {isStockOut && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                            Stock Out
                        </span>
                    </div>
                )}

                {/* Low stock warning */}
                {!isStockOut && remaining !== null && remaining > 0 && remaining <= 10 && (
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        Only {remaining} left
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-3">
                <p className="text-[10px] uppercase text-gray-400 mb-1 tracking-wide font-semibold">
                    {categoryName}
                </p>
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {product.name}
                </h3>
                <div className="mt-1">
                    <StarRating rating={product.rating_avg || 0} count={reviewCount} size="sm" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <span className={`font-bold text-base ${isStockOut ? 'text-gray-400' : 'text-[#4C3B8A]'}`}>৳{salePrice.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 line-through">৳{basePrice.toLocaleString()}</span>
                </div>

                {/* Sold progress bar */}
                {item.quantity_limit != null && (
                    <div className="mt-2">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${isStockOut ? 'bg-red-500' : soldPercent > 70 ? 'bg-orange-500' : 'bg-[#4C3B8A]'}`}
                                style={{ width: `${soldPercent}%` }}
                            />
                        </div>
                        <p className={`text-[10px] mt-0.5 font-medium ${isStockOut ? 'text-red-500' : 'text-gray-400'}`}>
                            {isStockOut ? 'Sold Out' : `${item.sold_count} sold`}
                        </p>
                    </div>
                )}

                <button
                    onClick={handleAddToCart}
                    disabled={isStockOut}
                    className={`mt-2 w-full text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                        isStockOut
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#1A1A2E] text-white hover:bg-[#2D1B69]'
                    }`}
                >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {isStockOut ? 'Sold Out' : 'Add to Cart'}
                </button>
            </div>
        </Link>
    )
}
