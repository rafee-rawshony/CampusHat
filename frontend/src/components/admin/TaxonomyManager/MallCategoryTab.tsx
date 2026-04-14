'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import CategoryCard, { MallCategoryType } from './CategoryCard'
import CategoryDrawer from './CategoryDrawer'

export default function MallCategoryTab() {
    const [searchTerm, setSearchTerm] = useState('')
    const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | null>(null)
    const [selectedCat, setSelectedCat] = useState<MallCategoryType | null>(null)
    const queryClient = useQueryClient()

    const { data: mallData, isLoading } = useQuery({
        queryKey: ['admin-mall-categories'],
        queryFn: async () => {
            const res = await api.get('/mall/categories/')
            return res.data?.data?.results || res.data?.results || res.data || []
        },
        staleTime: 60_000,
    })

    const categories: MallCategoryType[] = Array.isArray(mallData) ? mallData : []

    const filteredCats = categories.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleToggleStatus = async (cat: MallCategoryType) => {
        try {
            await api.patch(`/mall/categories/${cat.id}/`, { is_active: !cat.is_active })
            toast.success(`Category ${!cat.is_active ? 'Activated' : 'Deactivated'}`)
            queryClient.invalidateQueries({ queryKey: ['admin-mall-categories'] })
        } catch {
            toast.error('Failed to change category status')
        }
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                        placeholder="Search categories by name or slug..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 bg-gray-50 border-gray-200"
                    />
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 h-[120px] animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
                            <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
                            <div className="w-1/2 h-3 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredCats.length === 0 && !searchTerm ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-xl text-center">
                    <Tag className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Mall Categories</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-6">Create categories to organize products in the campus mall.</p>
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
                            type="mall"
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

            {/* Empty State for Search */}
            {filteredCats.length === 0 && searchTerm && !isLoading && (
                <div className="text-center py-10">
                    <p className="text-gray-500 font-medium">No mall categories match &ldquo;{searchTerm}&rdquo;</p>
                    <button onClick={() => setSearchTerm('')} className="text-[#4C3B8A] text-sm font-semibold mt-2 hover:underline">
                        Clear search
                    </button>
                </div>
            )}

            {/* Drawer */}
            <CategoryDrawer
                type="mall"
                mode={drawerMode || 'add'}
                category={selectedCat}
                isOpen={!!drawerMode}
                onClose={() => { setDrawerMode(null); setSelectedCat(null); }}
                onSuccess={() => { setDrawerMode(null); setSelectedCat(null); }}
            />
        </div>
    )
}
