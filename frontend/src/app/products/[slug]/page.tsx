'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
    Heart,
    ChevronRight,
    Store as StoreIcon,
    PackageX,
    ArrowLeft,
    Star,
    MessageCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { StarRating } from '@/components/shared/StarRating'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { DiscountBadge } from '@/components/shared/DiscountBadge'
import { cn } from '@/lib/utils'

// Subcomponents
import { ProductImageGallery } from '@/components/mall/ProductImageGallery'
import { ProductVariantSelector, ProductVariant } from '@/components/mall/ProductVariantSelector'
import { ProductQuantityStepper } from '@/components/mall/ProductQuantityStepper'
import { StickyCartBar } from '@/components/mall/StickyCartBar'
import { ProductReviewsTab } from '@/components/mall/ProductReviewsTab'
import { ProductStoreInfoTab } from '@/components/mall/ProductStoreInfoTab'
import { ProductShippingTab } from '@/components/mall/ProductShippingTab'
import { ProductQATab } from '@/components/mall/ProductQATab'
import { RelatedProducts } from '@/components/mall/RelatedProducts'

export default function ProductDetailPage() {
    const { slug } = useParams()
    const router = useRouter()
    
    // Global Stores
    const { isAuthenticated } = useAuthStore()
    const { addItem } = useCartStore()
    const { isWishlisted, toggleWishlist } = useWishlistStore()

    // Interactive State
    const [quantity, setQuantity] = useState(1)
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
    const [activeVariantOverride, setActiveVariantOverride] = useState<ProductVariant | null>(null)
    const [addingToCart, setAddingToCart] = useState(false)
    const [variantError, setVariantError] = useState(false)

    // View Count Fire-and-Forget Reference Check
    const [hasViewed, setHasViewed] = useState(false)

    // API: Fetch Product Details
    const { data: productData, isLoading, isError } = useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const res = await api.get(`/mall/products/${slug}/`)
            return res.data?.data || res.data
        },
        staleTime: 60_000,
        retry: 1
    })

    const product = productData

    // Async View Count Tracking
    useEffect(() => {
        if (product && !hasViewed) {
            setHasViewed(true)
            api.post(`/mall/products/${product.id}/view/`).catch(() => {})
        }
    }, [product, hasViewed])

    // Update active variant when selections change
    useEffect(() => {
        if (!product || !product.has_variants || !product.variants) return
        setVariantError(false)

        const matched = product.variants.find((v: ProductVariant) => {
            return Object.entries(selectedAttributes).every(([k, val]) => v.attributes[k] === val)
        })

        if (matched) {
            setActiveVariantOverride(matched)
            setQuantity(1) // Reset quantity on valid variant change
        } else {
            setActiveVariantOverride(null)
        }
    }, [selectedAttributes, product])

    // Pre-select first variant logic when loaded
    useEffect(() => {
        if (product && product.has_variants && product.variants?.length > 0 && Object.keys(selectedAttributes).length === 0) {
            // Find first in-stock variant to preselect, else pick absolutely first
            const firstInStock = product.variants.find((v: ProductVariant) => v.stock > 0) || product.variants[0]
            setSelectedAttributes(firstInStock.attributes)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product])

    // Handlers
    const handleAttributeSelect = (key: string, value: string) => {
        setSelectedAttributes(prev => ({ ...prev, [key]: value }))
    }

    const validateVariantSelections = () => {
        if (product && product.has_variants && !activeVariantOverride) {
            setVariantError(true)
            toast.error('Please select an available variant option.')
            return false
        }
        return true
    }

    const handleAddToCart = async () => {
        if (!product) return
        if (!validateVariantSelections()) return
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/products/${slug}`)
            return
        }
        setAddingToCart(true)
        try {
            const finalPrice = product.has_variants
                ? activeVariantOverride!.price
                : (product.discount_price ?? product.base_price)
            // Fire-and-forget optimistic add — best UX for "Add to Cart"
            addItem({
                id: crypto.randomUUID(),
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                price: String(finalPrice),
                image_url: activeVariantOverride?.image || product.images?.[0]?.image_url,
                quantity: quantity,
                variant_id: activeVariantOverride?.id,
                variant_info: activeVariantOverride?.attributes,
            })
            toast.success('Added to cart!')
        } catch {
            toast.error('Failed to add to cart. Please try again.')
        } finally {
            setAddingToCart(false)
        }
    }

    const handleBuyNow = async () => {
        // Auth check first — do NOT call handleAddToCart (it would also navigate to login
        // and then this function would still call router.push('/checkout') after).
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/products/${slug}`)
            return
        }
        if (!validateVariantSelections()) return
        setAddingToCart(true)
        try {
            const finalPrice = product.has_variants
                ? activeVariantOverride!.price
                : (product.discount_price ?? product.base_price)
            // AWAIT the full addItem (API call + syncCart) so the cart is definitely
            // populated before the checkout page mounts and checks items.length.
            await addItem({
                id: crypto.randomUUID(),
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                price: String(finalPrice),
                image_url: activeVariantOverride?.image || product.images?.[0]?.image_url,
                quantity: quantity,
                variant_id: activeVariantOverride?.id,
                variant_info: activeVariantOverride?.attributes,
            })
            router.push('/checkout')
        } catch {
            toast.error('Failed to process. Please try again.')
        } finally {
            setAddingToCart(false)
        }
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product?.name,
                url: window.location.href
            }).catch(() => {})
        } else {
            navigator.clipboard.writeText(window.location.href)
            toast.success("Link copied to clipboard!")
        }
    }

    const handleChatSeller = async () => {
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/products/${slug}`)
            return
        }
        if (!product?.store?.id) {
            toast.error("Store not found")
            return
        }
        try {
            const res = await api.post('/mall/chats/start/', { store_id: product.store.id })
            const chatId = res.data?.data?.id
            if (chatId) {
                router.push(`/marketplace/chat/${chatId}`)
            }
        } catch (e) {
            toast.error("Failed to start chat")
        }
    }

    // ==========================================
    // RENDER: LOADING STATE
    // ==========================================
    if (isLoading) {
        return (
            <>
                <div className="bg-white min-h-screen py-6 animate-pulse px-4">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                        <div className="w-full lg:w-[55%] aspect-[4/3] bg-gray-200 rounded-2xl" />
                        <div className="w-full lg:w-[45%] flex flex-col gap-6">
                            <div className="h-10 bg-gray-200 w-3/4 rounded-xl" />
                            <div className="h-6 bg-gray-200 w-1/3 rounded-xl" />
                            <div className="h-24 bg-gray-200 w-full rounded-2xl mt-4" />
                            <div className="h-12 bg-gray-200 w-full rounded-xl mt-4" />
                            <div className="h-14 bg-gray-200 w-full rounded-xl mt-4" />
                        </div>
                    </div>
                </div>
            </>
        )
    }

    // ==========================================
    // RENDER: ERROR / NOT FOUND STATE
    // ==========================================
    if (isError || !product) {
        return (
            <>
                <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center p-4">
                    <PackageX className="w-20 h-20 text-gray-300 mb-6" />
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Product Not Found</h1>
                    <p className="text-gray-500 font-medium text-center max-w-sm">
                        This product may have been removed, or the link is broken.
                    </p>
                    <div className="flex items-center gap-3 mt-8">
                        <Button variant="outline" onClick={() => router.back()} className="font-semibold px-6 border-gray-200 hover:bg-gray-50 text-gray-700 h-12 rounded-xl">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                        </Button>
                        <Button onClick={() => router.push('/shop')} className="font-semibold px-8 bg-[#4C3B8A] hover:bg-[#34285e] h-12 rounded-xl">
                            Browse Shop
                        </Button>
                    </div>
                </div>
            </>
        )
    }

    // ==========================================
    // DERIVED VALUES
    // ==========================================
    const isWishlistedState = isWishlisted(product.id)
    const basePrice = Number(product.base_price)
    
    // Dynamic price calculation depending on Variant Selection vs Base Listing
    const displayPrice = product.has_variants && activeVariantOverride
        ? Number(activeVariantOverride.price)
        : (product.discount_price ? Number(product.discount_price) : basePrice)

    // Calculate generic discount if it's not a variant
    const listPrice = product.has_variants ? null : basePrice
    const discountPercent = listPrice && displayPrice < listPrice 
        ? Math.round((1 - (displayPrice / listPrice)) * 100) 
        : 0

    // Stock constraint checking
    const maxStock = product.has_variants 
        ? (activeVariantOverride?.stock || 0) 
        : product.stock_quantity
    
    const isOutOfStock = maxStock === 0

    return (
        <>
            <main className="bg-white min-h-screen pb-[140px] sm:pb-20">

                {/* BREADCRUMB */}
                <div className="bg-white border-b border-gray-100 py-3 hidden sm:block">
                    <div className="max-w-7xl mx-auto px-4 lg:px-6">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link href="/" className="text-gray-500 hover:text-[#4C3B8A] transition font-medium">Home</Link>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            <Link href="/categories" className="text-gray-500 hover:text-[#4C3B8A] transition font-medium">Categories</Link>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            {product.category && (
                                <>
                                    <Link href={`/categories/${product.category.slug}`} className="text-gray-500 hover:text-[#4C3B8A] transition font-medium">
                                        {product.category.name}
                                    </Link>
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                </>
                            )}
                            <span className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-md">
                                {product.name}
                            </span>
                        </nav>
                    </div>
                </div>

                {/* MAIN PRODUCT SECTION */}
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6 md:py-8">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 lg:gap-12">
                        
                        {/* LEFT COLUMN - GALLERY */}
                        <div className="w-full lg:w-[55%] shrink-0">
                            <ProductImageGallery 
                                images={product.images || []}
                                productName={product.name}
                                categorySlug={product.category?.slug}
                                activeImageOverride={activeVariantOverride?.image}
                            />
                        </div>

                        {/* RIGHT COLUMN - INFO PANEL */}
                        <div className="flex-1 lg:sticky lg:top-4 lg:self-start lg:max-h-screen lg:overflow-y-auto lg:pr-2 hide-scrollbar">
                            
                            {/* Badges Row */}
                            <div className="flex items-center flex-wrap gap-2 mb-3">
                                {product.category && (
                                    <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md tracking-wide">
                                        {product.category.name}
                                    </span>
                                )}
                                {product.is_featured && (
                                    <span className="bg-[#4C3B8A]/10 text-[#4C3B8A] text-xs font-bold px-2.5 py-1 rounded-md tracking-wide flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-[#4C3B8A]" /> Featured
                                    </span>
                                )}
                                {product.brand && (
                                    <span className="text-xs text-gray-400 font-medium ml-1">
                                        by {product.brand.name}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="font-black text-2xl sm:text-3xl lg:text-4xl text-gray-900 leading-[1.15]">
                                {product.name}
                            </h1>

                            {/* Ratings & Sold */}
                            <div className="flex items-center flex-wrap gap-3 mt-4">
                                <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                                    <span className="font-bold text-gray-900 text-sm leading-none">{Number(product.rating_avg || 0).toFixed(1)}</span>
                                    <StarRating rating={product.rating_avg} count={0} size="sm" />
                                </div>
                                <a href="#tabs" className="text-sm font-semibold text-[#4C3B8A] hover:underline">
                                    ({product.rating_count} reviews)
                                </a>
                                {product.sold_count > 0 && (
                                    <>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-sm font-medium text-gray-500">
                                            Sold {product.sold_count} times
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Pricing Box */}
                            <div className="mt-4 sm:mt-6 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex flex-wrap items-end gap-3 mb-1">
                                    <CurrencyDisplay amount={displayPrice} className="text-3xl sm:text-4xl font-black text-[#4C3B8A] leading-none tracking-tight" />
                                    
                                    {listPrice && displayPrice < listPrice && (
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <CurrencyDisplay amount={listPrice} className="text-lg text-gray-400 line-through font-semibold" />
                                            {discountPercent > 0 && <DiscountBadge percentage={discountPercent} />}
                                        </div>
                                    )}
                                </div>
                                {listPrice && displayPrice < listPrice && (
                                    <p className="text-sm text-emerald-600 font-bold tracking-wide mt-2 bg-emerald-50 inline-block px-2.5 py-1 rounded-md">
                                        You save ৳{listPrice - displayPrice}
                                    </p>
                                )}
                            </div>

                            {/* Stock Indicator */}
                            <div className="mt-5 mb-1">
                                {isOutOfStock ? (
                                    <p className="text-sm font-bold text-red-500 bg-red-50 inline-block px-3 py-1.5 rounded-full">
                                        ❌ Out of Stock
                                    </p>
                                ) : maxStock <= 5 ? (
                                    <div className="inline-flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full">
                                        <span className="relative flex h-2.5 w-2.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                                        </span>
                                        <p className="text-sm font-bold text-orange-600">Only {maxStock} left! <span className="font-medium text-orange-400/80 hidden sm:inline">— Order soon</span></p>
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> In Stock <span className="text-gray-400 font-medium ml-1">({maxStock} available)</span>
                                    </p>
                                )}
                            </div>

                            <hr className="my-6 border-gray-100" />

                            {/* Variant Selector */}
                            <ProductVariantSelector 
                                variants={product.variants || []}
                                selectedAttributes={selectedAttributes}
                                onAttributeSelect={handleAttributeSelect}
                                errorMode={variantError}
                            />

                            {/* Quantity */}
                            <ProductQuantityStepper 
                                quantity={quantity}
                                setQuantity={setQuantity}
                                maxQuantity={maxStock}
                            />

                            {/* Action Buttons (Desktop Flow) */}
                            <div className="mt-8 hidden sm:flex flex-col gap-3">
                                <Button 
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock || addingToCart}
                                    className="w-full bg-[#1A1A2E] hover:bg-gray-800 text-white h-14 rounded-xl font-bold text-base shadow-sm"
                                >
                                    {addingToCart ? 'Adding to cart...' : isOutOfStock ? 'Unavailable' : 'Add to Cart'}
                                </Button>
                                <Button 
                                    onClick={handleBuyNow}
                                    disabled={isOutOfStock || addingToCart}
                                    className="w-full bg-[#4C3B8A] hover:bg-[#34285e] text-white h-14 rounded-xl font-bold text-base shadow-md"
                                >
                                    Buy Now
                                </Button>
                            </div>

                            <hr className="my-8 border-gray-100 hidden sm:block" />

                            {/* Store Quick Info Row */}
                            <div className="grid grid-cols-2 gap-3 mt-8 sm:mt-0">
                                <div className="bg-white border text-center border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center">
                                    <StoreIcon className="w-5 h-5 text-[#4C3B8A] mb-1.5" />
                                    <span className="text-xs font-bold text-gray-900 truncate max-w-full">{product.store?.name}</span>
                                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">Verified Seller</span>
                                </div>
                                <div className="bg-white border text-center border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center">
                                    <Heart className="w-5 h-5 text-[#4C3B8A] mb-1.5" />
                                    <span className="text-xs font-bold text-gray-900">Quality Verified</span>
                                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">100% Genuine</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6 flex-wrap">
                                <button
                                    onClick={() => isAuthenticated ? toggleWishlist(product.id) : router.push(`/auth/login?redirect=/products/${slug}`)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 border rounded-xl py-3 text-sm font-bold transition-all min-w-[140px]",
                                        isWishlistedState 
                                            ? "border-red-200 text-red-500 bg-red-50 hover:bg-red-100" 
                                            : "border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500 hover:bg-gray-50"
                                    )}
                                >
                                    <Heart className="w-4 h-4" fill={isWishlistedState ? 'currentColor' : 'none'} />
                                    {isWishlistedState ? 'Saved' : 'Wishlist'}
                                </button>
                                <button
                                    onClick={handleChatSeller}
                                    className="flex-1 flex items-center justify-center gap-2 border border-brand-primary/20 bg-brand-light/30 rounded-xl py-3 text-sm font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition-all min-w-[140px]"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Chat with Seller
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex-[0.5] flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors min-w-[80px]"
                                >
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABS SECTION */}
                <div id="tabs" className="bg-white border-y border-gray-100 mt-6 sm:mt-12 py-8 sm:py-12">
                    <div className="max-w-7xl mx-auto px-4 lg:px-6">
                        <Tabs defaultValue="description" className="w-full">
                            
                            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-100 rounded-none mb-8 overflow-x-auto hide-scrollbar snap-x">
                                <TabsTrigger
                                    value="description"
                                    className="snap-start shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#4C3B8A] data-[state=active]:shadow-none rounded-none text-sm sm:text-base font-bold text-gray-500 data-[state=active]:text-[#4C3B8A] px-4 sm:px-8 pb-4 transition-all"
                                >
                                    Description
                                </TabsTrigger>
                                <TabsTrigger
                                    value="reviews"
                                    className="snap-start shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#4C3B8A] data-[state=active]:shadow-none rounded-none text-sm sm:text-base font-bold text-gray-500 data-[state=active]:text-[#4C3B8A] px-4 sm:px-8 pb-4 transition-all"
                                >
                                    Reviews ({product.rating_count})
                                </TabsTrigger>
                                {product.store && (
                                    <TabsTrigger
                                        value="store"
                                        className="snap-start shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#4C3B8A] data-[state=active]:shadow-none rounded-none text-sm sm:text-base font-bold text-gray-500 data-[state=active]:text-[#4C3B8A] px-4 sm:px-8 pb-4 transition-all"
                                    >
                                        Store Info
                                    </TabsTrigger>
                                )}
                                <TabsTrigger
                                    value="shipping"
                                    className="snap-start shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#4C3B8A] data-[state=active]:shadow-none rounded-none text-sm sm:text-base font-bold text-gray-500 data-[state=active]:text-[#4C3B8A] px-4 sm:px-8 pb-4 transition-all"
                                >
                                    Shipping
                                </TabsTrigger>
                                <TabsTrigger
                                    value="qa"
                                    className="snap-start shrink-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#4C3B8A] data-[state=active]:shadow-none rounded-none text-sm sm:text-base font-bold text-gray-500 data-[state=active]:text-[#4C3B8A] px-4 sm:px-8 pb-4 transition-all"
                                >
                                    Q&A
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB: DESCRIPTION */}
                            <TabsContent value="description" className="focus:outline-none animate-in fade-in duration-500">
                                <div className="max-w-4xl">
                                    <div 
                                        className="prose prose-gray max-w-none prose-p:leading-relaxed prose-headings:font-black prose-a:text-[#4C3B8A] prose-ul:list-disc prose-ul:ml-5 prose-li:marker:text-gray-400 text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: product.description || 'No description provided.' }}
                                    />
                                    
                                    {product.tags && product.tags.length > 0 && (
                                        <div className="mt-10 flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-400 mr-2 uppercase tracking-wide">Tags</span>
                                            {product.tags.map((tag: string) => (
                                                <span key={tag} className="bg-[#4C3B8A]/5 text-[#4C3B8A] hover:bg-[#4C3B8A]/10 cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* TAB: REVIEWS */}
                            <TabsContent value="reviews" className="focus:outline-none animate-in fade-in duration-500">
                                <div className="max-w-5xl">
                                    <ProductReviewsTab 
                                        productId={product.id}
                                        productSlug={product.slug}
                                        productName={product.name}
                                    />
                                </div>
                            </TabsContent>

                            {/* TAB: STORE INFO */}
                            {product.store && (
                                <TabsContent value="store" className="focus:outline-none animate-in fade-in duration-500">
                                    <ProductStoreInfoTab store={product.store} />
                                </TabsContent>
                            )}

                            {/* TAB: SHIPPING */}
                            <TabsContent value="shipping" className="focus:outline-none animate-in fade-in duration-500">
                                <ProductShippingTab />
                            </TabsContent>

                            {/* TAB: Q&A */}
                            <TabsContent value="qa" className="focus:outline-none animate-in fade-in duration-500">
                                <div className="max-w-5xl">
                                    <ProductQATab productSlug={product.slug} />
                                </div>
                            </TabsContent>

                        </Tabs>
                    </div>
                </div>

                {/* RELATED PRODUCTS */}
                {product.category && (
                    <RelatedProducts 
                        currentProductId={product.id}
                        categorySlug={product.category.slug}
                        categoryName={product.category.name}
                    />
                )}

            </main>

            {/* MOBILE BOTTOM CART BAR */}
            <StickyCartBar 
                effectivePrice={displayPrice}
                basePrice={listPrice}
                isOutOfStock={isOutOfStock}
                addingToCart={addingToCart}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
            />

        </>
    )
}
