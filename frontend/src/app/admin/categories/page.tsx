'use client'

import React, { useState, useEffect } from 'react'
import { Tags, Plus, Search, ChevronRight, Folder, Tag, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from '@/components/ui/drawer'
import { useToast } from '@/hooks/use-toast'


interface Category {
    id: string
    name: string
    slug: string
    parent_id: string | null
    is_active: boolean
    children?: Category[]
}

export default function CategoriesPage() {
    const { toast } = useToast()
    const [categories, setCategories] = useState<Category[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [isAddingNew, setIsAddingNew] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parent_id: 'none',
        is_active: true
    })

    useEffect(() => {
        setIsLoading(true)
        // Mocking API fetch: api.get('/categories/tree/?include_inactive=true')
        setTimeout(() => {
            const mockData: Category[] = [
                {
                    id: '1', name: 'Electronics', slug: 'electronics', parent_id: null, is_active: true, children: [
                        { id: '11', name: 'Laptops', slug: 'laptops', parent_id: '1', is_active: true },
                        { id: '12', name: 'Calculators', slug: 'calculators', parent_id: '1', is_active: true },
                    ]
                },
                {
                    id: '2', name: 'Books', slug: 'books', parent_id: null, is_active: true, children: [
                        { id: '21', name: 'Engineering', slug: 'engineering', parent_id: '2', is_active: true },
                        { id: '22', name: 'Business', slug: 'business', parent_id: '2', is_active: false },
                    ]
                },
                { id: '3', name: 'Housing', slug: 'housing', parent_id: null, is_active: true }
            ]
            setCategories(mockData)
            setIsLoading(false)
        }, 700)
    }, [])

    // Flatten tree for dropdown selection
    const flattenCategories = (cats: Category[], prefix = ''): { id: string, name: string }[] => {
        let result: { id: string, name: string }[] = []
        cats.forEach(c => {
            result.push({ id: c.id, name: `${prefix}${c.name}` })
            if (c.children) {
                result = [...result, ...flattenCategories(c.children, `${prefix}${c.name} > `)]
            }
        })
        return result
    }
    const flatList = flattenCategories(categories)

    const openEditDrawer = (category: Category) => {
        setSelectedCategory(category)
        setIsAddingNew(false)
        setFormData({
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id || 'none',
            is_active: category.is_active
        })
        setIsDrawerOpen(true)
    }

    const openAddDrawer = () => {
        setSelectedCategory(null)
        setIsAddingNew(true)
        setFormData({ name: '', slug: '', parent_id: 'none', is_active: true })
        setIsDrawerOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast({ title: 'Validation Error', description: 'Name and slug are required.', variant: 'destructive' })
            return
        }

        try {
            // Mocking the save process (reload logic usually hands this off to server)
            toast({ title: 'Success', description: `Category ${isAddingNew ? 'created' : 'updated'}.` })
            setIsDrawerOpen(false)
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to modify category.', variant: 'destructive' })
        }
    }

    // Auto-generate slug from name
    const handleNameChange = (val: string) => {
        const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        setFormData(prev => ({ ...prev, name: val, slug: generatedSlug }))
    }

    // Recursive component to render tree nodes deeply
    const CategoryNode = ({ node, depth = 0 }: { node: Category, depth?: number }) => {

        // Skip rendering if searching and doesn't match
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.slug.toLowerCase().includes(searchTerm.toLowerCase())

        // If searching, we want to show matched nodes regardless of depth. 
        // If it doesn't match but child does, we still show the parent as a container.
        const childMatches = node.children?.some(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase())
        )

        if (searchTerm && !matchesSearch && !childMatches) {
            return null
        }

        return (
            <div className="flex flex-col">
                <div
                    onClick={() => openEditDrawer(node)}
                    className={`group flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer
                        ${depth === 0 ? 'border-t' : ''}`}
                    style={{ paddingLeft: `${(depth * 32) + 16}px` }}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${depth === 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                            {depth === 0 ? <Folder className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${node.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                    {node.name}
                                </span>
                                {!node.is_active && (
                                    <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>
                                )}
                            </div>
                            <span className="text-xs font-mono text-gray-400">/{node.slug}</span>
                        </div>
                    </div>

                    <div className="text-gray-300 group-hover:text-brand-primary transition-transform group-hover:translate-x-1">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </div>

                {/* Render children if any */}
                {node.children && node.children.length > 0 && (
                    <div className="flex flex-col border-l-2 border-gray-50 ml-6">
                        {node.children.map(child => (
                            <CategoryNode key={child.id} node={child} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        Taxonomy Manager
                    </h1>
                    <p className="text-gray-500 mt-1">Manage global categories for Mall and Marketplace logic.</p>
                </div>
                <Button onClick={openAddDrawer} className="bg-brand-primary hover:bg-brand-primary-hover text-white shadow-md rounded-xl font-bold h-11 px-6">
                    <Plus className="w-5 h-5 mr-1.5" /> Add Category
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                    placeholder="Search taxonomy nodes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-14 bg-white border-gray-200 rounded-2xl text-base shadow-sm focus-visible:ring-brand-primary"
                />
            </div>

            {/* Main Tree List */}
            <div className="flex-1 overflow-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-10">
                {isLoading ? (
                    <div className="flex flex-col animate-pulse">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 border-b border-gray-100 bg-gray-50/50" />)}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 h-full flex flex-col items-center justify-center">
                        <Tags className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900">No categories mapped</h3>
                        <p className="text-sm text-gray-500">Create a root category to get started.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Taxonomy Tree Hierarchy</span>
                        </div>
                        {categories.map(rootNode => (
                            <CategoryNode key={rootNode.id} node={rootNode} />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit/Add Drawer Sidebar Overlay */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
                <DrawerContent className="bg-white flex flex-col rounded-t-[10px] h-full w-[400px] mt-24 fixed bottom-0 right-0">
                    <DrawerHeader className="text-left border-b border-gray-100 pb-4">
                        <DrawerTitle className="font-extrabold text-2xl text-gray-900">
                            {isAddingNew ? 'Create Sub-category' : 'Edit Taxonomy Node'}
                        </DrawerTitle>
                        <DrawerDescription className="text-gray-500">
                            Updates propagate to Mall and Marketplace sorting immediately.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-6 flex-1 overflow-y-auto space-y-6">

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">Category Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => handleNameChange(e.target.value)}
                                placeholder="e.g. Smart Watches"
                                className="bg-gray-50 h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">URL Slug</Label>
                            <Input
                                value={formData.slug}
                                onChange={e => setFormData(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                className="bg-gray-50 h-10 font-mono text-sm text-gray-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">Parent Category</Label>
                            <Select
                                value={formData.parent_id}
                                onValueChange={(v) => setFormData(f => ({ ...f, parent_id: v }))}
                            >
                                <SelectTrigger className="bg-gray-50 h-12">
                                    <SelectValue placeholder="Select Parent" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" className="font-bold text-purple-700">-- ROOT CATEGORY --</SelectItem>
                                    {flatList.map(c => {
                                        // Prevent self-nesting
                                        if (!isAddingNew && selectedCategory && c.id === selectedCategory.id) return null
                                        return (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-gray-500">Setting as ROOT implies top-level navigation.</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-4 mt-6">
                            <div className="p-2 bg-yellow-100 rounded-full shrink-0">
                                <AlertCircle className="w-5 h-5 text-yellow-700" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-gray-900 mb-0.5">Visibility Status</h4>
                                <p className="text-xs text-gray-500 leading-tight">
                                    {formData.is_active
                                        ? 'Visible in public catalogues.'
                                        : 'Hidden. Existing items remain accessible via direct link.'}
                                </p>
                            </div>
                            <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData(f => ({ ...f, is_active: c }))} />
                        </div>
                    </div>

                    <DrawerFooter className="border-t border-gray-100 pt-4 pb-8 flex-row gap-3 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                        <Button variant="outline" className="flex-1 h-12" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                        <Button className="flex-1 h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold" onClick={handleSave}>
                            {isAddingNew ? 'Create Node' : 'Save Node'}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

        </div>
    )
}
