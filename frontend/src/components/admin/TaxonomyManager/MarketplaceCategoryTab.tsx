'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import CategoryCard, { MarketplaceCategoryType } from './CategoryCard'
import CategoryDrawer from './CategoryDrawer'

const POST_TYPES = [
    { id: 'all', label: 'All' },
    { id: 'buy', label: 'Buy' },
    { id: 'rental', label: 'Rental' },
    { id: 'service', label: 'Services' },
    { id: 'food', label: 'Food' },
]

export default function MarketplaceCategoryTab() {
    const [typeFilter, setTypeFilter] = useState('all')
    const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | null>(null)
    const [selectedCat, setSelectedCat] = useState<MarketplaceCategoryType | null>(null)
    const queryClient = useQueryClient()

    const { data: mkData, isLoading } = useQuery({
        queryKey: ['admin-marketplace-categories'],
        queryFn: async () => {
            const res = await api.get('/marketplace/categories/')
            return res.data?.data?.results || res.data?.results || res.data || []
        },
        staleTime: 60_000,
    })

    const categories: MarketplaceCategoryType[] = Array.isArray(mkData) ? mkData : []

    const filteredCats = categories.filter(c => typeFilter === 'all' || c.post_type === typeFilter)

    const handleToggleStatus = async (cat: MarketplaceCategoryType) => {
        try {
            await api.patch(`/marketplace/categories/${cat.id}/`, { is_active: !cat.is_active })
            toast.success(`Category ${!cat.is_active ? 'Activated' : 'Deactivated'}`)
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-categories'] })
        } catch {
            toast.error('Failed to change category status')
        }
    }

    return (
        <div className="space-y-6">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
                {POST_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => setTypeFilter(type.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all
                            ${typeFilter === type.id 
                                ? 'bg-[#4C3B8A] text-white shadow-md' 
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 h-[120px] animate-pulse">
                            <div className="w-16 h-6 bg-gray-200 rounded-md mb-4" />
                            <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
                            <div className="w-1/2 h-3 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-xl text-center">
                    <Tag className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Marketplace Categories</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-6">Create categories for C2C marketplace listings.</p>
                    <button 
                        onClick={() => setDrawerMode('add')} 
                        className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                        + New Category
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                    {filteredCats.map(cat => (
                        <CategoryCard
                            key={cat.id}
                            type="marketplace"
                            category={cat}
                            onEdit={(c) => { setSelectedCat(c); setDrawerMode('edit'); }}
                            onToggleStatus={handleToggleStatus}
                        />
                    ))}
                    
                    {/* Add New Placeholder Card */}
                    <div 
                        onClick={() => { setSelectedCat(null); setDrawerMode('add'); }}
                        className="border-2 border-dashed border-gray-200 hover:border-[#4C3B8A] bg-transparent hover:bg-[#4C3B8A]/5 rounded-xl p-5 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] group"
                    >
                        <Plus className="w-8 h-8 text-gray-300 group-hover:text-[#4C3B8A] mb-2 transition-colors" />
                        <span className="text-sm font-semibold text-gray-400 group-hover:text-[#4C3B8A] transition-colors">
                            New Category
                        </span>
                    </div>
                </div>
            )}

            {/* Empty State for Filter */}
            {filteredCats.length === 0 && categories.length > 0 && !isLoading && (
                <div className="text-center py-10">
                    <p className="text-gray-500 font-medium">No marketplace categories found for &ldquo;{typeFilter}&rdquo;</p>
                    <button onClick={() => setTypeFilter('all')} className="text-[#4C3B8A] text-sm font-semibold mt-2 hover:underline">
                        Clear filter
                    </button>
                </div>
            )}

            {/* Drawer */}
            <CategoryDrawer
                type="marketplace"
                mode={drawerMode || 'add'}
                category={selectedCat}
                isOpen={!!drawerMode}
                onClose={() => { setDrawerMode(null); setSelectedCat(null); }}
                onSuccess={() => { setDrawerMode(null); setSelectedCat(null); }}
            />
        </div>
    )
}
