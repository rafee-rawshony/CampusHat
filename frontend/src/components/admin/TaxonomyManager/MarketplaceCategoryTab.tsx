'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag, ChevronRight, ChevronDown, FolderOpen, GripVertical } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import CategoryCard, { MarketplaceCategoryType } from './CategoryCard'
import MarketplaceCategoryDrawer from './MarketplaceCategoryDrawer'

// Main category types mapped to ad_type values
const AD_TYPES = [
    { id: 'sell', label: 'Buy & Sell', color: 'bg-purple-100 text-purple-700' },
    { id: 'rent', label: 'Rental', color: 'bg-green-100 text-green-700' },
    { id: 'service', label: 'Services', color: 'bg-blue-100 text-blue-700' },
    { id: 'food', label: 'Food', color: 'bg-amber-100 text-amber-700' },
]

// Extended type for hierarchical category data from API
interface CategoryNode {
    id: string
    name: string
    slug: string
    ad_type: string
    parent: string | null
    parent_name?: string
    sort_order: number
    is_active: boolean
    children: CategoryNode[]
    listing_count?: number
    children_count?: number
}

export default function MarketplaceCategoryTab() {
    const [activeType, setActiveType] = useState('sell')
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | null>(null)
    const [selectedCat, setSelectedCat] = useState<CategoryNode | null>(null)
    const [addParent, setAddParent] = useState<CategoryNode | null>(null)
    const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null)
    const [isSavingOrder, setIsSavingOrder] = useState(false)
    const queryClient = useQueryClient()

    // Fetch categories as tree for the active ad_type
    const { data: treeData, isLoading } = useQuery({
        queryKey: ['admin-marketplace-categories-tree', activeType],
        queryFn: async () => {
            const res = await api.get('/admin/marketplace/categories/', {
                params: { ad_type: activeType, view: 'tree' }
            })
            return res.data?.data || []
        },
        staleTime: 30_000,
    })

    const categories: CategoryNode[] = Array.isArray(treeData) ? treeData : []

    // Toggle expand/collapse for a category
    const toggleExpand = (catId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(catId)) {
                next.delete(catId)
            } else {
                next.add(catId)
            }
            return next
        })
    }

    // Toggle active/inactive status
    const handleToggleStatus = async (cat: CategoryNode) => {
        try {
            await api.post(`/admin/marketplace/categories/${cat.id}/toggle/`)
            toast.success(`Category ${!cat.is_active ? 'activated' : 'deactivated'}`)
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-categories-tree'] })
        } catch {
            toast.error('Failed to change category status')
        }
    }

    // Delete a category
    const handleDelete = async (cat: CategoryNode) => {
        if (!confirm(`Delete "${cat.name}" and all its subcategories?`)) return
        try {
            await api.delete(`/admin/marketplace/categories/${cat.id}/`)
            toast.success('Category deleted')
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-categories-tree'] })
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to delete category'
            toast.error(msg)
        }
    }

    // Open drawer in add mode (optionally as a child of a parent)
    const openAddDrawer = (parent?: CategoryNode) => {
        setSelectedCat(null)
        setAddParent(parent || null)
        setDrawerMode('add')
    }

    // Open drawer in edit mode
    const openEditDrawer = (cat: CategoryNode) => {
        setSelectedCat(cat)
        setAddParent(null)
        setDrawerMode('edit')
    }

    const saveOrder = async (ordered: CategoryNode[], previous: CategoryNode[]) => {
        setIsSavingOrder(true)
        try {
            await api.post('/admin/marketplace/categories/reorder/', {
                items: ordered.map((cat, idx) => ({ id: cat.id, sort_order: (idx + 1) * 10 })),
            })
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-categories-tree'] })
            toast.success('Category order saved')
        } catch (err: any) {
            queryClient.setQueryData(['admin-marketplace-categories-tree', activeType], previous)
            toast.error(err.response?.data?.message || 'Failed to save category order')
        } finally {
            setIsSavingOrder(false)
        }
    }

    const handleDrop = (targetId: string) => {
        if (!draggedCategoryId || draggedCategoryId === targetId) {
            setDraggedCategoryId(null)
            return
        }
        const from = categories.findIndex(c => c.id === draggedCategoryId)
        const to = categories.findIndex(c => c.id === targetId)
        if (from === -1 || to === -1) { setDraggedCategoryId(null); return }

        const previous = [...categories]
        const ordered = [...categories]
        const [moved] = ordered.splice(from, 1)
        ordered.splice(to, 0, moved)

        queryClient.setQueryData(['admin-marketplace-categories-tree', activeType], ordered)
        setDraggedCategoryId(null)
        saveOrder(ordered, previous)
    }

    const canDrag = categories.length > 1

    // Render a single category row with expand/collapse
    const renderCategoryRow = (cat: CategoryNode, level: number = 0) => {
        const isExpanded = expandedCategories.has(cat.id)
        const hasChildren = cat.children && cat.children.length > 0
        const indent = level * 24

        const isRoot = level === 0
        const isDragging = draggedCategoryId === cat.id

        return (
            <div key={cat.id}>
                <div
                    draggable={isRoot && canDrag}
                    onDragStart={() => isRoot && setDraggedCategoryId(cat.id)}
                    onDragOver={e => { if (isRoot && canDrag) e.preventDefault() }}
                    onDrop={() => isRoot && handleDrop(cat.id)}
                    onDragEnd={() => setDraggedCategoryId(null)}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/80 transition-colors group ${!cat.is_active ? 'opacity-60' : ''} ${isDragging ? 'bg-[#4C3B8A]/5 opacity-60' : ''}`}
                    style={{ paddingLeft: `${16 + indent}px` }}
                >
                    {/* Drag handle for root categories */}
                    {isRoot && (
                        <button type="button"
                            className={`hidden sm:flex w-6 h-6 items-center justify-center rounded text-gray-300 ${canDrag ? 'cursor-grab hover:bg-gray-100 hover:text-[#4C3B8A] active:cursor-grabbing' : 'cursor-default'}`}
                            title={canDrag ? 'Drag to reorder' : ''}>
                            <GripVertical className="w-4 h-4" />
                        </button>
                    )}
                    {/* Expand/collapse toggle */}
                    <button
                        onClick={() => hasChildren && toggleExpand(cat.id)}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${hasChildren ? 'hover:bg-gray-200 text-gray-500' : 'text-transparent cursor-default'}`}
                    >
                        {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                    </button>

                    {/* Category folder indicator */}
                    {level === 0 ? (
                        <div className="w-8 h-8 rounded-lg bg-[#4C3B8A]/10 flex items-center justify-center shrink-0">
                            <FolderOpen className="w-4 h-4 text-[#4C3B8A]" />
                        </div>
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    )}

                    {/* Name and slug */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm text-gray-900 truncate ${level === 0 ? '' : 'font-medium'}`}>
                                {cat.name}
                            </span>
                            {!cat.is_active && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-600 rounded">
                                    Inactive
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-400 font-mono">/{cat.slug}</span>
                    </div>

                    {/* Stats */}
                    <div className="text-xs text-gray-500 hidden sm:block">
                        {hasChildren && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium mr-2">
                                {cat.children.length} sub
                            </span>
                        )}
                        {cat.listing_count !== undefined && cat.listing_count > 0 && (
                            <span className="text-gray-400">{cat.listing_count} listings</span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {level === 0 && (
                            <button
                                onClick={() => openAddDrawer(cat)}
                                className="p-1.5 rounded-md hover:bg-[#4C3B8A]/10 text-[#4C3B8A] transition-colors"
                                title="Add subcategory"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => openEditDrawer(cat)}
                            className="px-2 py-1 text-xs font-semibold text-gray-600 hover:text-[#4C3B8A] hover:bg-[#4C3B8A]/10 rounded transition-colors"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleToggleStatus(cat)}
                            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${cat.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                            {cat.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                            onClick={() => handleDelete(cat)}
                            className="px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                {/* Render children if expanded */}
                {isExpanded && hasChildren && (
                    <div>
                        {cat.children.map(child => renderCategoryRow(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Main Category Type Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {AD_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => setActiveType(type.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border
                            ${activeType === type.id
                                ? 'bg-[#4C3B8A] text-white border-[#4C3B8A] shadow-md shadow-[#4C3B8A]/20'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#4C3B8A]/50'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Category Tree */}
            {isLoading ? (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 animate-pulse">
                            <div className="w-6 h-6 bg-gray-200 rounded" />
                            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                            <div className="flex-1">
                                <div className="w-32 h-4 bg-gray-200 rounded mb-1" />
                                <div className="w-20 h-3 bg-gray-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-xl text-center">
                    <Tag className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Categories Yet</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-6">
                        Create categories for the {AD_TYPES.find(t => t.id === activeType)?.label} section.
                    </p>
                    <button
                        onClick={() => openAddDrawer()}
                        className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                        + New Category
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-700">
                                {AD_TYPES.find(t => t.id === activeType)?.label} Categories
                            </h3>
                            <span className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-500 font-medium">
                                {categories.length} categories
                            </span>
                            <span className="hidden md:inline text-xs text-gray-400">Drag to reorder</span>
                            {isSavingOrder && <span className="text-xs text-[#4C3B8A] font-semibold">Saving...</span>}
                        </div>
                        <button
                            onClick={() => openAddDrawer()}
                            className="flex items-center gap-1.5 bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Category
                        </button>
                    </div>

                    {/* Tree rows */}
                    <div className="divide-y divide-gray-50">
                        {categories.map(cat => renderCategoryRow(cat))}
                    </div>
                </div>
            )}

            {/* Drawer */}
            <MarketplaceCategoryDrawer
                mode={drawerMode || 'add'}
                adType={activeType}
                category={selectedCat}
                parentCategory={addParent}
                isOpen={!!drawerMode}
                onClose={() => { setDrawerMode(null); setSelectedCat(null); setAddParent(null); }}
                onSuccess={() => {
                    setDrawerMode(null)
                    setSelectedCat(null)
                    setAddParent(null)
                    queryClient.invalidateQueries({ queryKey: ['admin-marketplace-categories-tree'] })
                }}
            />
        </div>
    )
}
