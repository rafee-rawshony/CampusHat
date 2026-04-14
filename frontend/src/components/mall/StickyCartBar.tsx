'use client'

import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { cn } from '@/lib/utils'

interface StickyCartBarProps {
    effectivePrice: number
    basePrice: number | null
    isOutOfStock: boolean
    addingToCart: boolean
    onAddToCart: () => void
    onBuyNow: () => void
}

export function StickyCartBar({
    effectivePrice,
    basePrice,
    isOutOfStock,
    addingToCart,
    onAddToCart,
    onBuyNow
}: StickyCartBarProps) {
    const hasDiscount = basePrice !== null && basePrice > effectivePrice

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t border-gray-200 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex items-center gap-3">
            {/* Price Display */}
            <div className="flex-1 min-w-0">
                <CurrencyDisplay 
                    amount={effectivePrice} 
                    className="font-bold text-[#4C3B8A] text-lg leading-tight" 
                />
                {hasDiscount && (
                    <CurrencyDisplay 
                        amount={basePrice!} 
                        className="text-xs line-through text-gray-400 mt-0.5" 
                    />
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-1 shrink-0">
                <button
                    onClick={onAddToCart}
                    disabled={isOutOfStock || addingToCart}
                    className={cn(
                        "flex-1 border-2 border-[#4C3B8A] text-[#4C3B8A] font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-1.5",
                        isOutOfStock || addingToCart ? "opacity-50 cursor-not-allowed" : "active:scale-95"
                    )}
                >
                    {addingToCart ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#4C3B8A]/30 border-t-[#4C3B8A] animate-spin" />
                    ) : (
                        <ShoppingCart className="w-4 h-4" />
                    )}
                </button>
                <button
                    onClick={onBuyNow}
                    disabled={isOutOfStock || addingToCart}
                    className={cn(
                        "flex-[1.5] bg-[#4C3B8A] text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center",
                        isOutOfStock || addingToCart ? "opacity-50 cursor-not-allowed" : "active:scale-95 hover:bg-[#2D1B69]"
                    )}
                >
                    {isOutOfStock ? 'Sold Out' : 'Buy Now'}
                </button>
            </div>
        </div>
    )
}
