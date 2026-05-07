'use client'

import * as icons from 'lucide-react'
import { GripVertical, MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export interface MallCategoryType {
    id: string
    name: string
    slug: string
    icon: string
    parent: string | null
    parent_name?: string
    display_order: number
    is_active: boolean
    product_count?: number
}

export interface MarketplaceCategoryType {
    id: string
    name: string
    slug: string
    post_type: 'buy' | 'rental' | 'service' | 'food'
    is_active: boolean
    listing_count?: number
}

interface CategoryCardProps {
    type: 'mall' | 'marketplace'
    category: any // either MallCategoryType or MarketplaceCategoryType
    onEdit: (category: any) => void
    onToggleStatus: (category: any) => void
}

const getIcon = (name: string) => {
    const Component = (icons as Record<string, React.ElementType>)[name]
    return Component ? Component : icons.Package
}

const TYPE_COLORS: Record<string, string> = {
    buy: 'bg-purple-100 text-purple-700',
    rental: 'bg-green-100 text-green-700',
    service: 'bg-blue-100 text-blue-700',
    food: 'bg-amber-100 text-amber-700',
}

export default function CategoryCard({ type, category, onEdit, onToggleStatus }: CategoryCardProps) {
    const IconComponent = type === 'mall' && category.icon ? getIcon(category.icon) : null

    return (
        <div className="relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition group">
            {/* Context Menu */}
            <div className="absolute top-3 right-3 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-100">
                        <DropdownMenuItem onClick={() => onEdit(category)} className="font-medium cursor-pointer">
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-100" />
                        <DropdownMenuItem 
                            onClick={() => onToggleStatus(category)} 
                            className={`font-medium cursor-pointer ${category.is_active ? 'text-red-600 focus:text-red-700 focus:bg-red-50' : 'text-green-600 focus:text-green-700 focus:bg-green-50'}`}
                        >
                            {category.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div 
                onClick={() => onEdit(category)}
                className={`cursor-pointer ${!category.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
                {/* Top Row */}
                <div className="flex items-start justify-between pr-8">
                    {type === 'mall' ? (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            {IconComponent && <IconComponent className="w-5 h-5 text-[#4C3B8A]" />}
                        </div>
                    ) : (
                        <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${TYPE_COLORS[category.post_type] || 'bg-gray-100 text-gray-700'}`}>
                            {category.post_type}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${category.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {type === 'mall' && (
                            <GripVertical className="w-4 h-4 text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500 transition-colors invisible sm:visible" />
                        )}
                    </div>
                </div>

                {/* Middle */}
                <div className="mt-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1" title={category.name}>{category.name}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-1 w-full truncate">/{category.slug}</p>
                    {category.parent && category.parent_name && (
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            ↳ Sub of {category.parent_name}
                        </p>
                    )}
                </div>

                {/* Bottom Row */}
                <div className="mt-4 flex justify-between items-center bg-gray-50 -mx-2 -mb-2 px-2 py-1.5 rounded-lg border border-gray-100">
                    <span className="text-[11px] text-gray-500 font-medium">
                        {type === 'mall' 
                            ? (category.product_count !== undefined ? `${category.product_count} products` : '—') 
                            : (category.listing_count !== undefined ? `${category.listing_count} listings` : '—')
                        }
                    </span>
                    {type === 'mall' && (
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-white border border-gray-100 px-1.5 py-0.5 rounded shadow-sm">
                            Order {category.display_order}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
