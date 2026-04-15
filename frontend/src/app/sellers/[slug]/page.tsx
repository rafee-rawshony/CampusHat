'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    Users, Star, Package, Clock, MessageCircleReply,
    UserPlus, MessageSquare, ChevronDown, ChevronRight
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const SORT_OPTIONS = [
    { label: 'Recommended', value: '-created_at' },
    { label: 'Price: Low to High', value: 'price' },
    { label: 'Price: High to Low', value: '-price' },
    { label: 'Best Rating', value: '-rating_avg' },
]

export default function SellerStorePage() {
    const { slug } = useParams()
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()
    const queryClient = useQueryClient()

    const [sort, setSort] = useState('-created_at')
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

    // Fetch store
    const { data: store, isLoading: storeLoading, isError: storeError } = useQuery({
        queryKey: ['store', slug],
        queryFn: () => api.get(`/sellers/stores/${slug}/`).then(r => r.data),
        enabled: !!slug,
        retry: 1,
    })

    // Fetch following status
    const { data: followData } = useQuery({
        queryKey: ['store-follow', slug],
        queryFn: () => api.get(`/sellers/stores/${slug}/follow_status/`).then(r => r.data).catch(() => ({ is_following: false })),
        enabled: !!slug && isAuthenticated,
    })
    const isFollowing = followData?.is_following || false

    // Follow toggle
    const followMutation = useMutation({
        mutationFn: () => api.post(`/sellers/stores/${slug}/follow/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store-follow', slug] })
            queryClient.invalidateQueries({ queryKey: ['store', slug] })
        },
        onError: () => toast.error('Failed to update follow status'),
    })

    const handleFollow = () => {
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/sellers/${slug}`)
            return
        }
        followMutation.mutate()
    }

    // Fetch products
    const { data: productsRaw, isLoading: productsLoading } = useQuery({
        queryKey: ['store-products', slug, sort],
        queryFn: () => api.get('/mall/products/', {
            params: { store: slug, ordering: sort, page_size: 24, is_active: true }
        }).then(r => {
            const data = r.data
            if (data?.results) return data.results
            if (Array.isArray(data)) return data
            if (data?.data?.results) return data.data.results
            return []
        }),
        enabled: !!slug,
    })

    const products: any[] = productsRaw || []

    if (storeLoading) {
        return (
            <div className="bg-[#F5F5F5] min-h-screen animate-pulse">
                <div className="h-48 w-full bg-gray-300" />
                <div className="max-w-7xl mx-auto px-4 mt-4 space-y-4">
                    <div className="h-8 w-1/3 bg-gray-200 rounded" />
                    <div className="grid grid-cols-4 gap-4">
                        {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl" />)}
                    </div>
                </div>
            </div>
        )
    }

    if (storeError || !store) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h2 className="font-bold text-gray-700 text-lg mb-2">Store not found</h2>
                    <p className="text-sm text-gray-400 mb-4">This store may have been removed or doesn't exist.</p>
                    <Link href="/sellers" className="text-[#4C3B8A] font-semibold hover:underline text-sm">
                        ← Browse Sellers
                    </Link>
                </div>
            </div>
        )
    }

    const storeName  = store.name || store.store_name || 'Store'
    const bannerUrl  = store.banner || store.store_banner || null
    const logoUrl    = store.logo || null
    const bannerColor = store.banner_color || '#4C3B8A'
    const rating     = Number(store.rating_avg || store.rating || 0)
    const joinYear   = store.created_at ? new Date(store.created_at).getFullYear() : null

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-16">

            {/* HERO BANNER */}
            <div
                className="h-48 w-full relative"
                style={{ backgroundColor: bannerColor }}
            >
                {bannerUrl && (
                    <img src={bannerUrl} alt={storeName} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-4">

                {/* Breadcrumb */}
                <div className="flex items-center text-xs font-semibold text-gray-400 gap-2 pt-4 mb-4">
                    <Link href="/" className="hover:text-[#4C3B8A] transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href="/sellers" className="hover:text-[#4C3B8A] transition-colors">Sellers</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-700">{storeName}</span>
                </div>

                {/* Store Info Row */}
                <div className="flex flex-col sm:flex-row items-start gap-5 -mt-16 mb-6 relative z-10">
                    {/* Logo */}
                    <div className="w-20 h-20 rounded-2xl border-[3px] border-white shadow-lg overflow-hidden shrink-0" style={{ backgroundColor: bannerColor }}>
                        {logoUrl ? (
                            <img src={logoUrl} alt={storeName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">
                                {storeName?.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 pt-10 sm:pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <h1 className="font-bold text-2xl text-gray-900">{storeName}</h1>
                                {store.badge_label && (
                                    <span className="text-xs bg-[#4C3B8A]/10 text-[#4C3B8A] font-semibold px-2.5 py-0.5 rounded-full mt-1 inline-block">
                                        {store.badge_label}
                                    </span>
                                )}
                                {joinYear && (
                                    <p className="text-sm text-gray-400 mt-1">Member since {joinYear}</p>
                                )}
                            </div>

                            <div className="flex gap-2 shrink-0">
                                <Button
                                    onClick={handleFollow}
                                    variant={isFollowing ? 'outline' : 'default'}
                                    className={cn(
                                        'font-semibold gap-2 rounded-xl',
                                        !isFollowing && 'bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white'
                                    )}
                                    disabled={followMutation.isPending}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    {isFollowing ? 'Following' : 'Follow Store'}
                                </Button>
                                <Button variant="outline" className="rounded-xl font-semibold gap-2 border-gray-200">
                                    <MessageSquare className="w-4 h-4 text-[#4C3B8A]" />
                                    Message
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                        { icon: Users, label: 'Followers', value: (store.follower_count || store.followers_count || 0).toLocaleString(), color: 'text-blue-500' },
                        { icon: Package, label: 'Products', value: (store.product_count || store.products_count || products.length).toLocaleString(), color: 'text-[#4C3B8A]' },
                        { icon: Clock, label: 'On-Time Delivery', value: store.on_time_delivery_rate ? `${store.on_time_delivery_rate}%` : store.on_time_shipping_rate ? `${store.on_time_shipping_rate}%` : '—', color: 'text-emerald-500' },
                        { icon: MessageCircleReply, label: 'Response Rate', value: store.response_rate ? `${store.response_rate}%` : '—', color: 'text-purple-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
                            <stat.icon className={cn('w-5 h-5 shrink-0', stat.color)} />
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{stat.value}</p>
                                <p className="text-xs text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Rating */}
                {rating > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 mb-4 flex items-center gap-3">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-400">
                            from {(store.rating_count || store.reviews_count || 0)} reviews
                        </span>
                    </div>
                )}

                {/* Description */}
                {(store.description) && (
                    <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
                        <h3 className="font-semibold text-gray-800 mb-2 text-sm">About this Store</h3>
                        <p className={cn('text-sm text-gray-600 leading-relaxed', !isDescriptionExpanded && 'line-clamp-3')}>
                            {store.description}
                        </p>
                        {store.description.length > 180 && (
                            <button
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="mt-2 text-[#4C3B8A] text-sm font-semibold flex items-center gap-1 hover:underline"
                            >
                                {isDescriptionExpanded ? 'Show less' : 'Show more'}
                                <ChevronDown className={cn('w-4 h-4 transition-transform', isDescriptionExpanded && 'rotate-180')} />
                            </button>
                        )}
                    </div>
                )}

                {/* Products Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900 text-lg">
                            Products by {storeName}
                            <span className="text-gray-400 font-normal text-base ml-2">({products.length})</span>
                        </h2>
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                            className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4C3B8A]"
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {productsLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="font-semibold text-gray-700 mb-2">No products yet</h3>
                            <p className="text-sm text-gray-400">This store hasn't listed any products.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {products.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
