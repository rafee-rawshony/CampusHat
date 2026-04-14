'use client'

import Link from 'next/link'
import Image from 'next/image'
import * as LucideIcons from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Category {
    id: string
    name: string
    slug: string
    icon: string
    icon_url?: string | null
    display_order: number
}

export function TopCategoriesSection() {
    const { data: categoriesRaw, isLoading } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: async () => {
            const res = await api.get('/mall/categories/', { params: { is_active: true } })
            const d = res.data?.data ?? res.data
            return Array.isArray(d) ? d : (d?.results ?? [])
        },
        staleTime: 300_000,
    })

    const categories: Category[] = categoriesRaw || []
    const displayCategories = categories.sort((a, b) => a.display_order - b.display_order).slice(0, 9)

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-xl text-gray-900">Top Categories</h2>
                <Link href="/categories" className="text-[#4C3B8A] text-sm font-semibold hover:underline">
                    View All →
                </Link>
            </div>

            {/* Grid / Horizontal Scroll */}
            <div className="flex sm:grid sm:grid-cols-5 md:grid-cols-9 gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {isLoading
                    ? Array(9).fill(null).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 w-[80px] shrink-0 sm:w-auto">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-200 animate-pulse" />
                            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                        </div>
                    ))
                    : displayCategories.map((cat) => {
                        // Dynamically resolve icon or fallback to Package
                        const Icon = (LucideIcons as any)[cat.icon] ?? LucideIcons.Package
                        
                        return (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                className="flex flex-col items-center gap-2 w-[80px] shrink-0 sm:w-auto group"
                            >
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center group-hover:border-[#4C3B8A] group-hover:shadow-md transition relative overflow-hidden">
                                    {cat.icon_url ? (
                                        <Image src={cat.icon_url} alt={cat.name} fill className="object-cover" sizes="56px" />
                                    ) : (
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4C3B8A]" />
                                    )}
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-gray-600 text-center line-clamp-2 group-hover:text-[#4C3B8A] transition leading-tight">
                                    {cat.name}
                                </span>
                            </Link>
                        )
                    })
                }
            </div>
        </div>
    )
}
