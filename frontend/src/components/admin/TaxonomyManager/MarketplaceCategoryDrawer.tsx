'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

// Validation schema
const categorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 chars').max(100),
    slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, hyphens'),
    sort_order: z.coerce.number().min(0).max(999),
    is_active: z.boolean(),
    parent: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof categorySchema>

interface CategoryNode {
    id: string
    name: string
    slug: string
    ad_type: string
    parent: string | null
    sort_order: number
    is_active: boolean
    children?: CategoryNode[]
}

interface MarketplaceCategoryDrawerProps {
    mode: 'add' | 'edit'
    adType: string
    category?: CategoryNode | null
    parentCategory?: CategoryNode | null
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const AD_TYPE_LABELS: Record<string, string> = {
    sell: 'Buy & Sell',
    rent: 'Rental',
    service: 'Services',
    food: 'Food',
}

export default function MarketplaceCategoryDrawer({
    mode,
    adType,
    category,
    parentCategory,
    isOpen,
    onClose,
    onSuccess,
}: MarketplaceCategoryDrawerProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Fetch root categories for parent dropdown
    const { data: rootCategories = [] } = useQuery({
        queryKey: ['admin-marketplace-root-cats', adType],
        queryFn: async () => {
            const res = await api.get('/admin/marketplace/categories/', {
                params: { ad_type: adType, parent: 'root' }
            })
            return res.data?.data || []
        },
        enabled: isOpen,
        staleTime: 30_000,
    })

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
        resolver: zodResolver(categorySchema) as any,
        defaultValues: {
            name: '',
            slug: '',
            sort_order: 0,
            is_active: true,
            parent: null,
        }
    })

    const watchName = watch('name')
    const watchParent = watch('parent')
    const watchStatus = watch('is_active')

    // Auto-generate slug from name in add mode
    useEffect(() => {
        if (mode === 'add' && watchName) {
            const generated = `${adType}-${watchName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            setValue('slug', generated, { shouldValidate: true })
        }
    }, [watchName, mode, adType, setValue])

    // Pre-fill form
    useEffect(() => {
        if (!isOpen) return

        if (mode === 'edit' && category) {
            reset({
                name: category.name,
                slug: category.slug,
                sort_order: category.sort_order,
                is_active: category.is_active,
                parent: category.parent || null,
            })
        } else if (mode === 'add') {
            reset({
                name: '',
                slug: '',
                sort_order: 0,
                is_active: true,
                parent: parentCategory?.id || null,
            })
        }
    }, [isOpen, mode, category, parentCategory, reset])

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true)
        try {
            const payload: any = {
                name: data.name,
                slug: data.slug,
                sort_order: data.sort_order,
                is_active: data.is_active,
            }

            if (mode === 'add') {
                payload.ad_type = adType
                payload.parent = data.parent || null
                await api.post('/admin/marketplace/categories/', payload)
                toast.success(`Category "${data.name}" created!`)
            } else if (category) {
                await api.patch(`/admin/marketplace/categories/${category.id}/`, payload)
                toast.success('Category updated.')
            }

            onSuccess()
        } catch (error: any) {
            const errData = error.response?.data
            if (errData?.slug) {
                toast.error('This slug is already taken.')
            } else if (errData?.name) {
                toast.error(Array.isArray(errData.name) ? errData.name[0] : errData.name)
            } else {
                toast.error(`Failed to ${mode} category.`)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const isSubcategory = !!watchParent || !!parentCategory

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col border-0">
                <SheetHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <div>
                        <SheetTitle className="font-bold text-gray-900 text-lg">
                            {mode === 'add' ? (isSubcategory ? 'New Subcategory' : 'New Category') : 'Edit Category'}
                        </SheetTitle>
                        <p className="text-xs text-gray-500 font-medium">
                            {AD_TYPE_LABELS[adType] || adType}
                            {parentCategory && ` / ${parentCategory.name}`}
                        </p>
                    </div>
                    <SheetClose className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors" />
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    <form id="mp-category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label>Category Name <span className="text-red-500">*</span></Label>
                            <Input
                                {...register('name')}
                                placeholder={isSubcategory ? 'e.g. Smartphones' : 'e.g. Electronics'}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Slug */}
                        <div className="space-y-1.5">
                            <Label>Slug <span className="text-red-500">*</span></Label>
                            <Input
                                {...register('slug')}
                                className={`font-mono text-sm ${errors.slug ? 'border-red-500' : ''}`}
                            />
                            <p className="text-[10px] text-gray-400">Used for filtering: /{watch('slug')}</p>
                            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
                        </div>

                        {/* Parent selector (only for add mode, creating subcategory) */}
                        {mode === 'add' && !parentCategory && (
                            <div className="space-y-1.5">
                                <Label>Parent Category</Label>
                                <Select
                                    value={watchParent || 'none'}
                                    onValueChange={(val) => setValue('parent', val === 'none' ? null : val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="None (Root Level)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Root Level Category)</SelectItem>
                                        {(rootCategories as CategoryNode[]).map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-gray-400">
                                    Leave as &quot;None&quot; for a top-level category, or select a parent for a subcategory.
                                </p>
                            </div>
                        )}

                        {/* Parent info when adding under a specific parent */}
                        {parentCategory && (
                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                                <p className="text-xs font-medium text-purple-700">
                                    Adding subcategory under: <strong>{parentCategory.name}</strong>
                                </p>
                            </div>
                        )}

                        {/* Sort Order */}
                        <div className="space-y-1.5">
                            <Label>Sort Order</Label>
                            <Input
                                type="number"
                                {...register('sort_order')}
                                className={errors.sort_order ? 'border-red-500' : ''}
                            />
                            <p className="text-[10px] text-gray-400">Lower numbers appear first.</p>
                            {errors.sort_order && <p className="text-xs text-red-500">{errors.sort_order.message}</p>}
                        </div>

                        {/* Status Toggle */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <Label className="cursor-pointer">
                                <span className="block font-semibold text-gray-900">Category Status</span>
                                <span className={`text-xs ${watchStatus ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                                    {watchStatus ? 'Active — visible to users' : 'Inactive — hidden from users'}
                                </span>
                            </Label>
                            <Switch checked={watchStatus} onCheckedChange={(c) => setValue('is_active', c)} />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50 flex-shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        form="mp-category-form"
                        type="submit"
                        className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                            mode === 'add' ? 'Create Category' : 'Save Changes'
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
