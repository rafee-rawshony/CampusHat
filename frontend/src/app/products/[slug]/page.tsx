'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
    Heart,
    Minus,
    Plus,
    ShieldCheck,
    Truck,
    RotateCcw,
    ChevronRight,
    Home,
    MessageSquare,
    Store as StoreIcon
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import { api } from '@/lib/api'
import { useCartStore } from '@/stores/cart.store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StarRating } from '@/components/shared/StarRating'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { cn } from '@/lib/utils'

// Types based on expected API
interface Variant {
    id: string
    sku: string
    price: string
    stock_quantity: number
    attributes: Record<string, string> // e.g. { "Color": "Red", "Size": "M" }
}

interface ProductDetail {
    id: string
    slug: string
    name: string
    description: string
    base_price: string
    discount_price?: string | null
    stock_quantity: number
    has_variants: boolean
    variants: Variant[]
    category: {
        id: string
        name: string
        slug: string
    }
    seller: {
        id: string
        store_name: string
        slug: string
        rating: number
        followers_count: number
    }
    images: { id: string, image_url: string, is_primary: boolean }[]
    rating_avg: number
    rating_count: number
    tags: string[]
}

export default function ProductDetailPage() {
    const { slug } = useParams()
    const router = useRouter()
    const { addItem } = useCartStore()

    const [product, setProduct] = useState<ProductDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Interactive State
    const [activeImage, setActiveImage] = useState<string>('')
    const [quantity, setQuantity] = useState(1)
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
    const [activeVariant, setActiveVariant] = useState<Variant | null>(null)
    const [isWishlisted, setIsWishlisted] = useState(false)

    // Derived Variants UI Mappings (extracting available Colors, Sizes, etc.)
    const availableAttributes = product?.variants?.reduce((acc, v) => {
        Object.entries(v.attributes).forEach(([key, val]) => {
            if (!acc[key]) acc[key] = new Set()
            acc[key].add(val)
        })
        return acc
    }, {} as Record<string, Set<string>>)

    // Fetch Details
    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true)
            try {
                // If API is down, provide a high fidelity mock matching the data structure
                const { data } = await api.get(`/mall/products/${slug}/`).catch(() => ({
                    data: {
                        id: `prod-${slug}`,
                        slug: slug as string,
                        name: 'Premium Wireless Over-Ear Headphones',
                        description: `
                            <p>Experience studio-quality sound with our premium wireless headphones. Designed specifically for long study sessions, featuring ultra-soft ear cushions and active noise cancellation (ANC).</p>
                            <ul>
                                <li>Up to 40 hours battery life</li>
                                <li>Bluetooth 5.2 multi-point connection</li>
                                <li>Built-in microphone for clear calls</li>
                            </ul>
                        `,
                        base_price: '2500.00',
                        discount_price: '1990.00',
                        stock_quantity: 45,
                        has_variants: true,
                        variants: [
                            { id: 'v1', sku: 'HP-BLK', price: '1990.00', stock_quantity: 20, attributes: { 'Color': 'Midnight Black' } },
                            { id: 'v2', sku: 'HP-SLV', price: '2100.00', stock_quantity: 15, attributes: { 'Color': 'Lunar Silver' } },
                            { id: 'v3', sku: 'HP-BLU', price: '1990.00', stock_quantity: 10, attributes: { 'Color': 'Navy Blue' } },
                        ],
                        category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
                        seller: { id: 's1', store_name: 'TechHub AU', slug: 'techhub', rating: 4.8, followers_count: 1250 },
                        images: [
                            { id: 'img1', image_url: '/img-placeholder.jpg', is_primary: true },
                            { id: 'img2', image_url: '/img-placeholder-2.jpg', is_primary: false },
                            { id: 'img3', image_url: '/img-placeholder-3.jpg', is_primary: false },
                        ],
                        rating_avg: 4.6,
                        rating_count: 128,
                        tags: ['gadgets', 'audio', 'study-essential']
                    }
                }))

                setProduct(data)

                // Set initial image
                const primary = data.images?.find((img: any) => img.is_primary)?.image_url
                setActiveImage(primary || data.images?.[0]?.image_url || '')

                // Auto-select first variant if exists
                if (data.has_variants && data.variants && data.variants.length > 0) {
                    setSelectedAttributes(data.variants[0].attributes)
                    setActiveVariant(data.variants[0])
                }

            } finally {
                setIsLoading(false)
            }
        }
        fetchProduct()
    }, [slug])

    // Update active variant when selections change
    useEffect(() => {
        if (!product || !product.has_variants) return

        const matched = product.variants.find(v => {
            return Object.entries(selectedAttributes).every(([k, val]) => v.attributes[k] === val)
        })

        if (matched) {
            setActiveVariant(matched)
            setQuantity(1) // Reset quantity on variant change
        } else {
            setActiveVariant(null)
        }
    }, [selectedAttributes, product])

    const handleAttributeSelect = (key: string, value: string) => {
        setSelectedAttributes(prev => ({ ...prev, [key]: value }))
    }

    const handleAddToCart = () => {
        if (!product) return

        let finalPrice = product.discount_price || product.base_price
        let variantId = undefined
        let variantInfo = undefined

        if (product.has_variants) {
            if (!activeVariant) {
                toast.error('Please select all options before adding to cart.')
                return
            }
            if (activeVariant.stock_quantity < quantity) {
                toast.error('Not enough stock available for this variation.')
                return
            }
            finalPrice = activeVariant.price
            variantId = activeVariant.id
            variantInfo = activeVariant.attributes
        } else {
            if (product.stock_quantity < quantity) {
                toast.error('Not enough stock available.')
                return
            }
        }

        addItem({
            id: crypto.randomUUID(),
            product_id: product.id,
            name: product.name,
            slug: product.slug,
            price: finalPrice,
            image_url: activeImage,
            quantity: quantity,
            variant_id: variantId,
            variant_info: variantInfo
        })

        toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to your cart`)
    }

    const handleBuyNow = () => {
        handleAddToCart()
        // Assuming there is a checkout or cart drawer to open/push to
        // For now let's just open the cart
        useCartStore.getState().setIsOpen(true)
    }

    if (isLoading) {
        return <div className="min-h-screen bg-surface-base animate-pulse py-12 px-4 flex justify-center"><div className="w-full max-w-6xl h-[600px] bg-white rounded-2xl"></div></div>
    }

    if (!product) {
        return <div className="text-center py-20 text-gray-500">Product not found.</div>
    }

    // Calculations
    const currentPrice = product.has_variants
        ? (activeVariant ? activeVariant.price : product.base_price)
        : (product.discount_price || product.base_price)

    const originalPrice = product.has_variants ? null : product.base_price

    // Safety boundaries for Stock
    const maxStock = product.has_variants ? (activeVariant?.stock_quantity || 0) : product.stock_quantity
    const isOutOfStock = maxStock === 0

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-20 pt-6">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* BREADCRUMB */}
                <nav className="flex items-center text-sm text-gray-500 mb-6 gap-2">
                    <Link href="/" className="hover:text-brand-primary transition-colors flex items-center">
                        <Home className="h-4 w-4" />
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <Link href={`/mall/category/${product.category.slug}`} className="hover:text-brand-primary transition-colors">
                        {product.category.name}
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-none">{product.name}</span>
                </nav>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-100 mb-10">

                    {/* LEFT: Image Gallery */}
                    <div className="lg:col-span-5 flex flex-col gap-4 relative">
                        {/* Status Badges Overlaid */}
                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                            {isOutOfStock && <Badge variant="secondary" className="bg-gray-900 text-white font-bold">Out of Stock</Badge>}
                            {(!isOutOfStock && maxStock < 10) && <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Only {maxStock} left!</Badge>}
                        </div>

                        {/* Main Image */}
                        <div className="aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center relative group">
                            {activeImage ? (
                                <Image
                                    src={activeImage}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <span className="text-6xl text-gray-200">{product.name.charAt(0)}</span>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                {product.images.map((img) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setActiveImage(img.image_url)}
                                        className={cn(
                                            "h-20 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                                            activeImage === img.image_url ? "border-brand-primary shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <div className="w-full h-full relative bg-gray-50">
                                            <Image src={img.image_url} alt="Thumbnail" fill className="object-cover" unoptimized />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Product Info */}
                    <div className="lg:col-span-7 flex flex-col">

                        {/* Title & Ratings */}
                        <div className="mb-6">
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-3">
                                {product.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md text-gray-600 font-medium">
                                    <StarRating rating={product.rating_avg} count={0} /> {product.rating_avg}
                                </span>
                                <a href="#reviews" className="text-brand-primary hover:underline font-medium">
                                    {product.rating_count} Reviews
                                </a>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500 flex items-center gap-1">
                                    <StoreIcon className="h-4 w-4" />
                                    Sold by: <Link href={`/sellers/${product.seller.slug}`} className="text-brand-primary hover:underline font-bold">{product.seller.store_name}</Link>
                                </span>
                            </div>
                        </div>

                        <hr className="border-gray-100 mb-6" />

                        {/* Pricing */}
                        <div className="mb-8">
                            <div className="flex items-end gap-3 mb-2">
                                <CurrencyDisplay amount={parseFloat(currentPrice)} className="text-4xl font-black text-gray-900" />
                                {originalPrice && parseFloat(originalPrice) > parseFloat(currentPrice) && (
                                    <CurrencyDisplay amount={parseFloat(originalPrice)} className="text-xl text-gray-400 line-through font-medium mb-1" />
                                )}
                            </div>

                            {originalPrice && parseFloat(originalPrice) > parseFloat(currentPrice) && (
                                <div className="inline-flex bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                                    SAVE ৳{parseFloat(originalPrice) - parseFloat(currentPrice)} ({Math.round(((parseFloat(originalPrice) - parseFloat(currentPrice)) / parseFloat(originalPrice)) * 100)}%)
                                </div>
                            )}
                        </div>

                        {/* Variants Selector */}
                        {product.has_variants && availableAttributes && (
                            <div className="space-y-6 mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                {Object.entries(availableAttributes).map(([attrName, attrValues]) => (
                                    <div key={attrName}>
                                        <h3 className="text-sm font-bold text-gray-900 mb-3">{attrName}: <span className="font-normal text-brand-primary">{selectedAttributes[attrName]}</span></h3>
                                        <div className="flex flex-wrap gap-3">
                                            {Array.from(attrValues).map(val => {
                                                const isSelected = selectedAttributes[attrName] === val
                                                return (
                                                    <button
                                                        key={val}
                                                        onClick={() => handleAttributeSelect(attrName, val)}
                                                        className={cn(
                                                            "px-4 py-2 border rounded-xl text-sm font-medium transition-all",
                                                            isSelected
                                                                ? "border-brand-primary bg-brand-light/20 text-brand-primary shadow-sm"
                                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                                                        )}
                                                    >
                                                        {val}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quantity & Actions Row */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl h-14 p-1 w-full sm:w-32 shrink-0">
                                <button
                                    className="flex-1 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1 || isOutOfStock}
                                >
                                    <Minus className="h-5 w-5" />
                                </button>
                                <div className="w-10 text-center font-bold text-gray-900 select-none">
                                    {quantity}
                                </div>
                                <button
                                    className="flex-1 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                    onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                                    disabled={quantity >= maxStock || isOutOfStock}
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>

                            <Button
                                className="flex-1 h-14 text-lg font-bold bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white shadow-md active:scale-[0.98] transition-all"
                                onClick={handleAddToCart}
                                disabled={isOutOfStock || (product.has_variants && !activeVariant)}
                            >
                                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className={cn("h-14 w-14 shrink-0 rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-500 transition-colors", isWishlisted && "text-red-500 bg-red-50 border-red-100")}
                                onClick={() => setIsWishlisted(!isWishlisted)}
                            >
                                <Heart className="h-6 w-6" fill={isWishlisted ? 'currentColor' : 'none'} />
                            </Button>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0" />
                                <div className="text-xs">
                                    <p className="font-bold text-gray-900">Verified Seller</p>
                                    <p className="text-gray-500">Student/Faculty authenticated</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                <Truck className="h-6 w-6 text-blue-500 shrink-0" />
                                <div className="text-xs">
                                    <p className="font-bold text-gray-900">On-Campus Delivery</p>
                                    <p className="text-gray-500">Fast local exchange</p>
                                </div>
                            </div>
                        </div>

                        {/* Short Note/Tags */}
                        <div className="mt-auto">
                            <div className="flex gap-2 flex-wrap">
                                {product.tags.map(tag => (
                                    <span key={tag} className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">#{tag}</span>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* BOTTOM TABBED SECTION */}
                <div id="details" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8">
                    <Tabs defaultValue="description" className="w-full">
                        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200 rounded-none mb-8 overflow-x-auto">
                            <TabsTrigger
                                value="description"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-brand-primary data-[state=active]:shadow-none rounded-none text-base font-bold text-gray-500 data-[state=active]:text-brand-primary px-6 pb-4"
                            >
                                Description
                            </TabsTrigger>
                            <TabsTrigger
                                value="reviews"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-brand-primary data-[state=active]:shadow-none rounded-none text-base font-bold text-gray-500 data-[state=active]:text-brand-primary px-6 pb-4"
                            >
                                Reviews ({product.rating_count})
                            </TabsTrigger>
                            <TabsTrigger
                                value="shipping"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-brand-primary data-[state=active]:shadow-none rounded-none text-base font-bold text-gray-500 data-[state=active]:text-brand-primary px-6 pb-4"
                            >
                                Shipping & Returns
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="description" className="focus:outline-none">
                            <div className="prose prose-gray max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-brand-primary prose-ul:list-disc prose-ul:ml-4"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        </TabsContent>

                        <TabsContent value="reviews" id="reviews" className="focus:outline-none">
                            <div className="flex flex-col md:flex-row gap-12">
                                {/* Summary block */}
                                <div className="md:w-1/3 shrink-0">
                                    <h3 className="text-xl font-bold mb-4">Customer Reviews</h3>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="text-5xl font-black text-gray-900">{product.rating_avg.toFixed(1)}</div>
                                        <div>
                                            <StarRating rating={product.rating_avg} count={0} />
                                            <div className="text-sm text-gray-500 mt-1">Based on {product.rating_count} reviews</div>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full font-bold">Write a Review</Button>
                                    <p className="text-xs text-center text-gray-400 mt-3">Only verified buyers can review</p>
                                </div>
                                {/* Feed block */}
                                <div className="md:w-2/3 space-y-6">
                                    <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
                                        <p className="font-semibold text-gray-700">Detailed reviews component pending mapping.</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="shipping" className="focus:outline-none">
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold flex items-center gap-2 mb-3"><Truck className="h-5 w-5 text-gray-400" /> Delivery Options</h3>
                                    <ul className="space-y-3 text-sm text-gray-600">
                                        <li className="flex justify-between border-b pb-2"><span>On-Campus Meetup</span> <span className="font-bold text-emerald-600">Free</span></li>
                                        <li className="flex justify-between border-b pb-2"><span>Standard Delivery (2-3 days)</span> <span className="font-bold">৳60</span></li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-bold flex items-center gap-2 mb-3"><RotateCcw className="h-5 w-5 text-gray-400" /> Return Policy</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Returns accepted within 3 days of delivery if the item acts contrary to the description. Product must be in identical condition. Contact the seller directly via chat to initiate.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Mobile sticky bottom bar — hidden on sm+ */}
            <div className='fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t px-4 py-3 flex gap-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'>
                <div className='flex-1 overflow-hidden'>
                    <p className='text-xs text-gray-500'>Price</p>
                    <p className='font-bold text-brand-primary text-lg truncate'>
                        ৳{parseFloat(currentPrice).toLocaleString()}
                    </p>
                </div>
                <button onClick={handleAddToCart}
                    className='px-4 border-2 border-brand-primary text-brand-primary font-bold py-2 rounded-xl text-sm'>
                    Add to Cart
                </button>
                <button onClick={handleBuyNow}
                    className='px-6 bg-brand-primary text-white font-bold py-2 rounded-xl text-sm shadow-md'>
                    Buy Now
                </button>
            </div>
        </div>
    )
}
