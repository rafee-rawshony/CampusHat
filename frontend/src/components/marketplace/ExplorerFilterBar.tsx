'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown, X, MapPin } from 'lucide-react'
import { useCampusStore } from '@/stores/campus.store'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

const TYPES = [
    { label: 'All', value: 'all' },
    { label: 'Buy', value: 'buy' },
    { label: 'Rental', value: 'rental' },
    { label: 'Services', value: 'service' },
    { label: 'Food', value: 'food' },
]

const CONDITIONS = [
    { label: 'Any Condition', value: '' },
    { label: 'New', value: 'new' },
    { label: 'Used - Like New', value: 'used_like_new' },
    { label: 'Used - Good', value: 'used_good' },
    { label: 'Used - Fair', value: 'used_fair' },
]

const SORT_OPTIONS = [
    { label: 'Newest', value: '-created_at' },
    { label: 'Oldest', value: 'created_at' },
    { label: 'Price: Low to High', value: 'price' },
    { label: 'Price: High to Low', value: '-price' },
]

interface ExplorerFilterBarProps {
    typeCounts?: Record<string, number>
}

export function ExplorerFilterBar({ typeCounts }: ExplorerFilterBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { selectedCampusId, selectedCampusName, clearCampus } = useCampusStore()
    
    const campusName = selectedCampusName

    // Read URL state
    const currentType = searchParams.get('type') || 'all'
    const currentCondition = searchParams.get('condition') || ''
    const currentMin = searchParams.get('min') || ''
    const currentMax = searchParams.get('max') || ''
    const currentSort = searchParams.get('sort') || '-created_at'
    const q = searchParams.get('q') || ''

    // Local price state for inputs
    const [minPrice, setMinPrice] = useState(currentMin)
    const [maxPrice, setMaxPrice] = useState(currentMax)

    useEffect(() => {
        setMinPrice(currentMin)
        setMaxPrice(currentMax)
    }, [currentMin, currentMax])

    const updateUrl = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || (key === 'type' && value === 'all') || (key === 'sort' && value === '-created_at')) {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })
        params.delete('page') // Reset pagination
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, [searchParams, pathname, router])

    const handleTypeChange = (value: string) => {
        // If switching away from buy/all, condition is mostly irrelevant but we can just clear it to be safe
        updateUrl({ type: value, condition: value === 'buy' || value === 'all' ? currentCondition : null })
    }

    const clearAll = () => {
        const params = new URLSearchParams()
        if (q) params.set('q', q) // Preserve search query
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const removeCampusFilter = () => {
        // Normally handled by letting user switch to "All Campuses" in the main campus dropdown,
        // but if they click the X here, it essentially means 'show all campuses' for THIS search view.
        // The prompt says "× removes campus filter (resets to All Campuses)".
        // Wait, useCampusStore controls it gobally. We can ignore the store for a moment by setting a URL param, 
        // or just updating the store directly.
        clearCampus()
    }

    const handleApplyPrice = () => {
        updateUrl({ min: minPrice, max: maxPrice })
    }

    // Active filters count (excluding default 'all' type and default '-created_at' sort)
    let activeFilters = 0
    if (currentType !== 'all') activeFilters++
    if (currentCondition) activeFilters++
    if (currentMin || currentMax) activeFilters++
    if (currentSort !== '-created_at') activeFilters++
    if (selectedCampusId) activeFilters++

    return (
        <div className="mb-8 overflow-visible relative">
            <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-700">Filters</div>
                {activeFilters > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{activeFilters} filters active</span>
                        <button onClick={clearAll} className="text-xs text-[#4C3B8A] hover:underline">Clear all</button>
                    </div>
                )}
            </div>

            {/* Scrollable Container */}
            <div className="flex flex-nowrap md:flex-wrap items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
                
                {/* Type Pills */}
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-full border border-gray-200">
                    {TYPES.map((type) => {
                        const isSelected = currentType === type.value
                        const count = typeCounts && typeCounts[type.value] !== undefined ? ` (${typeCounts[type.value]})` : ''
                        return (
                            <button
                                key={type.value}
                                onClick={() => handleTypeChange(type.value)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                                    isSelected 
                                        ? 'bg-[#4C3B8A] text-white shadow-sm' 
                                        : 'text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {type.label}{count}
                            </button>
                        )
                    })}
                </div>

                {/* Campus Pill */}
                {selectedCampusId && campusName && (
                    <span className="flex items-center gap-1.5 shrink-0 bg-[#4C3B8A]/10 text-[#4C3B8A] border border-[#4C3B8A]/20 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
                        <MapPin className="w-3.5 h-3.5" />
                        {campusName}
                        <button onClick={removeCampusFilter} className="ml-1 hover:text-[#38266e] focus:outline-none">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </span>
                )}

                {/* Condition Dropdown (only if Type is All or Buy) */}
                {(currentType === 'all' || currentType === 'buy') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={`flex shrink-0 items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors border ${
                                currentCondition ? 'border-[#4C3B8A] text-[#4C3B8A] bg-purple-50' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
                            }`}>
                                {currentCondition ? CONDITIONS.find(c => c.value === currentCondition)?.label : 'Condition'}
                                <ChevronDown className="w-4 h-4 opacity-70" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            {CONDITIONS.map((cond) => (
                                <DropdownMenuItem 
                                    key={cond.value} 
                                    onClick={() => updateUrl({ condition: cond.value })}
                                    className={currentCondition === cond.value ? 'bg-purple-50 text-[#4C3B8A] font-medium' : ''}
                                >
                                    {cond.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Price Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={`flex shrink-0 items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors border ${
                            currentMin || currentMax ? 'border-[#4C3B8A] text-[#4C3B8A] bg-purple-50' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
                        }`}>
                            Price: {currentMin || currentMax ? `৳${currentMin || '0'} - ${currentMax ? `৳${currentMax}` : 'Any'}` : 'Any'}
                            <ChevronDown className="w-4 h-4 opacity-70" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 p-4">
                        <DropdownMenuLabel className="px-0 pb-3 font-semibold text-gray-800">Custom Range</DropdownMenuLabel>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 mb-1 block">Min ৳</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    placeholder="Min"
                                    className="w-full border border-gray-300 rounded text-sm px-2 py-1.5 focus:ring-1 focus:ring-[#4C3B8A] outline-none"
                                />
                            </div>
                            <span className="text-gray-400 mt-5">-</span>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 mb-1 block">Max ৳</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    placeholder="Max"
                                    className="w-full border border-gray-300 rounded text-sm px-2 py-1.5 focus:ring-1 focus:ring-[#4C3B8A] outline-none"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleApplyPrice}
                            className="w-full bg-[#4C3B8A] text-white text-sm font-medium py-2 rounded shadow hover:bg-[#2D1B69] transition-colors"
                        >
                            Apply
                        </button>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex shrink-0 items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors border border-gray-200 text-gray-600 bg-white hover:border-gray-300">
                            Sort: {SORT_OPTIONS.find(s => s.value === currentSort)?.label || 'Newest'}
                            <ChevronDown className="w-4 h-4 opacity-70" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {SORT_OPTIONS.map((sortOption) => (
                            <DropdownMenuItem 
                                key={sortOption.value} 
                                onClick={() => updateUrl({ sort: sortOption.value })}
                                className={currentSort === sortOption.value ? 'bg-purple-50 text-[#4C3B8A] font-medium' : ''}
                            >
                                {sortOption.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </div>
    )
}
