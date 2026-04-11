'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Filter, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useCampusStore } from '@/stores/campus.store'
import { MarketplaceListingCard } from './MarketplaceListingCard'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'

/* ─── types ──────────────────────────────────────────── */
interface Category {
    id: string | number
    name: string
    slug: string
}

type SortOption = '-created_at' | 'created_at' | 'price' | '-price'

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: 'Newest', value: '-created_at' },
    { label: 'Oldest', value: 'created_at' },
    { label: 'Price: Low to High', value: 'price' },
    { label: 'Price: High to Low', value: '-price' },
]

const CONDITIONS = [
    { label: 'New', value: 'new' },
    { label: 'Used - Like New', value: 'used_like_new' },
    { label: 'Used - Good', value: 'used_good' },
    { label: 'Used - Fair', value: 'used_fair' },
]

/* ─── collapsible filter section ─────────────────────── */
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true)
    return (
        <div className="border-b border-gray-100 py-4">
            <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>
            <div className={`mt-3 space-y-2 overflow-hidden transition-all duration-300 ${open ? 'max-h-[500px]' : 'max-h-0'}`}>
                {children}
            </div>
        </div>
    )
}

/* ─── checkbox row ───────────────────────────────────── */
function CheckboxItem({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: () => void
}) {
    return (
        <label className="flex items-center text-sm text-gray-600 hover:text-[#634C9F] cursor-pointer">
            <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#634C9F] focus:ring-[#634C9F]"
                checked={checked}
                onChange={onChange}
            />
            <span className={`ml-3 ${checked ? 'font-bold text-[#634C9F]' : ''}`}>{label}</span>
        </label>
    )
}

