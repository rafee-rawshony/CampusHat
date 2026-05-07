'use client'

import React from 'react'
import { Minus, Plus } from 'lucide-react'

interface ProductQuantityStepperProps {
    quantity: number
    setQuantity: (qty: number) => void
    maxQuantity: number
}

export function ProductQuantityStepper({
    quantity,
    setQuantity,
    maxQuantity
}: ProductQuantityStepperProps) {
    return (
        <div className="mt-4 flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-800">Quantity:</span>
            
            <div className="inline-flex flex-row items-center border border-gray-200 rounded-xl overflow-hidden h-10 w-[120px]">
                {/* Minus */}
                <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    aria-label="Decrease quantity"
                >
                    <Minus className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Input Display */}
                <div className="flex-1 text-center font-semibold text-gray-900 text-sm flex items-center justify-center bg-white h-full border-x border-gray-200">
                    {quantity}
                </div>
                
                {/* Plus */}
                <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity || maxQuantity === 0}
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    aria-label="Increase quantity"
                >
                    <Plus className="w-4 h-4 text-gray-600" />
                </button>
            </div>
            
            {quantity >= maxQuantity && maxQuantity > 0 && (
                <span className="text-xs text-orange-500 font-medium">Max available stock reached</span>
            )}
        </div>
    )
}
