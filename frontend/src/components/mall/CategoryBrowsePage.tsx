'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import * as LucideIcons from 'lucide-react'
import { ChevronRight, Package, Tag } from 'lucide-react'

import { ProductCard, ProductCardSkeleton } from '@/components/mall/ProductCard'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface CategoryNode {
    id: string
    name: string
    slug: string
    icon?: string | null
    icon_url?: string | null
    product_count?: number
    children?: CategoryNode[]
}

const getIcon = (name?: string | null) => {
    return name ? (LucideIcons as unknown as Record<string, React.ElementType>)[name] || Tag : Tag
}

const findCategory = (
    categories: CategoryNode[],
    slug?: string,
    parent: CategoryNode | null = null
): { category: CategoryNode, parent: CategoryNode | null } | null => {
    for (const category of categories) {
        if (category.slug === slug) return { category, parent }
        const childMatch = findCategory(category.children || [], slug, category)
        if (childMatch) return childMatch
    }
    return null
}

export function CategoryBrowsePage() {
    const params = useParams()
    const slug = params?.slug as string | undefined
    const [hoveredCategory, setHoveredCategory] = useState<CategoryNode | null>(null)
    const [megaPanelTop, setMegaPanelTop] = useState(0)
    const [mobileExpandedSlug, setMobileExpandedSlug] = useState<string | null>(null)
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
    const menuRef = useRef<HTMLElement | null>(null)
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['mall-categories-tree'],
        queryFn: () => api.get('/mall/categories/tree/').then(r => {
            const res = r.data?.data || r.data
            return Array.isArray(res) ? res : []
        }),
        staleTime: 300_000,
    })

    const categories: CategoryNode[] = categoriesData || []
    const fallbackCategory = categories[0]
    const match = slug ? findCategory(categories, slug) : null
    const selectedCategory = match?.category || fallbackCategory
    const activeParent = match?.parent || selectedCategory

    const { data: productsRaw, isLoading: productsLoading } = useQuery({
        queryKey: ['category-products', selectedCategory?.slug],
        queryFn: () =>
            api.get('/mall/products/', {
                params: {
                    category_slug: selectedCategory.slug,
                    is_active: true,
                    page_size: 20,
                },
            }).then(r => {
                const data = r.data
                if (data?.results) return { results: data.results, count: data.count }
                if (Array.isArray(data)) return { results: data, count: data.length }
                if (data?.data?.results) return { results: data.data.results, count: data.data.count }
                if (Array.isArray(data?.data)) return { results: data.data, count: data.data.length }
                return { results: [], count: 0 }
            }),
        enabled: !!selectedCategory?.slug,
        staleTime: 60_000,
    })

    const products: any[] = productsRaw?.results || []
    const productCount = productsRaw?.count || 0
    const megaCategory = hoveredCategory
    const mobileOpenSlug = mobileExpandedSlug || activeParent?.slug || null

    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current)
            closeTimerRef.current = null
        }
    }

    const openMegaMenu = (category: CategoryNode, trigger?: HTMLElement) => {
        clearCloseTimer()
        if (trigger && menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect()
            const triggerRect = trigger.getBoundingClientRect()
            setMegaPanelTop(Math.max(0, triggerRect.top - menuRect.top))
        }
        setHoveredCategory(category)
    }

    const scheduleMegaMenuClose = () => {
        clearCloseTimer()
        closeTimerRef.current = setTimeout(() => {
            setHoveredCategory(null)
            closeTimerRef.current = null
        }, 180)
    }

    return (
        <div className="min-h-screen bg-[#F7F8FA]">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
                <div className="flex items-center text-sm text-gray-500 gap-2 mb-7">
                    <Link href="/" className="hover:text-[#4C3B8A] transition-colors">Home</Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="font-semibold text-gray-900">Categories</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-7">
                    <aside
                        ref={menuRef}
                        className="hidden lg:block relative sticky top-4 h-fit"
                        onMouseEnter={clearCloseTimer}
                        onMouseLeave={scheduleMegaMenuClose}
                    >
                        <div className="border border-gray-200/80 rounded-lg bg-white overflow-visible shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            <div className="px-5 py-5 border-b border-gray-100">
                                <p className="text-[11px] uppercase font-bold tracking-wider text-gray-400">Browse By Category</p>
                                <h2 className="font-bold text-lg text-gray-950 mt-1">Product Categories</h2>
                            </div>

                            <nav className="p-2.5 space-y-1">
                                {categoriesLoading
                                    ? Array(10).fill(0).map((_, i) => (
                                        <div key={i} className="h-11 rounded-md bg-gray-100 animate-pulse" />
                                    ))
                                    : categories.map(category => {
                                        const isParentActive = activeParent?.slug === category.slug
                                        const Icon = getIcon(category.icon || category.icon_url)

                                        return (
                                            <Link
                                                key={category.id}
                                                href={`/categories/${category.slug}`}
                                                onMouseEnter={(event) => openMegaMenu(category, event.currentTarget)}
                                                onFocus={(event) => openMegaMenu(category, event.currentTarget)}
                                                className={cn(
                                                    'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                                                    hoveredCategory?.slug === category.slug || isParentActive
                                                        ? 'bg-[#4C3B8A]/[0.07] text-[#2F235F] font-bold'
                                                        : 'text-gray-700 font-semibold hover:bg-gray-50 hover:text-gray-950'
                                                )}
                                            >
                                                {(hoveredCategory?.slug === category.slug || isParentActive) && (
                                                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[#4C3B8A]" />
                                                )}
                                                <span className={cn(
                                                    'w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors',
                                                    hoveredCategory?.slug === category.slug || isParentActive
                                                        ? 'bg-white text-[#4C3B8A]'
                                                        : 'bg-gray-100 text-gray-500 group-hover:text-gray-700'
                                                )}>
                                                    <Icon className="w-4 h-4" />
                                                </span>
                                                <span className="truncate flex-1">{category.name}</span>
                                                {(category.children || []).length > 0 && (
                                                    <span className={cn(
                                                        'text-[10px] font-bold rounded-full px-2 py-0.5',
                                                        hoveredCategory?.slug === category.slug || isParentActive
                                                            ? 'bg-white text-[#4C3B8A]'
                                                            : 'bg-gray-100 text-gray-500'
                                                    )}>
                                                        {(category.children || []).length}
                                                    </span>
                                                )}
                                                <ChevronRight className={cn(
                                                    'w-3.5 h-3.5 shrink-0',
                                                    hoveredCategory?.slug === category.slug || isParentActive
                                                        ? 'text-[#4C3B8A]'
                                                        : 'text-gray-300 group-hover:text-gray-500'
                                                )} />
                                            </Link>
                                        )
                                    })}
                            </nav>
                        </div>

                        {megaCategory?.children && megaCategory.children.length > 0 && (
                            <>
                                <div
                                    className="absolute left-full top-0 z-20 h-full w-4"
                                    onMouseEnter={clearCloseTimer}
                                />
                                <div
                                    className="absolute left-[calc(100%+8px)] z-30 w-[min(760px,calc(100vw-380px))] rounded-lg border border-gray-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)] transition-[top,opacity] duration-150"
                                    style={{ top: megaPanelTop }}
                                    onMouseEnter={clearCloseTimer}
                                    onMouseLeave={scheduleMegaMenuClose}
                                >
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <p className="text-xs font-semibold text-gray-400">Subcategories</p>
                                    <h3 className="text-lg font-bold text-gray-950 mt-1">{megaCategory.name}</h3>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-x-5 gap-y-1">
                                    {megaCategory.children.map(child => {
                                        const isChildActive = selectedCategory?.slug === child.slug
                                        const hasChildren = (child.children || []).length > 0

                                        return (
                                            <div key={child.id} className="min-w-0">
                                                <Link
                                                    href={`/categories/${child.slug}`}
                                                    className={cn(
                                                        'flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                                                        isChildActive
                                                            ? 'bg-[#4C3B8A]/[0.07] text-[#4C3B8A] font-bold'
                                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-950'
                                                    )}
                                                >
                                                    <span className="truncate">{child.name}</span>
                                                    <ChevronRight className={cn(
                                                        'w-3.5 h-3.5 shrink-0',
                                                        isChildActive ? 'text-[#4C3B8A]' : 'text-gray-300'
                                                    )} />
                                                </Link>
                                                {hasChildren && (
                                                    <div className="ml-3 mt-1 border-l border-gray-100 pl-3 space-y-0.5">
                                                        {(child.children || []).map(grandchild => (
                                                            <Link
                                                                key={grandchild.id}
                                                                href={`/categories/${grandchild.slug}`}
                                                                className="block rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                            >
                                                                {grandchild.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                </div>
                            </>
                        )}
                    </aside>

                    <main className="min-w-0">
                        <div className="border border-gray-200/80 rounded-lg bg-white px-5 py-5 mb-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2">
                                        {activeParent && selectedCategory && activeParent.slug !== selectedCategory.slug && (
                                            <>
                                                <Link href={`/categories/${activeParent.slug}`} className="hover:text-gray-700">{activeParent.name}</Link>
                                                <ChevronRight className="w-3 h-3" />
                                            </>
                                        )}
                                        <span className="text-gray-600">{selectedCategory?.name || 'Product Categories'}</span>
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-950">
                                        {selectedCategory?.name || 'Product Categories'}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 w-fit">
                                        {productsLoading ? 'Loading...' : `${productCount} products`}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsMobileDrawerOpen(true)}
                                        className="lg:hidden rounded-md bg-[#4C3B8A] px-3 py-2 text-sm font-bold text-white shadow-sm active:scale-95 transition-transform"
                                    >
                                        Categories
                                    </button>
                                </div>
                            </div>
                        </div>

                        {productsLoading || categoriesLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="bg-white border border-gray-200/80 rounded-lg p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                                <h3 className="font-semibold text-gray-800">No products in this category</h3>
                                <p className="text-sm text-gray-500 mt-2">Try another category from the sidebar.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <div
                className={cn(
                    'fixed inset-0 z-50 lg:hidden transition-opacity duration-200',
                    isMobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                aria-hidden={!isMobileDrawerOpen}
            >
                <button
                    type="button"
                    aria-label="Close category menu"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="absolute inset-0 bg-black/40"
                />

                <aside
                    className={cn(
                        'absolute left-0 top-0 h-full w-[86vw] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col',
                        isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    <div className="px-4 py-4 border-b border-gray-100 shrink-0">
                        <p className="text-[11px] uppercase font-bold tracking-wider text-gray-400">Browse By Category</p>
                        <div className="flex items-center justify-between gap-3 mt-1">
                            <h2 className="font-bold text-lg text-gray-950">Product Categories</h2>
                            <button
                                type="button"
                                onClick={() => setIsMobileDrawerOpen(false)}
                                className="rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {categoriesLoading
                            ? Array(8).fill(0).map((_, i) => (
                                <div key={i} className="h-11 rounded-md bg-gray-100 animate-pulse" />
                            ))
                            : categories.map(category => {
                                const isOpen = mobileOpenSlug === category.slug
                                const isParentActive = activeParent?.slug === category.slug
                                const Icon = getIcon(category.icon || category.icon_url)
                                const children = category.children || []

                                return (
                                    <div key={category.id} className="rounded-md">
                                        <button
                                            type="button"
                                            onClick={() => setMobileExpandedSlug(isOpen ? null : category.slug)}
                                            className={cn(
                                                'w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                                                isOpen || isParentActive
                                                    ? 'bg-[#4C3B8A]/[0.07] text-[#2F235F] font-bold'
                                                    : 'text-gray-700 font-semibold hover:bg-gray-50'
                                            )}
                                            aria-expanded={isOpen}
                                        >
                                            <span className={cn(
                                                'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                                                isOpen || isParentActive ? 'bg-white text-[#4C3B8A]' : 'bg-gray-100 text-gray-500'
                                            )}>
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            <span className="flex-1 truncate">{category.name}</span>
                                            {children.length > 0 && (
                                                <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-white text-[#4C3B8A]">
                                                    {children.length}
                                                </span>
                                            )}
                                            <ChevronRight className={cn(
                                                'w-4 h-4 shrink-0 transition-transform duration-200',
                                                isOpen && 'rotate-90'
                                            )} />
                                        </button>

                                        <div className={cn(
                                            'grid transition-[grid-template-rows] duration-200 ease-out',
                                            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                        )}>
                                            <div className="overflow-hidden">
                                                <div className="ml-6 mt-1 mb-2 border-l border-gray-200 pl-3 space-y-1">
                                                    <Link
                                                        href={`/categories/${category.slug}`}
                                                        onClick={() => setIsMobileDrawerOpen(false)}
                                                        className={cn(
                                                            'block rounded-md px-3 py-2 text-xs font-bold',
                                                            selectedCategory?.slug === category.slug
                                                                ? 'bg-[#4C3B8A]/[0.07] text-[#4C3B8A]'
                                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                        )}
                                                    >
                                                        View all {category.name}
                                                    </Link>

                                                    {children.map(child => (
                                                        <Link
                                                            key={child.id}
                                                            href={`/categories/${child.slug}`}
                                                            onClick={() => setIsMobileDrawerOpen(false)}
                                                            className={cn(
                                                                'block rounded-md px-3 py-2 text-sm font-medium',
                                                                selectedCategory?.slug === child.slug
                                                                    ? 'bg-[#4C3B8A]/[0.07] text-[#4C3B8A] font-bold'
                                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                                                            )}
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </aside>
            </div>
        </div>
    )
}
