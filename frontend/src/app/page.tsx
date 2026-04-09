'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Flame, Store as StoreIcon, ShoppingBag } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useQuery } from '@tanstack/react-query'

import { api, extractArray } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard, ProductCardSkeleton, Product } from '@/components/mall/ProductCard'
import { CountdownTimer } from '@/components/shared/CountdownTimer'
import { cn } from '@/lib/utils'

// Top Categories Data will be fetched via API

// Mock Banners
const BANNERS = [
  {
    id: 1,
    title: 'Premium Noise Cancelling Headphones',
    subtitle: 'Perfect for uninterrupted study sessions. High fidelity audio.',
    price: '1,250',
    originalPrice: '3,000',
    imageUrl: '/test.jpg', // Will fallback visually since this might not exist
    colorBg: 'bg-[#634C9F]',
  },
  {
    id: 2,
    title: 'Campus Style Winter Collection',
    subtitle: 'Stay warm moving between classes. Up to 40% off today.',
    price: '850',
    originalPrice: '1,500',
    imageUrl: '', // Intentional blank to test gradients
    colorBg: 'bg-emerald-600',
  },
  {
    id: 3,
    title: 'Essential Lab Equipment Kit',
    subtitle: 'Everything you need for Chemistry 101. Certified stock.',
    price: '2,100',
    originalPrice: '2,800',
    imageUrl: '',
    colorBg: 'bg-blue-600',
  }
]

interface MallCategory {
  id?: string | number
  slug: string
  name: string
  icon_url?: string
  image_url?: string
}

interface FeaturedSeller {
  id: string | number
  slug: string
  store_name: string
  logo_url?: string
  profile_picture?: string
  color?: string
}

