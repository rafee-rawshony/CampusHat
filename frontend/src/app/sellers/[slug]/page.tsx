'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import {
    Users,
    Star,
    Package,
    Clock,
    MessageCircleReply,
    UserPlus,
    MessageSquare,
    ChevronDown,
    Filter
} from 'lucide-react'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ProductCard, ProductCardSkeleton, Product } from '@/components/mall/ProductCard'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface StoreInfo {
    id: string
    store_name: string
    slug: string
    description: string
    store_banner: string | null
    theme_color: string // hex code or tailwind class
    rating: number
    reviews_count: number
    followers_count: number
    products_count: number
    on_time_shipping_rate: number // percentage
    response_rate: number // percentage
    created_at: string
}

export default function SellerStorePage() {
    const { slug } = useParams()

    const [store, setStore] = useState<StoreInfo | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)

    useEffect(() => {
        const fetchStoreData = async () => {
            setIsLoading(true)
            try {
                // Parallel fetch Store Profile + Products
                const [storeRes, productsRes] = await Promise.all([
                    api.get(`/sellers/stores/${slug}/`).catch(() => null),
                    api.get(`/mall/products/?store=${slug}&limit=24`).catch(() => null)
                ])

                // If API fails, mock for demo
                const storeData = storeRes?.data || {
                    id: 'fake-store-1',
                    store_name: 'TechHub AU',
                    slug: slug as string,
                    description: 'Premier electronics and gadget supplier authorized for campus distribution. We specialize in noise-cancelling headphones, mechanical keyboards, and general tech accessories optimized for students.',
                    store_banner: null,
                    theme_color: 'bg-blue-600',
                    rating: 4.8,
                    reviews_count: 342,
                    followers_count: 1250,
                    products_count: 45,
                    on_time_shipping_rate: 98.5,
                    response_rate: 95.0,
                    created_at: '2023-01-15T00:00:00Z'
                }

                const productsData = productsRes?.data?.results || Array(8).fill(null).map((_, i) => ({
                    id: `store-prod-${i}`,
                    slug: `store-prod-${i}`,
                    name: `${storeData.store_name} Special Item ${i + 1}`,
                    category_name: 'Electronics',
                    base_price: (250 + (i * 100)).toString(),
                    stock_quantity: 10 + i,
                    has_variants: false,
                    rating_avg: 4.5,
                    rating_count: 20 + i,
                    is_featured: i < 2,
                    images: []
                }))

                setStore(storeData)
                setProducts(productsData)

            } finally {
                setIsLoading(false)
            }
        }
        fetchStoreData()
    }, [slug])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface-base animate-pulse">
                <div className="h-64 w-full bg-gray-200"></div>
                <div className="container mx-auto px-4 -mt-16 relative z-10">
                    <div className="h-32 w-32 rounded-full bg-white border-4 border-white mb-4 shadow-sm mx-auto md:mx-0"></div>
                    <div className="h-8 w-64 bg-gray-200 rounded mb-8 mx-auto md:mx-0"></div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Array(5).fill(0).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100"></div>)}
                    </div>
                </div>
            </div>
        )
    }

    if (!store) return <div className="text-center py-20">Store not found.</div>

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-20">

            {/* HERO BANNER */}
            <div className={cn("h-64 sm:h-80 w-full relative", store.theme_color, !store.theme_color.startsWith('bg-') && 'bg-[#1A1A2E]')}>
                {store.store_banner && (
                    <Image src={store.store_banner} alt={store.store_name} fill className="object-cover opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl">

                {/* PROFILE SECTION */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 -mt-20 relative z-10 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">

                    {/* AVATAR */}
                    <div className="shrink-0 -mt-16 md:-mt-20 z-20">
                        <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-white p-1.5 shadow-xl ring-1 ring-gray-100">
                            <div className={cn("w-full h-full rounded-full flex items-center justify-center text-4xl font-black text-white", store.theme_color, !store.theme_color.startsWith('bg-') && 'bg-brand-primary')}>
                                {store.store_name.substring(0, 2).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left pt-2 md:pt-0">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">{store.store_name}</h1>
                        <p className="text-sm text-gray-500 font-medium mb-5">
                            Member since {new Date(store.created_at).getFullYear()}
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 w-full sm:w-auto">
                            <Button
                                variant={isFollowing ? "outline" : "default"}
                                className={cn(
                                    "px-6 rounded-full font-bold",
                                    !isFollowing && "bg-brand-primary hover:bg-brand-dark text-white"
                                )}
                                onClick={() => setIsFollowing(!isFollowing)}
                            >
                                {isFollowing ? 'Following' : <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Follow Seller</span>}
                            </Button>

                            <Button variant="outline" className="px-6 rounded-full font-bold text-gray-700 bg-white border-gray-200">
                                <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-brand-primary" /> Chat with Seller</span>
                            </Button>
                        </div>
                    </div>

                    {/* RATINGS QUICK SUMMARY */}
                    <div className="shrink-0 flex items-center bg-gray-50 rounded-2xl p-4 border border-gray-100 w-full sm:w-auto mt-4 md:mt-0">
                        <div className="text-center px-4">
                            <div className="text-3xl font-black text-gray-900 mb-1">{store.rating.toFixed(1)}</div>
                            <div className="flex justify-center mb-1"><Star className="h-4 w-4 text-amber-500 fill-amber-500" /></div>
                            <div className="text-xs text-brand-primary font-bold hover:underline cursor-pointer">{store.reviews_count} Reviews</div>
                        </div>
                    </div>
                </div>

                {/* STATS ROW */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
                    {[
                        { icon: Users, label: 'Followers', value: store.followers_count.toLocaleString(), color: 'text-blue-500' },
                        { icon: Star, label: 'Reviews', value: store.reviews_count.toLocaleString(), color: 'text-amber-500' },
                        { icon: Package, label: 'Products', value: store.products_count, color: 'text-brand-primary' },
                        { icon: Clock, label: 'On-Time Shipping', value: `${store.on_time_shipping_rate}%`, color: 'text-emerald-500' },
                        { icon: MessageCircleReply, label: 'Response Rate', value: `${store.response_rate}%`, color: 'text-purple-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                            <stat.icon className={cn("h-6 w-6 mb-3", stat.color)} />
                            <span className="text-2xl font-black text-gray-900 mb-1">{stat.value}</span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* ABOUT SECTION */}
                {store.description && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-12">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">About the Store</h3>
                        <div className={cn(
                            "text-gray-600 leading-relaxed text-sm sm:text-base",
                            !isDescriptionExpanded && "line-clamp-3"
                        )}>
                            {store.description}
                        </div>
                        {store.description.length > 200 && (
                            <button
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="mt-4 text-brand-primary font-bold text-sm flex items-center hover:underline"
                            >
                                {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                                <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", isDescriptionExpanded && "rotate-180")} />
                            </button>
                        )}
                    </div>
                )}

                {/* PRODUCTS SECTION */}
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Mobile Filter Trigger */}
                    <div className="md:hidden">
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2 font-bold h-12">
                            <Filter className="h-4 w-4" /> Filter Store Products
                        </Button>
                    </div>

                    {/* Sidebar Filters (Desktop) */}
                    <div className="hidden md:block w-64 shrink-0">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Filter className="h-5 w-5" /> Filters
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Categories</h4>
                                    <div className="space-y-2">
                                        {['All Products', 'Electronics', 'Accessories', 'Trending'].map((cat, i) => (
                                            <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" defaultChecked={i === 0} className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                                <span className="text-sm text-gray-600 group-hover:text-brand-primary transition-colors">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h4>
                                    <div className="flex items-center gap-2">
                                        <input type="number" placeholder="Min" className="w-full text-sm rounded-lg border-gray-200 bg-gray-50 focus:ring-brand-primary" />
                                        <span className="text-gray-400">-</span>
                                        <input type="number" placeholder="Max" className="w-full text-sm rounded-lg border-gray-200 bg-gray-50 focus:ring-brand-primary" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">All Products <span className="text-gray-400 font-medium text-lg ml-2">({products.length})</span></h2>
                            <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block p-2.5 font-medium shadow-sm">
                                <option>Recommended</option>
                                <option>Newest Arrivals</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>

                        {products.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900">No products found</h3>
                                <p className="text-gray-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}

                        {products.length > 0 && (
                            <div className="mt-12 text-center">
                                <Button variant="outline" className="border-gray-200 shadow-sm rounded-xl px-12 py-6 font-bold text-gray-700 hover:text-brand-primary hover:bg-gray-50">
                                    Load More
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
