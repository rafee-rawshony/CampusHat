'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import * as LucideIcons from 'lucide-react'

export default function CategoriesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    // Extract the active slug from the URL: /categories/[slug]
    const activeSlug = pathname.startsWith('/categories/') ? pathname.split('/')[2] : null

    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () => api.get('/mall/categories/').then(r => { 
            const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data; 
            return Array.isArray(res) ? res : [] 
        }),
        staleTime: 300_000,
    })

    const categories = categoriesData || []

    return (
        <div className="bg-[#F5F5F5] min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8">
                
                {/* LEFT SIDEBAR: Categories List */}
                <aside className="w-full md:w-[260px] shrink-0 space-y-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h2 className="font-black text-gray-900 text-lg mb-4">Product Categories</h2>
                        <ul className="space-y-1">
                            {categoriesLoading ? (
                                Array(10).fill(null).map((_, i) => (
                                    <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse mb-2"></div>
                                ))
                            ) : (
                                <>
                                    {/* Optional "All Categories" link for the root /categories route */}
                                    <li>
                                        <Link 
                                            href="/categories"
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                                !activeSlug 
                                                    ? 'bg-brand-primary text-white' 
                                                    : 'text-gray-600 hover:bg-brand-primary/10 hover:text-brand-primary'
                                            }`}
                                        >
                                            <LucideIcons.LayoutGrid className="w-4 h-4" />
                                            <span>All Categories</span>
                                        </Link>
                                    </li>
                                    
                                    {categories.map((cat: any) => {
                                        const IconComponent = cat.icon ? (LucideIcons as any)[cat.icon] : null;
                                        
                                        return (
                                            <li key={cat.id || cat.slug}>
                                                <Link 
                                                    href={`/categories/${cat.slug}`}
                                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                                        activeSlug === cat.slug 
                                                            ? 'bg-brand-primary text-white' 
                                                            : 'text-gray-600 hover:bg-brand-primary/10 hover:text-brand-primary'
                                                    }`}
                                                >
                                                    {IconComponent ? (
                                                        <IconComponent className="w-4 h-4" />
                                                    ) : (
                                                        <span className="w-4 h-4"></span> // Spacer if no icon
                                                    )}
                                                    <span>{cat.name}</span>
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </>
                            )}
                        </ul>
                    </div>
                </aside>

                {/* RIGHT CONTENT: Page specific content goes here */}
                <main className="flex-1 space-y-6">
                    {children}
                </main>
                
            </div>
        </div>
    )
}