export default function MallHomePage() {
  // Query Data
  const { data: flashSaleData, isLoading: flashLoading } = useQuery({
    queryKey: ['flash-sales'],
    queryFn: () => api.get('/mall/flash-sales/active/').then(r => extractArray<Product>(r.data)),
    staleTime: 60_000,
  })

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['mall-categories'],
    queryFn: () => api.get('/mall/categories/').then(r => extractArray<MallCategory>(r.data)),
    staleTime: 300_000,
  })

  const { data: featuredSellers, isLoading: sellersLoading } = useQuery({
    queryKey: ['featured-sellers'],
    queryFn: () => api.get('/sellers/featured/').then(r => extractArray<FeaturedSeller>(r.data)),
    staleTime: 300_000,
  })

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['mall-products'],
    queryFn: () => api.get('/mall/products/?page=1&page_size=12').then(r => extractArray<Product>(r.data)),
    staleTime: 60_000,
  })

  // Carousel Hooks
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: true })])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', () => setSelectedIndex(emblaApi.selectedScrollSnap()))
  }, [emblaApi])

  // No mocked use-effect fetching

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-20 pt-4 md:pt-8 w-full overflow-x-hidden">

      {/* SECTION 1: HERO BANNER (Carousel) */}
      <div className="container mx-auto px-4 mb-12">
        <div className="relative rounded-3xl overflow-hidden shadow-xl" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {BANNERS.map((banner) => (
              <div key={banner.id} className="flex-[0_0_100%] min-w-0">
                <div className={cn("flex flex-col md:flex-row min-h-[400px] w-full relative", banner.colorBg)}>

                  {/* Left Content */}
                  <div className="flex-1 p-8 md:p-14 flex flex-col justify-center text-white z-10 relative">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none self-start mb-6 px-3 py-1 text-xs">
                      Student Exclusive Offer
                    </Badge>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-6 tracking-tight max-w-xl">
                      {banner.title}
                    </h2>
                    <p className="text-white/80 text-lg mb-8 max-w-md">
                      {banner.subtitle}
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl md:text-4xl font-bold">৳{banner.price}</span>
                        <span className="text-lg text-white/50 line-through">৳{banner.originalPrice}</span>
                      </div>
                      <Button size="lg" className="rounded-full bg-white text-gray-900 hover:bg-gray-100 px-8 h-12 text-md shadow-lg font-bold">
                        Shop Now
                      </Button>
                    </div>
                    <p className="text-xs text-white/50 font-medium">Limited time student discount • Verified campus delivery</p>
                  </div>

                  {/* Right Image/Graphic Area */}
                  <div className="hidden md:flex flex-1 relative items-center justify-center p-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent z-0"></div>
                    {/* Abstract Shapes built with Tailwind instead of breaking if image lacks */}
                    <div className="w-72 h-72 rounded-full bg-white/10 blur-3xl absolute top-10 right-10"></div>
                    <div className="w-64 h-64 rounded-full bg-black/10 blur-3xl absolute bottom-10 left-10"></div>

                    <div className="relative z-10 w-full max-w-sm aspect-square bg-white/10 rounded-full border border-white/20 shadow-2xl backdrop-blur-sm flex items-center justify-center">
                      <span className="text-8xl">🎓</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {BANNERS.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  selectedIndex === index ? "bg-white w-8" : "bg-white/50 hover:bg-white/80"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: FLASH SALE */}
      <div className="container mx-auto px-4 mb-14">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-red-500 fill-red-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Flash Sell</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 hidden sm:inline">Ends in:</span>
              <CountdownTimer targetDate={new Date(new Date().getTime() + 2 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString()} />
            </div>
          </div>
          <Link href="/mall/flash-sales" className="text-brand-primary font-bold hover:underline group flex items-center text-sm">
            View All <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          <div className="flex gap-4 sm:gap-6 min-w-max">
            {flashLoading
              ? Array(6).fill(null).map((_, i) => (
                <div key={i} className="w-[180px] sm:w-[220px] md:w-[240px] shrink-0">
                  <ProductCardSkeleton />
                </div>
              ))
              : (flashSaleData || []).map((product) => (
                <div key={product.id} className="w-[180px] sm:w-[220px] md:w-[240px] shrink-0">
                  <ProductCard product={product} />
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* SECTION 3: TOP CATEGORIES */}
      <div className="container mx-auto px-4 mb-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Top Categories</h2>
          <Link href="/mall/categories" className="text-brand-primary font-bold hover:underline group flex items-center text-sm">
            All Categories <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 lg:justify-between gap-4 min-w-max sm:min-w-0">
            {categoriesLoading ? (
              Array(10).fill(null).map((_, i) => (
                <div key={i} className="group flex flex-col items-center gap-3 w-24 shrink-0 animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-2xl shadow-sm border border-gray-100"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded text-center"></div>
                </div>
              ))
            ) : (categoriesData || []).map((cat, i: number) => {
              const categoryImage = cat.icon_url ?? cat.image_url
              return (
                <Link key={cat.id || i} href={`/mall/category/${cat.slug}`} className="group flex flex-col items-center gap-3 w-24 shrink-0">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center group-hover:bg-brand-light/30 group-hover:border-brand-primary/30 transition-all duration-300 group-hover:-translate-y-1 overflow-hidden relative">
                    {categoryImage ? (
                      <Image src={categoryImage} alt={cat.name} fill className="object-cover" />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-gray-600 group-hover:text-brand-primary transition-colors" strokeWidth={1.5} />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-center text-gray-700 leading-tight group-hover:text-brand-primary transition-colors">
                    {cat.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: BEST SELLERS (STORES) */}
      <div className="bg-white py-12 mb-16 border-y border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2 flex items-center justify-center gap-3">
            <StoreIcon className="h-6 w-6 text-emerald-500" /> Official Best Sellers
          </h2>
          <p className="text-gray-500 mb-10 text-sm">Top rated stores across completely verified campus vendors.</p>

          <div className="flex justify-center gap-6 md:gap-12 flex-wrap">
            {sellersLoading ? (
              Array(5).fill(null).map((_, i) => (
                 <div key={i} className="group flex flex-col items-center gap-3 w-24 md:w-32 animate-pulse">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                 </div>
              ))
              ) : (featuredSellers || []).map((store) => {
                const storeImage = store.logo_url ?? store.profile_picture
                return (
              <Link key={store.id} href={`/sellers/${store.slug}`} className="group flex flex-col items-center gap-3 w-24 md:w-32">
                <div className={cn(
                  "w-20 h-20 md:w-24 md:h-24 rounded-full relative flex items-center justify-center text-2xl md:text-3xl font-black text-white shadow-md ring-4 ring-white group-hover:ring-brand-light transition-all duration-300 group-hover:scale-105 overflow-hidden",
                  store.color || 'bg-brand-primary'
                )}>
                  {storeImage ? (
                    <Image src={storeImage} alt={store.store_name} fill className="object-cover" />
                  ) : (
                    (store.store_name?.substring(0, 2).toUpperCase() || 'ST')
                  )}
                </div>
                <span className="font-bold text-gray-900 text-sm md:text-base text-center line-clamp-1 group-hover:text-brand-primary transition-colors">
                  {store.store_name}
                </span>
              </Link>
                )
              })}
          </div>
        </div>
      </div>

      {/* SECTION 5: OUR PRODUCTS */}
      <div className="container mx-auto px-4 mb-20">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Our Products</h2>
          <p className="text-gray-500 mt-2">Discover completely verified, quality listings ready for checkout.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
          {productsLoading
            ? Array(12).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
            : (productsData || []).map((product) => <ProductCard key={product.id} product={product} />)
          }
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" className="border-gray-200 shadow-sm rounded-xl px-12 py-6 font-bold text-gray-700 hover:text-brand-primary hover:bg-gray-50">
            Load More Products
          </Button>
        </div>
      </div>

      {/* Newsletter is handled globally in Footer.tsx per Phase 02 spec, so no need to duplicate here */}
    </div>
  )
}
