'use client'

import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Category {
    id: string
    name: string
    slug: string
    icon?: string | null
    icon_url?: string | null
    display_order: number
    parent?: string | null
}

// Palette of soft tinted backgrounds cycling through categories
const ICON_BG_COLORS = [
    'bg-[#4C3B8A]/10 text-[#4C3B8A]',
    'bg-emerald-100 text-emerald-700',
    'bg-sky-100 text-sky-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700',
    'bg-teal-100 text-teal-700',
    'bg-orange-100 text-orange-700',
]

const isImageUrl = (v?: string | null) =>
    !!v && (v.startsWith('http') || v.startsWith('https') || v.startsWith('/'))

export function TopCategoriesSection() {
    const { data: categoriesRaw, isLoading } = useQuery({
        queryKey: ['mall-top-categories'],
        queryFn: async () => {
            const res = await api.get('/mall/categories/', { params: { is_active: true } })
            const d = res.data?.data ?? res.data
            return Array.isArray(d) ? d : (d?.results ?? [])
        },
        staleTime: 300_000,
    })

    // Only root (parent) categories, sorted by display_order
    const displayCategories: Category[] = (categoriesRaw || [])
        .filter((c: Category) => !c.parent)
        .sort((a: Category, b: Category) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .slice(0, 8)

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-xl text-gray-900">Top Categories</h2>
                <Link href="/categories" className="text-[#4C3B8A] text-sm font-semibold hover:underline">
                    View All →
                </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
                {isLoading
                    ? Array(8).fill(null).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2.5">
                            <div className="w-full aspect-square rounded-2xl bg-gray-100 animate-pulse" />
                            <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ))
                    : displayCategories.map((cat, idx) => {
                        const colorClass = ICON_BG_COLORS[idx % ICON_BG_COLORS.length]
                        const Icon = (LucideIcons as any)[cat.icon ?? ''] ?? LucideIcons.Package
                        const hasImage = isImageUrl(cat.icon_url)

                        return (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                className="flex flex-col items-center gap-2 group"
                            >
                                {/* Icon box */}
                                <div className={`w-full aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-200 group-hover:scale-105 group-hover:shadow-md ${hasImage ? 'bg-white border border-gray-100' : colorClass}`}>
                                    {hasImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={cat.icon_url!}
                                            alt={cat.name}
                                            className="w-3/5 h-3/5 object-contain"
                                        />
                                    ) : (
                                        <Icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={1.8} />
                                    )}
                                </div>

                                {/* Label */}
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-600 text-center line-clamp-2 leading-tight group-hover:text-[#4C3B8A] transition-colors px-0.5">
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
