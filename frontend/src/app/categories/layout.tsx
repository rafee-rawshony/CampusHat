'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import * as LucideIcons from 'lucide-react'
import { SharedMallSidebar } from '@/components/mall/SharedMallSidebar'

import { useRouter } from 'next/navigation'

export default function CategoriesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    // Extract the active slug from the URL: /categories/[slug]
    const activeSlug = pathname.startsWith('/categories/') ? pathname.split('/')[2] : null

    // Note: The API call logic was moved inside the SharedMallSidebar.

    return (
        <div className="bg-[#F5F5F5] min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8">
                
                {/* LEFT SIDEBAR: Categories List */}
                <div className="w-full md:w-[260px] lg:w-[280px] shrink-0">
                    <SharedMallSidebar 
                        mode="filter"
                        showCategories={true}
                        selectedCategories={activeSlug ? [activeSlug] : []}
                        onCategoryToggle={(slug) => {
                            if (activeSlug === slug) {
                                router.push('/categories')
                            } else {
                                router.push(`/categories/${slug}`)
                            }
                        }}
                        className="sticky top-4 hidden md:block w-full"
                    />
                </div>

                {/* RIGHT CONTENT: Page specific content goes here */}
                <main className="flex-1 space-y-6">
                    {children}
                </main>
                
            </div>
        </div>
    )
}
