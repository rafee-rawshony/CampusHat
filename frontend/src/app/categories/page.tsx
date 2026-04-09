'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ChevronRight, ShoppingBag } from 'lucide-react'

export default function CategoriesPage() {
    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () => api.get('/mall/categories/').then(r => r.data?.data?.results || r.data?.results || r.data?.data || r.data || []),
        staleTime: 300_000,
    })

    const categories = categoriesData || []

    return (
        <div className="bg-[#F5F5F5] min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Breadcrumbs */}
                <div className="flex items-center text-xs font-bold text-gray-400 gap-2 mb-6">
                    <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-900">All Categories</span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-8">All Categories</h1>

                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {Array(12).fill(null).map((_, i) => (
                                <div key={i} className="group flex flex-col items-center gap-3 animate-pulse">
                                    <div className="w-24 h-24 bg-gray-200 rounded-2xl"></div>
                                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {categories.map((cat: any) => (
                                <Link 
                                    key={cat.id || cat.slug} 
                                    href={`/categories/${cat.slug}`} 
                                    className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center group-hover:bg-brand-light/20 group-hover:border-brand-primary/30 transition-all duration-300 group-hover:-translate-y-1 overflow-hidden relative">
                                        {cat.icon_url || cat.image_url ? (
                                            <Image src={cat.icon_url || cat.image_url} alt={cat.name} fill className="object-cover" />
                                        ) : (
                                            <ShoppingBag className="h-10 w-10 text-gray-400 group-hover:text-brand-primary transition-colors" strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold text-center text-gray-700 leading-tight group-hover:text-brand-primary transition-colors">
                                        {cat.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!isLoading && categories.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No categories found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
