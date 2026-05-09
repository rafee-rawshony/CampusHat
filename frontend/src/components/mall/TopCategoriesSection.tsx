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
        .slice(0, 10)

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                {/* Header */}
                <div className="flex items-end justify-between mb-5">
                    <div>
                        <h2 className="font-bold text-xl text-gray-900 leading-tight">Top Categories</h2>
                        <p className="text-xs text-gray-400 mt-1">New products with updated stocks.</p>
                    </div>
                    <Link href="/categories" className="text-[#4C3B8A] text-sm font-semibold hover:underline shrink-0 border border-gray-200 rounded-full px-4 py-1.5">
                        View All →
                    </Link>
                </div>

                {/* Grid — equally distributed cells in a single row on desktop */}
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
                    {isLoading
                        ? Array(10).fill(null).map((_, i) => (
                            <div key={i} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse" />
                                <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
                            </div>
                        ))
                        : displayCategories.map((cat) => {
                            const Icon = (LucideIcons as any)[cat.icon ?? ''] ?? LucideIcons.Package
                            const hasImage = isImageUrl(cat.icon_url)

                            return (
                                <Link
                                    key={cat.id}
                                    href={`/categories/${cat.slug}`}
                                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-[#4C3B8A] hover:shadow-md transition-all duration-200 group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#4C3B8A]/10 transition-colors">
                                        {hasImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={cat.icon_url!}
                                                alt={cat.name}
                                                className="w-6 h-6 object-contain"
                                            />
                                        ) : (
                                            <Icon className="w-5 h-5 text-[#4C3B8A]" strokeWidth={1.8} />
                                        )}
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700 text-center line-clamp-2 leading-tight group-hover:text-[#4C3B8A] transition-colors">
                                        {cat.name}
                                    </span>
                                </Link>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}
