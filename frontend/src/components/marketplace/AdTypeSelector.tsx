import React from 'react'
import { ShoppingBag, Key, Briefcase, Utensils } from 'lucide-react'

export type AdType = 'buy' | 'rental' | 'service' | 'food'

interface AdTypeSelectorProps {
    value: AdType
    onChange: (value: AdType) => void
}

export function AdTypeSelector({ value, onChange }: AdTypeSelectorProps) {
    const cards = [
        { id: 'buy', icon: <ShoppingBag className="w-6 h-6" />, label: 'Sell Item' },
        { id: 'rental', icon: <Key className="w-6 h-6" />, label: 'For Rent' },
        { id: 'service', icon: <Briefcase className="w-6 h-6" />, label: 'Service' },
        { id: 'food', icon: <Utensils className="w-6 h-6" />, label: 'Food' },
    ]

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
                <span className="text-[#4C3B8A] mr-1">1.</span> Select Advertisement Type
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {cards.map((card) => {
                    const isSelected = value === card.id
                    return (
                        <button
                            type="button"
                            key={card.id}
                            onClick={() => onChange(card.id as AdType)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 min-h-[100px]
                            ${isSelected
                                    ? 'bg-[#4C3B8A] border-[#4C3B8A] text-white shadow-md'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className={`${isSelected ? 'text-white' : 'text-[#4C3B8A]'}`}>
                                {card.icon}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">{card.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
