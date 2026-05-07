'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as icons from 'lucide-react'
import { ChevronDown, ChevronRight, FolderOpen, GripVertical, Plus, Search, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import CategoryDrawer from './CategoryDrawer'

interface MallCategoryNode {
    id: string
    name: string
    slug: string
    icon: string | null
    icon_url?: string | null
    parent: string | null
    parent_name?: string
    display_order: number
    is_active: boolean
    product_count?: number
    level: number
    sort_order: number
    children: MallCategoryNode[]
}

const getIcon = (name?: string | null) => {
    return name ? (icons as unknown as Record<string, React.ElementType>)[name] || icons.Package : icons.FolderOpen
}

export default function MallCategoryTab() {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | null>(null)
    const [selectedCat, setSelectedCat] = useState<MallCategoryNode | null>(null)
    const [addParent, setAddParent] = useState<MallCategoryNode | null>(null)
    const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null)
    const [isSavingOrder, setIsSavingOrder] = useState(false)
    const queryClient = useQueryClient()

    const { data: treeData, isLoading } = useQuery({
        queryKey: ['admin-mall-categories-tree'],
        queryFn: async () => {
            const res = await api.get('/mall/categories/tree/')
            return res.data?.data || []
        },
        staleTime: 30_000,
    })

    const categories: MallCategoryNode[] = useMemo(
        () => Array.isArray(treeData) ? treeData : [],
        [treeData]
    )

    const matchesSearch = (cat: MallCategoryNode): boolean => {
        const term = searchTerm.toLowerCase()
        return (
            cat.name.toLowerCase().includes(term) ||
            cat.slug.toLowerCase().includes(term) ||
            cat.children?.some(matchesSearch)
        )
    }

    const visibleCategories = searchTerm ? categories.filter(matchesSearch) : categories
    const canDragMainCategories = !searchTerm && categories.length > 1

    const toggleExpand = (catId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            next.has(catId) ? next.delete(catId) : next.add(catId)
            return next
        })
    }

    const handleToggleStatus = async (cat: MallCategoryNode) => {
        try {
            await api.patch(`/mall/categories/${cat.id}/`, { is_active: !cat.is_active })
            toast.success(`Category ${!cat.is_active ? 'activated' : 'deactivated'}`)
            queryClient.invalidateQueries({ queryKey: ['admin-mall-categories-tree'] })
            queryClient.invalidateQueries({ queryKey: ['admin-mall-categories'] })
        } catch {
            toast.error('Failed to change category status')
        }
    }

    const handleDelete = async (cat: MallCategoryNode) => {
        if (!confirm(`Delete "${cat.name}" and its subcategories?`)) return
        try {
            await api.delete(`/mall/categories/${cat.id}/`)
            toast.success('Category deleted')
            queryClient.invalidateQueries({ queryKey: ['admin-mall-categories-tree'] })
            queryClient.invalidateQueries({ queryKey: ['admin-mall-categories'] })
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete category')
        }
    }

    const openAddDrawer = (parent?: MallCategoryNode) => {
        setSelectedCat(null)
        setAddParent(parent || null)
        setDrawerMode('add')
    }

    const openEditDrawer = (cat: MallCategoryNode) => {
        setSelectedCat(cat)
        setAddParent(null)
        setDrawerMode('edit')
    }

    const saveMainCategoryOrder = async (orderedCategories: MallCategoryNode[], previousCategories: MallCategoryNode[]) => {
        setIsSavingOrder(true)
        try {
            await api.post('/mall/categories/reorder/', {
                parent_id: null,
                category_ids: orderedCategories.map(cat => cat.id),
            })
            queryClient.invalidateQueries({ queryKey: ['admin-mall-categories'] })
            toast.success('Category order saved')
        } catch (err: any) {
            queryClient.setQueryData(['admin-mall-categories-tree'], previousCategories)
            toast.error(err.response?.data?.message || 'Failed to save category order')
        } finally {
            setIsSavingOrder(false)
        }
    }

    const handleDropMainCategory = (targetId: string) => {
        if (!draggedCategoryId || draggedCategoryId === targetId || searchTerm) {
            setDraggedCategoryId(null)
            return
        }

        const fromIndex = categories.findIndex(cat => cat.id === draggedCategoryId)
        const toIndex = categories.findIndex(cat => cat.id === targetId)
        if (fromIndex === -1 || toIndex === -1) {
            setDraggedCategoryId(null)
            return
        }

        const previousCategories = [...categories]
        const orderedCategories = [...categories]
        const [movedCategory] = orderedCategories.splice(fromIndex, 1)
        orderedCategories.splice(toIndex, 0, movedCategory)

        const normalizedCategories = orderedCategories.map((cat, index) => ({
            ...cat,
            display_order: (index + 1) * 10,
            sort_order: (index + 1) * 10,
        }))

        queryClient.setQueryData(['admin-mall-categories-tree'], normalizedCategories)
        setDraggedCategoryId(null)
        saveMainCategoryOrder(normalizedCategories, previousCategories)
    }

    const renderCategoryRow = (cat: MallCategoryNode, level: number = 0) => {
        const isExpanded = expandedCategories.has(cat.id) || !!searchTerm
        const hasChildren = cat.children && cat.children.length > 0
        const Icon = getIcon(cat.icon || cat.icon_url)
        const isRoot = level === 0
        const isDragging = draggedCategoryId === cat.id

        return (
            <div key={cat.id}>
                <div
                    draggable={isRoot && canDragMainCategories}
                    onDragStart={() => isRoot && setDraggedCategoryId(cat.id)}
                    onDragOver={(event) => {
                        if (isRoot && canDragMainCategories) event.preventDefault()
                    }}
                    onDrop={() => isRoot && handleDropMainCategory(cat.id)}
                    onDragEnd={() => setDraggedCategoryId(null)}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/80 transition-colors group ${!cat.is_active ? 'opacity-60' : ''} ${isDragging ? 'bg-[#4C3B8A]/5 opacity-70' : ''} ${draggedCategoryId && isRoot && !isDragging ? 'border-t border-t-[#4C3B8A]/20' : ''}`}
                    style={{ paddingLeft: `${16 + level * 24}px` }}
                >
                    {isRoot && (
                        <button
                            type="button"
                            className={`hidden sm:flex w-6 h-6 items-center justify-center rounded text-gray-300 transition-colors ${canDragMainCategories ? 'cursor-grab hover:bg-gray-100 hover:text-[#4C3B8A] active:cursor-grabbing' : 'cursor-default'}`}
                            title={canDragMainCategories ? 'Drag to reorder' : 'Reorder is available when not searching'}
                        >
                            <GripVertical className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        onClick={() => hasChildren && toggleExpand(cat.id)}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${hasChildren ? 'hover:bg-gray-200 text-gray-500' : 'text-transparent cursor-default'}`}
                    >
                        {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                    </button>

                    {level === 0 ? (
                        <div className="w-8 h-8 rounded-lg bg-[#4C3B8A]/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-[#4C3B8A]" />
                        </div>
                    ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 truncate">{cat.name}</span>
                            {!cat.is_active && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-600 rounded">
                                    Inactive
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-400 font-mono">/{cat.slug}</span>
                    </div>

                    <div className="text-xs text-gray-500 hidden sm:block">
                        {isRoot && (
                            <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full font-medium mr-2">
                                Order {cat.display_order}
                            </span>
                        )}
                        {hasChildren && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium mr-2">
                                {cat.children.length} sub
                            </span>
                        )}
                        {cat.product_count !== undefined && cat.product_count > 0 && (
                            <span className="text-gray-400">{cat.product_count} products</span>
                        )}
                    </div>

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

                {isExpanded && hasChildren && (
                    <div>{cat.children.map(child => renderCategoryRow(child, level + 1))}</div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search categories by name or slug..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 bg-gray-50 border-gray-200"
                    />
                </div>
                <button
                    onClick={() => openAddDrawer()}
                    className="flex items-center gap-1.5 bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Category
                </button>
            </div>

            {isLoading ? (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    {[...Array(8)].map((_, i) => (
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
            ) : visibleCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-xl text-center">
                    <Tag className="w-12 h-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No Mall Categories</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-6">Create categories to organize products in the campus mall.</p>
                    <button
                        onClick={() => openAddDrawer()}
                        className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                        + New Category
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-[#4C3B8A]" />
                            <h3 className="text-sm font-bold text-gray-700">Mall Categories</h3>
                            <span className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-500 font-medium">
                                {categories.length} main categories
                            </span>
                            <span className="hidden md:inline text-xs text-gray-400">
                                Drag main categories to reorder
                            </span>
                            {isSavingOrder && (
                                <span className="text-xs text-[#4C3B8A] font-semibold">
                                    Saving order...
                                </span>
                            )}
                        </div>
                    </div>
                    <div>{visibleCategories.map(cat => renderCategoryRow(cat))}</div>
                </div>
            )}

            <CategoryDrawer
                type="mall"
                mode={drawerMode || 'add'}
                category={selectedCat}
                parentCategory={addParent}
                isOpen={!!drawerMode}
                onClose={() => { setDrawerMode(null); setSelectedCat(null); setAddParent(null) }}
                onSuccess={() => {
                    setDrawerMode(null)
                    setSelectedCat(null)
                    setAddParent(null)
                    queryClient.invalidateQueries({ queryKey: ['admin-mall-categories-tree'] })
                    queryClient.invalidateQueries({ queryKey: ['admin-mall-categories'] })
                }}
            />
        </div>
    )
}
