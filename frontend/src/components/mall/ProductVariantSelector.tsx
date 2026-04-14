'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface ProductVariant {
    id: string
    sku: string | null
    price: number | string
    stock: number
    image?: string | null
    attributes: Record<string, string>
}

interface ProductVariantSelectorProps {
    variants: ProductVariant[]
    selectedAttributes: Record<string, string>
    onAttributeSelect: (key: string, value: string) => void
    errorMode?: boolean
}

// Map common colors to hex
const COLOR_MAP: Record<string, string> = {
    'Red': '#EF4444',
    'Blue': '#3B82F6',
    'Green': '#22C55E',
    'Black': '#111827',
    'White': '#F9FAFB',
    'Gray': '#6B7280',
    'Navy': '#1e3a8a',
    'Yellow': '#EAB308',
    'Pink': '#EC4899',
    'Purple': '#A855F7',
}

export function ProductVariantSelector({
    variants,
    selectedAttributes,
    onAttributeSelect,
    errorMode = false
}: ProductVariantSelectorProps) {
    if (!variants || variants.length === 0) return null

    // Extract all unique attribute keys and values available
    const availableAttributes = variants.reduce((acc, v) => {
        Object.entries(v.attributes).forEach(([key, val]) => {
            if (!acc[key]) acc[key] = new Set()
            acc[key].add(val)
        })
        return acc
    }, {} as Record<string, Set<string>>)

    // Helper to check if a specific attribute selection leads to an out-of-stock variant
    const checkStockForAttribute = (attrKey: string, attrVal: string) => {
        // Find variants that match all currently selected attributes EXCEPT the one we're checking, plus the one we're checking
        const hypotheticalSelection = { ...selectedAttributes, [attrKey]: attrVal }
        
        const matchingVariant = variants.find(v => {
            return Object.entries(hypotheticalSelection).every(([k, val]) => v.attributes[k] === val)
        })

        // If no match found at all with current combination, it's not possible
        if (!matchingVariant) return { exists: false, inStock: false }
        
        return { exists: true, inStock: matchingVariant.stock > 0 }
    }

    return (
        <div className={cn(
            "space-y-6 rounded-2xl transition-all duration-300",
            errorMode && "border-2 border-red-500 p-4 -mx-4"
        )}>
            {Object.entries(availableAttributes).map(([attrName, attrValues]) => {
                const isColor = attrName.toLowerCase() === 'color'

                return (
                    <div key={attrName}>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2 flex justify-between">
                            <span>{attrName}: <span className="font-normal text-gray-500">{selectedAttributes[attrName] || 'None'}</span></span>
                            {errorMode && !selectedAttributes[attrName] && (
                                <span className="text-red-500 text-xs">Required</span>
                            )}
                        </h3>
                        
                        <div className={cn("flex flex-wrap gap-2", isColor && "gap-3")}>
                            {Array.from(attrValues).map(val => {
                                const isSelected = selectedAttributes[attrName] === val
                                const { exists, inStock } = checkStockForAttribute(attrName, val)
                                
                                // Color logic
                                if (isColor) {
                                    const bgColor = COLOR_MAP[val as string] || '#E5E7EB' // default gray if unknown
                                    return (
                                        <button
                                            key={val}
                                            onClick={() => onAttributeSelect(attrName, val)}
                                            title={`${val}${!inStock && exists ? ' - Out of stock' : ''}`}
                                            className={cn(
                                                "w-8 h-8 rounded-full border-2 transition-all relative",
                                                isSelected ? "border-[#4C3B8A] scale-110 shadow-md" : "border-transparent hover:border-gray-400 hover:scale-105 shadow-sm",
                                                (!inStock && exists) && "opacity-50 cursor-not-allowed",
                                                !exists && "opacity-20 cursor-not-allowed" // combination doesn't exist
                                            )}
                                            style={{ backgroundColor: bgColor }}
                                        >
                                            {/* Disabled diagonal slash */}
                                            {(!inStock && exists) && (
                                                <span className="absolute inset-x-0 top-1/2 h-[2px] bg-red-500 -rotate-45 -translate-y-1/2" />
                                            )}
                                        </button>
                                    )
                                }

                                // Pill logic (Size, etc)
                                return (
                                    <button
                                        key={val}
                                        onClick={() => onAttributeSelect(attrName, val)}
                                        disabled={!exists}
                                        title={!inStock && exists ? 'Out of stock' : ''}
                                        className={cn(
                                            "px-3 py-1.5 text-sm border rounded-lg transition-all relative overflow-hidden",
                                            isSelected
                                                ? "bg-[#4C3B8A] text-white border-[#4C3B8A] font-medium shadow-sm"
                                                : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white",
                                            (!inStock && exists) && "opacity-50 cursor-not-allowed text-gray-400",
                                            !exists && "opacity-30 cursor-not-allowed bg-gray-50"
                                        )}
                                    >
                                        {val}
                                        {/* Disabled strikethrough logic */}
                                        {(!inStock && exists) && (
                                            <span className="absolute inset-x-0 top-1/2 h-[1px] bg-gray-400 -translate-y-1/2" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
