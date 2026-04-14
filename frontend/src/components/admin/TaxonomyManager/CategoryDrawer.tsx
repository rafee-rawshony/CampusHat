'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import * as icons from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
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
    icon: z.string().min(1, 'Please select an icon'),
    parent: z.string().nullable().optional(),
    display_order: z.coerce.number().min(1).max(999),
    is_active: z.boolean(),
})

const marketplaceCategorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 chars').max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens'),
    post_type: z.enum(['buy', 'rental', 'service', 'food']),
    is_active: z.boolean(),
})

type MallForm = z.infer<typeof mallCategorySchema>
type MarketplaceForm = z.infer<typeof marketplaceCategorySchema>

interface CategoryDrawerProps {
    type: 'mall' | 'marketplace'
    mode: 'add' | 'edit'
    category?: any
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const COMMON_ICONS = [
    'Monitor', 'Smartphone', 'Shirt', 'BookOpen', 'PenLine',
    'ShoppingBag', 'Home', 'Dumbbell', 'Palette', 'FlaskConical',
    'Package', 'Laptop', 'Headphones', 'Camera', 'Watch',
    'Car', 'Bike', 'Pizza', 'Coffee', 'Music'
]

const getIcon = (name: string) => {
    return (icons as Record<string, React.ElementType>)[name] || icons.Package
}

export default function CategoryDrawer({ type, mode, category, isOpen, onClose, onSuccess }: CategoryDrawerProps) {
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    // Fetch parent categories for Mall
    const { data: mallCategories = [] } = useQuery({
        queryKey: ['admin-mall-categories'],
        queryFn: async () => {
            const res = await api.get('/mall/categories/')
            return res.data?.data?.results || res.data?.results || res.data || []
        },
        enabled: type === 'mall' && isOpen,
        staleTime: 60_000,
    })

    const isMall = type === 'mall'
    const schema = isMall ? mallCategorySchema : marketplaceCategorySchema
    const safeMallCategories = Array.isArray(mallCategories) ? mallCategories : []

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            slug: '',
            is_active: true,
            ...(isMall ? { icon: 'Package', parent: null, display_order: 1 } : { post_type: 'buy' })
        }
    })

    const watchName = watch('name')
    const watchIcon = watch('icon')
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
                    icon: category.icon || 'Package',
                    parent: category.parent || null,
                    display_order: category.display_order || 1,
                } : {
                    post_type: category.post_type || 'buy'
                })
            })
        } else if (isOpen && mode === 'add') {
            // Calculate next order for new mall category
            const nextOrder = safeMallCategories.length > 0 
                ? Math.max(...safeMallCategories.map((c: any) => c.display_order || 0)) + 1 
                : 1
            
            reset({
                name: '',
                slug: '',
                is_active: true,
                ...(isMall ? { icon: 'Package', parent: null, display_order: nextOrder } : { post_type: 'buy' })
            })
        }
    }, [isOpen, mode, category, isMall, mallCategories, reset])

    const onSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            const payload = { ...data }
            // Handle empty parent string to null
            if (isMall && (!payload.parent || payload.parent === 'null' || payload.parent === 'none')) {
                payload.parent = null
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
            onSuccess()
        } catch (error: any) {
            const errData = error.response?.data
            if (errData?.slug) {
                toast.error('This slug is already taken. Try a different name.')
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
                    <SheetClose className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors" />
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
                                {/* Icon Picker */}
                                <div className="space-y-2 pt-2">
                                    <Label>Category Icon <span className="text-red-500">*</span></Label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {COMMON_ICONS.map(iconName => {
                                            const IconComp = getIcon(iconName)
                                            const isSelected = watchIcon === iconName
                                            return (
                                                <button
                                                    key={iconName}
                                                    type="button"
                                                    onClick={() => setValue('icon', iconName, { shouldValidate: true })}
                                                    className={`aspect-square border rounded-lg flex flex-col items-center justify-center gap-1 transition-all
                                                        ${isSelected ? 'border-[#4C3B8A] bg-[#4C3B8A]/10' : 'border-gray-200 hover:border-[#4C3B8A] bg-white'}
                                                    `}
                                                >
                                                    <IconComp className={`w-5 h-5 ${isSelected ? 'text-[#4C3B8A]' : 'text-gray-600'}`} strokeWidth={isSelected ? 2.5 : 2} />
                                                    <span className={`text-[9px] truncate w-full text-center px-0.5 ${isSelected ? 'text-[#4C3B8A] font-bold' : 'text-gray-400 font-medium'}`}>
                                                        {iconName}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <Input 
                                        {...register('icon')} 
                                        placeholder="Or type icon name manually..." 
                                        className="mt-2 text-sm font-mono h-9" 
                                    />
                                    {errors.icon && <p className="text-xs text-red-500">{errors.icon.message as string}</p>}
                                </div>

                                {/* Parent */}
                                <div className="space-y-1.5">
                                    <Label>Parent Category</Label>
                                    <Select 
                                        value={watchParent || 'none'} 
                                        onValueChange={(val) => setValue('parent', val === 'none' ? null : val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="None (Top Level)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (Top Level)</SelectItem>
                                            {safeMallCategories
                                                .filter((c: any) => c.id !== category?.id) // prevent self-parenting
                                                .map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Display Order */}
                                <div className="space-y-1.5">
                                    <Label>Display Order <span className="text-red-500">*</span></Label>
                                    <Input type="number" {...register('display_order')} className={errors.display_order ? 'border-red-500' : ''} />
                                    <p className="text-[10px] text-gray-400">Lower numbers appear first.</p>
                                    {errors.display_order && <p className="text-xs text-red-500">{errors.display_order.message as string}</p>}
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
