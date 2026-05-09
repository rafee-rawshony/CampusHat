'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Home, ChevronRight, X, ShoppingBag } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/stores/auth.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { api } from '@/lib/api'
import { ProductCard, Product } from '@/components/mall/ProductCard'

export default function WishlistPage() {
    const router = useRouter()
    const { isAuthenticated, _hasHydrated } = useAuthStore()
    const { toggleWishlist } = useWishlistStore()
    const queryClient = useQueryClient()

    // Guard: redirect unauthenticated users to login
    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.replace('/auth/login?redirect=/wishlist')
        }
    }, [_hasHydrated, isAuthenticated, router])

    const { data: products = [], isLoading } = useQuery<Product[]>({
        queryKey: ['wishlist-products'],
        queryFn: async () => {
            const { data } = await api.get('/wishlist/')
            const products = Array.isArray(data?.data) ? data.data : (data?.results || [])
            return products.filter(Boolean)
        },
        enabled: !!isAuthenticated,
        staleTime: 60_000,
    })

    const handleRemove = async (productId: string) => {
        await toggleWishlist(productId)
        queryClient.invalidateQueries({ queryKey: ['wishlist-products'] })
        toast.success('Removed from wishlist')
    }

    if (!_hasHydrated || !isAuthenticated) return null

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-6">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
                    <Link href="/" className="flex items-center gap-1 hover:text-[#4C3B8A]">
                        <Home className="w-3.5 h-3.5" /> Home
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-gray-800 font-medium">Wishlist</span>
                </nav>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
                    {!isLoading && products.length > 0 && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-[#4C3B8A] text-white rounded-full">
                            {products.length}
                        </span>
                    )}
                </div>

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] rounded-2xl bg-white animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && products.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mb-4">
                            <Heart className="w-9 h-9 text-pink-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Your wishlist is empty</h2>
                        <p className="text-sm text-gray-500 mt-1 mb-6">Save products you love and come back to them anytime.</p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#4C3B8A] text-white text-sm font-semibold rounded-xl hover:bg-[#3d2e6e] transition-colors"
                        >
                            <ShoppingBag className="w-4 h-4" /> Browse Products
                        </Link>
                    </div>
                )}

                {/* Product grid */}
                {!isLoading && products.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map(product => (
                            <div key={product.id} className="relative group">
                                <ProductCard product={product} />
                                {/* Remove button overlaid on card */}
                                <button
                                    onClick={() => handleRemove(product.id)}
                                    title="Remove from wishlist"
                                    className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
