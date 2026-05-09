'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

// Zod schemas
const mallCategorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 chars').max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens'),
    icon_url: z.string().max(500).optional().nullable(),
    parent: z.string().nullable().optional(),
    display_order: z.coerce.number().min(1).max(9999).optional(),
    is_active: z.boolean(),
})

const marketplaceCategorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 chars').max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens'),
    post_type: z.enum(['buy', 'rental', 'service', 'food']),
    is_active: z.boolean(),
})

interface CategoryDrawerProps {
    type: 'mall' | 'marketplace'
    mode: 'add' | 'edit'
    category?: any
    parentCategory?: any
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}


export default function CategoryDrawer({ type, mode, category, parentCategory, isOpen, onClose, onSuccess }: CategoryDrawerProps) {
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    // Fetch parent categories for Mall
    const { data: mallCategories } = useQuery({
        queryKey: ['admin-mall-categories'],
        queryFn: async () => {
            const res = await api.get('/mall/categories/')
            const payload = res.data?.data ?? res.data
            return payload?.results ?? payload ?? []
        },
        enabled: type === 'mall' && isOpen,
        staleTime: 60_000,
    })

    const isMall = type === 'mall'
    const schema = isMall ? mallCategorySchema : marketplaceCategorySchema
    const safeMallCategories = useMemo(
        () => Array.isArray(mallCategories) ? mallCategories : [],
        [mallCategories]
    )
    const parentOptions = useMemo(
        () => safeMallCategories.filter((c: any) => !c.parent && c.id !== category?.id),
        [safeMallCategories, category?.id]
    )

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            slug: '',
            is_active: true,
            ...(isMall ? { icon_url: '', parent: null, display_order: 1 } : { post_type: 'buy' })
        }
    })

    const watchName = watch('name')
    const watchIconUrl = watch('icon_url')
    const watchPostType = watch('post_type')
    const watchParent = watch('parent')
    const watchStatus = watch('is_active')

    // Auto-generate slug when name changes in ADD mode
    useEffect(() => {
        if (mode === 'add' && watchName) {
            const generated = watchName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            setValue('slug', generated, { shouldValidate: true })
        }
    }, [watchName, mode, setValue])

    // Pre-fill form in EDIT mode
    useEffect(() => {
        if (isOpen && mode === 'edit' && category) {
            reset({
                name: category.name,
                slug: category.slug,
                is_active: category.is_active,
                ...(isMall ? {
                    icon_url: category.icon_url || category.icon || '',
                    parent: category.parent || category.parent_id || null,
                    display_order: category.display_order || 1,
                } : {
                    post_type: category.post_type || 'buy'
                })
            })
        } else if (isOpen && mode === 'add') {
            // Display order sorts only within the selected sibling group.
            const siblingCategories = safeMallCategories.filter((c: any) => {
                return parentCategory?.id ? c.parent === parentCategory.id : !c.parent
            })
            const nextOrder = siblingCategories.length > 0
                ? Math.max(...siblingCategories.map((c: any) => c.display_order || 0)) + 1
                : 1
            
            reset({
                name: '',
                slug: '',
                is_active: true,
                ...(isMall ? { icon_url: '', parent: parentCategory?.id || null, display_order: nextOrder } : { post_type: 'buy' })
            })
        }
    }, [isOpen, mode, category, parentCategory, isMall, safeMallCategories, reset])

    const onSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            const payload = { ...data }
            // Handle empty parent string to null
            if (isMall && (!payload.parent || payload.parent === 'null' || payload.parent === 'none')) {
                payload.parent = null
            }
            if (isMall) {
                payload.parent_id = payload.parent
                delete payload.parent
                // Empty icon_url → null
                if (!payload.icon_url) payload.icon_url = null
            }

            const endpoint = isMall ? '/mall/categories/' : '/marketplace/categories/'
            
            if (mode === 'add') {
                await api.post(endpoint, payload)
                toast.success(`Category '${payload.name}' created successfully!`)
            } else {
                await api.patch(`${endpoint}${category.id}/`, payload)
                toast.success('Category updated.')
            }

            queryClient.invalidateQueries({ queryKey: [isMall ? 'admin-mall-categories' : 'admin-marketplace-categories'] })
            if (isMall) {
                queryClient.invalidateQueries({ queryKey: ['admin-mall-categories-tree'] })
            }
            onSuccess()
        } catch (error: any) {
            const errData = error.response?.data
            const errors = errData?.errors || errData
            const firstError = errors && typeof errors === 'object'
                ? Object.values(errors).flat().find(Boolean)
                : null

            if (errors?.slug) {
                toast.error('This slug is already taken. Try a different name.')
            } else if (firstError) {
                toast.error(String(firstError))
            } else if (errData?.message) {
                toast.error(errData.message)
            } else {
                toast.error(`Failed to ${mode} category.`)
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col border-0">
                <SheetHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <div>
                        <SheetTitle className="font-bold text-gray-900 text-lg">
                            {mode === 'add' ? 'New Category' : 'Edit Category'}
                        </SheetTitle>
                        <p className="text-xs text-gray-500 font-medium">
                            {isMall ? 'Mall Category' : 'Marketplace Category'}
                        </p>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label>Category Name <span className="text-red-500">*</span></Label>
                            <Input {...register('name')} placeholder="e.g. Electronics & Laptops" className={errors.name ? 'border-red-500' : ''} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
                        </div>

                        {/* Slug */}
                        <div className="space-y-1.5">
                            <Label>Slug <span className="text-red-500">*</span></Label>
                            <Input {...register('slug')} className={`font-mono text-sm ${errors.slug ? 'border-red-500' : ''}`} />
                            <p className="text-[10px] text-gray-400">Used in URLs: /categories/{watch('slug')}</p>
                            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message as string}</p>}
                        </div>

                        {/* MALL SPECIFIC FIELDS */}
                        {isMall && (
                            <>
                                {/* Icon URL */}
                                <div className="space-y-2 pt-2">
                                    <Label>Category Icon URL</Label>
                                    <Input
                                        {...register('icon_url')}
                                        placeholder="https://example.com/icon.png or /images/icon.svg"
                                        className="text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400">Paste a direct image URL for the category icon (PNG, SVG, WebP).</p>
                                    {watchIconUrl && (
                                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                            <img src={watchIconUrl} alt="preview" className="w-8 h-8 object-contain rounded" onError={e => (e.currentTarget.style.display = 'none')} />
                                            <span className="text-xs text-gray-500 truncate">{watchIconUrl}</span>
                                        </div>
                                    )}
                                    {errors.icon_url && <p className="text-xs text-red-500">{errors.icon_url.message as string}</p>}
                                </div>

                                {/* Parent */}
                                <div className="space-y-1.5">
                                    <Label>Parent Category</Label>
                                    <Select 
                                        value={watchParent || 'none'} 
                                        onValueChange={(val) => setValue('parent', val === 'none' ? null : val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="None (Main Category)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (Main Category)</SelectItem>
                                            {parentOptions.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-gray-400">Select a main category to move this under it, or choose none to make it a main category.</p>
                                </div>

                                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                    <p className="text-xs font-medium text-gray-600">
                                        Display order is managed automatically from drag and drop.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* MARKETPLACE SPECIFIC FIELDS */}
                        {!isMall && (
                            <div className="space-y-2 pt-2">
                                <Label>Applicable To <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                    {[
                                        { id: 'buy', label: 'Buy' },
                                        { id: 'rental', label: 'Rental' },
                                        { id: 'service', label: 'Services' },
                                        { id: 'food', label: 'Food' },
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setValue('post_type', type.id)}
                                            className={`py-2 rounded-lg text-xs font-bold transition-all border
                                                ${watchPostType === type.id 
                                                    ? 'bg-[#4C3B8A] text-white border-[#4C3B8A] shadow-md shadow-[#4C3B8A]/20' 
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#4C3B8A]/50'}
                                            `}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                                {errors.post_type && <p className="text-xs text-red-500">{errors.post_type.message as string}</p>}
                            </div>
                        )}

                        {/* Status Toggle */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <Label className="cursor-pointer">
                                <span className="block font-semibold text-gray-900">Category Status</span>
                                <span className={`text-xs ${watchStatus ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                                    {watchStatus ? 'Active' : 'Inactive'}
                                </span>
                            </Label>
                            <Switch checked={watchStatus} onCheckedChange={(c) => setValue('is_active', c)} />
                        </div>

                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50 flex-shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button form="category-form" type="submit" className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : (mode === 'add' ? 'Create Category' : 'Save Changes')}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
