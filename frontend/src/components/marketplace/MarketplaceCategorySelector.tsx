'use client'

import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface CategoryOption {
    id: string
    name: string
    slug: string
    ad_type: string
    icon_url?: string | null
    children?: CategoryOption[]
}

interface MarketplaceCategorySelectorProps {
    adType: string
    selectedCategoryId: string
    selectedSubcategoryId: string
    // eslint-disable-next-line no-unused-vars
    onCategoryChange(categoryId: string): void
    // eslint-disable-next-line no-unused-vars
    onSubcategoryChange(subcategoryId: string): void
    error?: string
}

/**
 * Cascading category selector for marketplace posting.
 * Shows categories based on selected ad_type, then loads subcategories.
 */
export function MarketplaceCategorySelector({
    adType,
    selectedCategoryId,
    selectedSubcategoryId,
    onCategoryChange,
    onSubcategoryChange,
    error,
}: MarketplaceCategorySelectorProps) {

    // Fetch root categories for the selected ad_type (with children included)
    const { data: categories = [], isLoading: loadingCategories } = useQuery({
        queryKey: ['marketplace-categories', adType],
        queryFn: async () => {
            const res = await api.get('/marketplace/categories/', {
                params: { ad_type: adType }
            })
            return res.data?.data || []
        },
        enabled: !!adType,
        staleTime: 60_000,
    })

    // Get subcategories for the selected category
    const subcategories: CategoryOption[] = useMemo(() => {
        const selectedCategory = (categories as CategoryOption[]).find(c => c.id === selectedCategoryId)
        return selectedCategory?.children || []
    }, [categories, selectedCategoryId])

    // Reset subcategory when category changes
    useEffect(() => {
        if (selectedCategoryId && subcategories.length > 0 && selectedSubcategoryId) {
            const valid = subcategories.some(s => s.id === selectedSubcategoryId)
            if (!valid) {
                onSubcategoryChange('')
            }
        }
    }, [selectedCategoryId, subcategories, selectedSubcategoryId, onSubcategoryChange])

    return (
        <div className="space-y-4">
            {/* Category Dropdown */}
            <div className="space-y-2">
                <Label className="font-semibold text-gray-800">Category</Label>
                {loadingCategories ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading categories...
                    </div>
                ) : (
                    <Select
                        value={selectedCategoryId}
                        onValueChange={(val) => {
                            onCategoryChange(val)
                            onSubcategoryChange('')
                        }}
                    >
                        <SelectTrigger className={error ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {(categories as CategoryOption[]).map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                {error && !selectedCategoryId && (
                    <p className="text-sm text-red-500">{error}</p>
                )}
            </div>

            {/* Subcategory Dropdown — only shows when category has subcategories */}
            {selectedCategoryId && subcategories.length > 0 && (
                <div className="space-y-2">
                    <Label className="font-semibold text-gray-800">Subcategory</Label>
                    <Select
                        value={selectedSubcategoryId}
                        onValueChange={onSubcategoryChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                            {subcategories.map(sub => (
                                <SelectItem key={sub.id} value={sub.id}>
                                    {sub.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    )
}