/* ─── filter sidebar content (reused in sheet + desktop) */
function FilterSidebarContent({
    postType,
    defaultMaxPrice,
    localMin,
    setLocalMin,
    localMax,
    setLocalMax,
    onApplyPrice,
    categories,
    selectedCategories,
    onCategoryToggle,
    selectedConditions,
    onConditionToggle,
}: {
    postType: string
    defaultMaxPrice: number
    localMin: number
    setLocalMin: (v: number) => void
    localMax: number
    setLocalMax: (v: number) => void
    onApplyPrice: () => void
    categories: Category[]
    selectedCategories: string[]
    onCategoryToggle: (slug: string) => void
    selectedConditions: string[]
    onConditionToggle: (val: string) => void
}) {
    return (
        <>
            {/* Price Filter */}
            <div className="border-b border-gray-100 pb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Filter by Price</h3>
                <div className="flex items-end space-x-2 mb-3">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500">Min</label>
                        <input
                            type="number"
                            value={localMin}
                            onChange={(e) => setLocalMin(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md text-sm p-2 focus:ring-[#634C9F] focus:border-[#634C9F] outline-none"
                        />
                    </div>
                    <span className="text-gray-400 pb-2">-</span>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500">Max</label>
                        <input
                            type="number"
                            value={localMax}
                            onChange={(e) => setLocalMax(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md text-sm p-2 focus:ring-[#634C9F] focus:border-[#634C9F] outline-none"
                        />
                    </div>
                </div>
                <button
                    onClick={onApplyPrice}
                    className="w-full text-sm font-semibold bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Apply Price
                </button>
            </div>

            {/* Categories */}
            <FilterSection title="Categories">
                {categories.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Loading…</p>
                ) : (
                    categories.map((cat) => (
                        <CheckboxItem
                            key={cat.slug}
                            label={cat.name}
                            checked={selectedCategories.includes(cat.slug)}
                            onChange={() => onCategoryToggle(cat.slug)}
                        />
                    ))
                )}
            </FilterSection>

            {/* Condition — Buy page only */}
            {postType === 'buy' && (
                <FilterSection title="Condition">
                    {CONDITIONS.map((c) => (
                        <CheckboxItem
                            key={c.value}
                            label={c.label}
                            checked={selectedConditions.includes(c.value)}
                            onChange={() => onConditionToggle(c.value)}
                        />
                    ))}
                </FilterSection>
            )}
        </>
    )
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
interface MarketplaceListingPageProps {
    postType: string        // buy | rental | service | food
    title: string           // "Buy" | "Rental" | "Services" | "Food"
    defaultMaxPrice: number // 1000 | 2000 | 200 | 1000
}

export function MarketplaceListingPage({ postType, title, defaultMaxPrice }: MarketplaceListingPageProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { selectedCampusId } = useCampusStore()

    /* ── read URL params on mount ── */
    const initCategories = searchParams.getAll('category')
    const initConditions = searchParams.getAll('condition')
    const initSort = (searchParams.get('ordering') as SortOption) || '-created_at'
    const initMinPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : 0
    const initMaxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : defaultMaxPrice

    /* ── filter state ── */
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initCategories)
    const [selectedConditions, setSelectedConditions] = useState<string[]>(initConditions)
    const [sort, setSort] = useState<SortOption>(initSort)
    const [appliedMinPrice, setAppliedMinPrice] = useState(initMinPrice)
    const [appliedMaxPrice, setAppliedMaxPrice] = useState(initMaxPrice)
    const [localMin, setLocalMin] = useState(initMinPrice)
    const [localMax, setLocalMax] = useState(initMaxPrice)
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

    /* ── sync URL with filter state ── */
    const updateUrl = useCallback(() => {
        const params = new URLSearchParams()
        selectedCategories.forEach((c) => params.append('category', c))
        selectedConditions.forEach((c) => params.append('condition', c))
        if (sort !== '-created_at') params.set('ordering', sort)
        if (appliedMinPrice > 0) params.set('min_price', String(appliedMinPrice))
        if (appliedMaxPrice !== defaultMaxPrice) params.set('max_price', String(appliedMaxPrice))
        const qs = params.toString()
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    }, [selectedCategories, selectedConditions, sort, appliedMinPrice, appliedMaxPrice, pathname, router, defaultMaxPrice])

    useEffect(() => { updateUrl() }, [updateUrl])

    /* ── fetch categories from API ── */
    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['marketplace-categories', postType],
        queryFn: async () => {
            try {
                const res = await api.get('/marketplace/categories/', { params: { post_type: postType } })
                const items = res.data?.data?.results || res.data?.results || res.data?.data || res.data || []
                return Array.isArray(items) ? items : []
            } catch {
                return []
            }
        },
    })

    /* ── fetch listings ── */
    const { data: listingsData, isLoading } = useQuery({
        queryKey: ['marketplace-listings-page', postType, selectedCampusId, selectedCategories, selectedConditions, sort, appliedMinPrice, appliedMaxPrice],
        queryFn: async () => {
            const params: Record<string, any> = {
                post_type: postType,
                page_size: 20,
                ordering: sort,
            }
            if (appliedMinPrice > 0) params.min_price = appliedMinPrice
            if (appliedMaxPrice < defaultMaxPrice * 100) params.max_price = appliedMaxPrice
            if (selectedCampusId) params.university = selectedCampusId
            selectedCategories.forEach((c, i) => { params[`category${i > 0 ? i : ''}`] = c }) // fallback
            if (selectedCategories.length > 0) params.category = selectedCategories.join(',')
            if (selectedConditions.length > 0) params.condition = selectedConditions.join(',')

            const res = await api.get('/marketplace/listings/', { params })
            const items = res.data?.data?.results || res.data?.results || res.data?.data || res.data || []
            return Array.isArray(items) ? items : []
        },
    })

    const listings = listingsData || []

    /* ── toggle helpers ── */
    const toggleCategory = (slug: string) => {
        setSelectedCategories((prev) => prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug])
    }
    const toggleCondition = (val: string) => {
        setSelectedConditions((prev) => prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val])
    }
    const applyPrice = () => {
        setAppliedMinPrice(localMin)
        setAppliedMaxPrice(localMax)
    }

    /* ── shared sidebar props ── */
    const sidebarProps = {
        postType,
        defaultMaxPrice,
        localMin,
        setLocalMin,
        localMax,
        setLocalMax,
        onApplyPrice: applyPrice,
        categories,
        selectedCategories,
        onCategoryToggle: toggleCategory,
        selectedConditions,
        onConditionToggle: toggleCondition,
    }

    return (
        <div className="bg-[#F5F5F5] min-h-screen pb-20">
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center text-sm text-gray-500 mb-6">
                    <Link href="/marketplace" className="hover:text-gray-800">Marketplace Home</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-700 font-medium">{title}</span>
                </nav>

                {/* Mobile Filter Button */}
                <div className="lg:hidden mb-4">
                    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                        <SheetTrigger asChild>
                            <button className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <Filter className="w-4 h-4" /> Filters
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto rounded-t-2xl">
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                            </SheetHeader>
                            <div className="p-4">
                                <FilterSidebarContent {...sidebarProps} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block lg:col-span-1">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 sticky top-[160px]">
                            <FilterSidebarContent {...sidebarProps} />
                        </div>
                    </aside>

                    {/* Results */}
                    <div className="lg:col-span-3">
                        {/* Sort Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 bg-white rounded-lg border border-gray-200 gap-2">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-semibold text-gray-900">{listings.length}</span> results
                            </p>
                            <div className="flex items-center text-sm">
                                <label htmlFor="sort-select" className="mr-2 text-gray-600">Sort by:</label>
                                <select
                                    id="sort-select"
                                    className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:ring-[#634C9F] focus:border-[#634C9F] outline-none bg-white"
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as SortOption)}
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Active Filter Tags */}
                        {(selectedCategories.length > 0 || selectedConditions.length > 0 || appliedMinPrice > 0) && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedCategories.map((slug) => {
                                    const cat = categories.find((c) => c.slug === slug)
                                    return (
                                        <span key={slug} className="inline-flex items-center gap-1 bg-purple-50 text-[#634C9F] text-xs font-semibold px-3 py-1 rounded-full">
                                            {cat?.name || slug}
                                            <button onClick={() => toggleCategory(slug)}><X className="w-3 h-3" /></button>
                                        </span>
                                    )
                                })}
                                {selectedConditions.map((val) => {
                                    const cond = CONDITIONS.find((c) => c.value === val)
                                    return (
                                        <span key={val} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                                            {cond?.label || val}
                                            <button onClick={() => toggleCondition(val)}><X className="w-3 h-3" /></button>
                                        </span>
                                    )
                                })}
                                {appliedMinPrice > 0 && (
                                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                                        ৳{appliedMinPrice} – ৳{appliedMaxPrice}
                                        <button onClick={() => { setAppliedMinPrice(0); setAppliedMaxPrice(defaultMaxPrice); setLocalMin(0); setLocalMax(defaultMaxPrice) }}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Listings Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="bg-gray-200 animate-pulse h-72 rounded-xl" />
                                ))}
                            </div>
                        ) : listings.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {listings.map((item: any) => (
                                    <MarketplaceListingCard key={item.id} listing={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 border border-gray-200 rounded-lg bg-gray-50">
                                <p className="text-gray-700 font-semibold text-lg">No listings found</p>
                                <p className="text-gray-500 mt-2 text-sm">Try adjusting your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
