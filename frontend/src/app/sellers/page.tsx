'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ChevronRight, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SellersPage() {
    const { data: storesData, isLoading } = useQuery({
        queryKey: ['all-stores'],
        queryFn: () => api.get('/stores/').then(r => { const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; return Array.isArray(res) ? res : [] }),
        staleTime: 300_000,
    })

    const stores = storesData || []

    return (
        <div className="bg-[#F5F5F5] min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Breadcrumbs */}
                <div className="flex items-center text-xs font-bold text-gray-400 gap-2 mb-6">
                    <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-900">All Sellers</span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
                        <Store className="w-8 h-8 text-brand-primary" />
                        Official Sellers & Stores
                    </h1>

                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                            {Array(12).fill(null).map((_, i) => (
                                <div key={i} className="group flex flex-col items-center gap-4 animate-pulse">
                                    <div className="w-24 h-24 rounded-full bg-gray-200"></div>
                                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                            {stores.map((store: any) => (
                                <Link 
                                    key={store.id} 
                                    href={`/sellers/${store.slug}`} 
                                    className="group flex flex-col items-center gap-4"
                                >
                                    <div className={cn(
                                        "w-24 h-24 rounded-full relative flex items-center justify-center text-3xl font-black text-white shadow-md ring-4 ring-white group-hover:ring-brand-light transition-all duration-300 group-hover:scale-105 overflow-hidden",
                                        store.color || 'bg-brand-primary'
                                    )}>
                                        {store.logo_url || store.profile_picture ? (
                                            <Image src={store.logo_url || store.profile_picture} alt={store.store_name} fill className="object-cover" />
                                        ) : (
                                            (store.store_name?.substring(0, 2).toUpperCase() || 'ST')
                                        )}
                                    </div>
                                    <span className="font-bold text-gray-900 text-center line-clamp-2 group-hover:text-brand-primary transition-colors">
                                        {store.store_name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!isLoading && stores.length === 0 && (
                        <div className="text-center py-16">
                            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">No sellers found</h3>
                            <p className="text-gray-500">There are currently no active sellers matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
