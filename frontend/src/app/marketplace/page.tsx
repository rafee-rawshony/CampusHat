'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Key, Briefcase, Utensils, ArrowRight, Plus } from 'lucide-react'
import { MarketplaceAdCard, MarketplaceListing } from '@/components/marketplace/MarketplaceAdCard'
import { VerificationRequiredCard } from '@/components/auth/VerificationRequiredCard'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { useCampusStore } from '@/stores/campus.store'

// Fallback dummy data while API is unpopulated
const generateDummyListings = (type: 'buy' | 'rental' | 'service' | 'food', count: number): MarketplaceListing[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `dummy-${type}-${i}`,
        title: `Example ${type} Ad ${i + 1}`,
        price: '1500',
        price_unit: type === 'rental' ? 'month' : type === 'service' ? 'hour' : undefined,
        images: [],
        condition: type === 'buy' ? 'USED-GOOD' : undefined,
        post_type: type,
        category: { name: 'Electronics' },
        university_name: 'Daffodil International University',
        user: { first_name: 'John', last_name: 'Doe' },
        created_at: new Date().toISOString(),
        contact_visible: true,
        remaining_interest: type === 'buy' ? 3 : undefined
    }))
}

export default function MarketplaceHomepage() {
    const router = useRouter()
    const { canAccessMarketplace } = useAuthStore()
    const { selectedCampusId } = useCampusStore()
    const [showVerificationCard, setShowVerificationCard] = useState(false)
    const [buyItems, setBuyItems] = useState<MarketplaceListing[]>([])
    const [rentalItems, setRentalItems] = useState<MarketplaceListing[]>([])
    const [serviceItems, setServiceItems] = useState<MarketplaceListing[]>([])
    const [foodItems, setFoodItems] = useState<MarketplaceListing[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMarketplaceData = async () => {
            setLoading(true)
            try {
                // In a real scenario, this would be a specialized summary endpoint
                // or parallel generic requests filtered by type. We'll use parallel.
                const params = selectedCampusId ? { university: selectedCampusId, limit: 4 } : { limit: 4 }

                const [buyRes, rentRes, servRes, foodRes] = await Promise.allSettled([
                    api.get('/marketplace/listings/', { params: { ...params, post_type: 'buy' } }),
                    api.get('/marketplace/listings/', { params: { ...params, post_type: 'rental' } }),
                    api.get('/marketplace/listings/', { params: { ...params, post_type: 'service' } }),
                    api.get('/marketplace/listings/', { params: { ...params, post_type: 'food' } }),
                ])

                setBuyItems(buyRes.status === 'fulfilled' && buyRes.value.data.results?.length > 0 ? buyRes.value.data.results : generateDummyListings('buy', 4))
                setRentalItems(rentRes.status === 'fulfilled' && rentRes.value.data.results?.length > 0 ? rentRes.value.data.results : generateDummyListings('rental', 4))
                setServiceItems(servRes.status === 'fulfilled' && servRes.value.data.results?.length > 0 ? servRes.value.data.results : generateDummyListings('service', 4))
                setFoodItems(foodRes.status === 'fulfilled' && foodRes.value.data.results?.length > 0 ? foodRes.value.data.results : generateDummyListings('food', 4))

            } catch (err) {
                console.error("Failed to fetch marketplace sections", err)
                // Fallbacks on error
                setBuyItems(generateDummyListings('buy', 4))
                setRentalItems(generateDummyListings('rental', 4))
                setServiceItems(generateDummyListings('service', 4))
                setFoodItems(generateDummyListings('food', 4))
            } finally {
                setLoading(false)
            }
        }

        fetchMarketplaceData()
    }, [selectedCampusId])

    const categories = [
        { title: 'Buy', subtitle: 'ITEMS & GOODS', icon: <ShoppingBag className="w-8 h-8 opacity-80" />, bg: 'bg-[#7C3AED]', link: '/marketplace/buy' },
        { title: 'Rental', subtitle: 'HOUSING & TOOLS', icon: <Key className="w-8 h-8 opacity-80" />, bg: 'bg-[#059669]', link: '/marketplace/rental' },
        { title: 'Services', subtitle: 'TUTORING & JOBS', icon: <Briefcase className="w-8 h-8 opacity-80" />, bg: 'bg-[#0891B2]', link: '/marketplace/services' },
        { title: 'Food', subtitle: 'HOMEMADE MEALS', icon: <Utensils className="w-8 h-8 opacity-80" />, bg: 'bg-[#D97706]', link: '/marketplace/food' },
    ]

    return (
        <div className="bg-[#F5F5F5] min-h-screen pb-20">
            {/* HERO SECTION */}
            <section className="bg-white py-16 border-b border-gray-100 mb-8">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A2E] mb-4 tracking-tight">
                        Global Campus Marketplace
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
                        Discover items and services across all university communities. Buy, sell, rent, and connect.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 space-y-12">
                {/* CATEGORY CARDS */}
                <section>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {categories.map((cat, idx) => (
                            <Link href={cat.link} key={idx} className={`${cat.bg} rounded-2xl p-6 text-white hover:scale-[1.02] transition-transform duration-300 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group`}>
                                <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform duration-500">
                                    {cat.icon}
                                </div>
                                <div className="mt-auto">
                                    <h3 className="text-2xl font-black tracking-tight">{cat.title}</h3>
                                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-80 mt-1">{cat.subtitle}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* RECENT ITEMS FOR SALE */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Items for Sale</h2>
                        <Link href="/marketplace/buy" className="text-brand-primary font-semibold text-sm hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-200 animate-pulse h-72 rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {buyItems.map((item) => (
                                <MarketplaceAdCard key={item.id} listing={item} />
                            ))}
                        </div>
                    )}
                </section>

                {/* LATEST RENTAL ADS */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Latest Rental Ads</h2>
                        <Link href="/marketplace/rental" className="text-brand-primary font-semibold text-sm hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-200 animate-pulse h-72 rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {rentalItems.map((item) => (
                                <MarketplaceAdCard key={item.id} listing={item} />
                            ))}
                        </div>
                    )}
                </section>

                {/* AVAILABLE SERVICES */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Available Services</h2>
                        <Link href="/marketplace/services" className="text-brand-primary font-semibold text-sm hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-200 animate-pulse h-72 rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {serviceItems.map((item) => (
                                <MarketplaceAdCard key={item.id} listing={item} />
                            ))}
                        </div>
                    )}
                </section>

                {/* HOMEMADE FOOD & MEALS */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Homemade Food & Meals</h2>
                        <Link href="/marketplace/food" className="text-brand-primary font-semibold text-sm hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-200 animate-pulse h-72 rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {foodItems.map((item) => (
                                <MarketplaceAdCard key={item.id} listing={item} />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* FAB — Mobile only, visible on marketplace pages */}
            <button
                onClick={() => {
                if (!canAccessMarketplace()) {
                    setShowVerificationCard(true)
                    return
                }
                router.push('/marketplace/post')
                }}
                className='fixed sm:hidden z-40
                        right-4 bottom-[76px]
                        w-14 h-14 rounded-full
                        bg-brand-primary text-white
                        shadow-lg shadow-brand-primary/30
                        flex items-center justify-center
                        active:scale-95 transition-transform'
                aria-label='Post new ad'>
                <Plus className='w-7 h-7' />
            </button>

            <VerificationRequiredCard
                isOpen={showVerificationCard}
                onClose={() => setShowVerificationCard(false)}
            />
        </div>
    )
}
