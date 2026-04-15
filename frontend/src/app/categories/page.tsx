'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ChevronRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CategoriesRootPage() {
    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () =>
            api.get('/mall/categories/').then(r => {
                const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data
                return Array.isArray(res) ? res : []
            }),
        staleTime: 300_000,
    })

    const categories: any[] = categoriesData || []

    return (
        <div className="bg-[#F5F5F5] min-h-screen py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Breadcrumb */}
                <div className="flex items-center text-xs font-semibold text-gray-400 gap-2 mb-5">
                    <Link href="/" className="hover:text-[#4C3B8A] transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-700">Categories</span>
                </div>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="font-bold text-2xl text-gray-900">Product Categories</h1>
                    <p className="text-sm text-gray-500 mt-1">Browse all categories available on CampusHat Mall</p>
                </div>

                {/* Category Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array(10).fill(0).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 h-[140px] animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <p className="text-gray-400 text-sm">No categories found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {categories.map((cat: any) => {
                            const IconComp = cat.icon ? (LucideIcons as any)[cat.icon] : null
                            return (
                                <Link
                                    key={cat.id || cat.slug}
                                    href={`/categories/${cat.slug}`}
                                    className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-[#4C3B8A]/30 transition-all cursor-pointer flex flex-col items-center text-center gap-3"
                                >
                                    <div className="w-16 h-16 bg-[#4C3B8A]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#4C3B8A]/15 transition-colors">
                                        {IconComp ? (
                                            <IconComp className="w-8 h-8 text-[#4C3B8A]" />
                                        ) : (
                                            <LucideIcons.Tag className="w-8 h-8 text-[#4C3B8A]" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm leading-tight">{cat.name}</p>
                                        {cat.product_count !== undefined && (
                                            <p className="text-xs text-gray-400 mt-1">{cat.product_count} products</p>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
