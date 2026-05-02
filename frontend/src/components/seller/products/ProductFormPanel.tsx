'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ImageUpload } from '@/components/common/ImageUpload'

const productSchema = z.object({
    name: z.string().min(3).max(300),
    brand: z.string().optional(),
    sku: z.string().optional(),
    category: z.string().min(1, 'Select a category'),
    base_price: z.coerce.number().min(0),
    discount_price: z.coerce.number().min(0).optional().nullable(),
    stock_quantity: z.coerce.number().min(0),
    is_active: z.boolean(),
    image_url_1: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    image_url_2: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    image_url_3: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    short_description: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormPanelProps {
    editProduct: any | null
    onClose: () => void
}

export function ProductFormPanel({ editProduct, onClose }: ProductFormPanelProps) {
    const queryClient = useQueryClient()

    const { data: categoriesData } = useQuery({
        queryKey: ['mall-categories'],
        queryFn: () => api.get('/mall/categories/').then(r => {
            const res = r.data?.data?.results || r.data?.results || r.data?.data || r.data
            return Array.isArray(res) ? res : []
        }),
        staleTime: 300_000,
    })

    const categories: any[] = categoriesData || []

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            is_active: true,
            stock_quantity: 0,
            base_price: 0,
        },
    })

    // Pre-fill for edit mode
    useEffect(() => {
        if (editProduct) {
            reset({
                name: editProduct.name || '',
                brand: editProduct.brand || '',
                sku: editProduct.sku || '',
                category: editProduct.category?.id || editProduct.category || '',
                base_price: parseFloat(editProduct.base_price) || 0,
                discount_price: editProduct.discount_price ? parseFloat(editProduct.discount_price) : undefined,
                stock_quantity: editProduct.stock_quantity || 0,
                is_active: editProduct.is_active ?? true,
                image_url_1: editProduct.images?.[0]?.image || editProduct.images?.[0]?.image_url || '',
                image_url_2: editProduct.images?.[1]?.image || editProduct.images?.[1]?.image_url || '',
                image_url_3: editProduct.images?.[2]?.image || editProduct.images?.[2]?.image_url || '',
                short_description: editProduct.short_description || '',
                description: editProduct.description || '',
            })
        }
    }, [editProduct, reset])

    const buildPayload = (data: ProductFormValues) => {
        const images = [data.image_url_1, data.image_url_2, data.image_url_3]
            .filter(Boolean)
            .map((url, i) => ({ image: url, is_primary: i === 0 }))

        return {
            name: data.name,
            brand: data.brand,
            sku: data.sku,
            category: data.category,
            base_price: data.base_price,
            discount_price: data.discount_price || null,
            stock_quantity: data.stock_quantity,
            is_active: data.is_active,
            short_description: data.short_description,
            description: data.description,
            images,
        }
    }

    const addMutation = useMutation({
        mutationFn: (payload: any) => api.post('/mall/products/', payload),
        onSuccess: () => {
            toast.success('Product added!')
            queryClient.invalidateQueries({ queryKey: ['seller-products'] })
            queryClient.invalidateQueries({ queryKey: ['seller-stats'] })
            onClose()
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.detail || 'Failed to add product'
            toast.error(msg)
        },
    })

    const editMutation = useMutation({
        mutationFn: (payload: any) => api.patch(`/mall/products/${editProduct.id}/`, payload),
        onSuccess: () => {
            toast.success('Product updated!')
            queryClient.invalidateQueries({ queryKey: ['seller-products'] })
            onClose()
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.detail || 'Failed to update product'
            toast.error(msg)
        },
    })

    const onSubmit = (data: ProductFormValues) => {
        const payload = buildPayload(data)
        if (editProduct) {
            editMutation.mutate(payload)
        } else {
            addMutation.mutate(payload)
        }
    }

    const isLoading = addMutation.isPending || editMutation.isPending
    const isActive = watch('is_active')

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900 text-base">
                    {editProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Row 1: Name + Brand */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Name *</label>
                        <input
                            {...register('name')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="e.g. Dell Laptop 15 inch"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Brand</label>
                        <input
                            {...register('brand')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="e.g. Dell, Samsung, Local"
                        />
                    </div>
                </div>

                {/* Row 2: SKU + Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">SKU</label>
                        <input
                            {...register('sku')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="e.g. ELEC-001"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category *</label>
                        <Select onValueChange={(v) => setValue('category', v)} defaultValue={editProduct?.category?.id || ''}>
                            <SelectTrigger className="w-full text-sm border-gray-200 bg-gray-50 focus:ring-[#4C3B8A]">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat: any) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                    </div>
                </div>

                {/* Row 3: Price + Original Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price (৳) *</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('base_price')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="0.00"
                        />
                        {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Original Price (৳) <span className="text-gray-400 font-normal">— for crossed-out price</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register('discount_price')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="Leave blank if no discount"
                        />
                    </div>
                </div>

                {/* Row 4: Stock + Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Stock Level *</label>
                        <input
                            type="number"
                            min="0"
                            {...register('stock_quantity')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="0"
                        />
                        {errors.stock_quantity && <p className="text-red-500 text-xs mt-1">{errors.stock_quantity.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                        <div className="flex items-center gap-3 mt-2">
                            <Switch
                                checked={isActive}
                                onCheckedChange={(v) => setValue('is_active', v)}
                            />
                            <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                {isActive ? 'Active (In Stock)' : 'Draft (Inactive)'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Row 5: Product Images — first one is the main, rest are gallery. */}
                <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Product Images</label>
                    <p className="text-[11px] text-gray-500 -mt-1 mb-2">
                        Upload up to 3 photos. The first one is shown as the main image.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {(['image_url_1', 'image_url_2', 'image_url_3'] as const).map((field, i) => (
                            <div key={field}>
                                <ImageUpload
                                    value={watch(field)}
                                    onChange={(url) => setValue(field, url || '', { shouldDirty: true })}
                                    category="product"
                                    variant="rectangle"
                                    label={i === 0 ? 'Main image' : `Image ${i + 1}`}
                                />
                                {/* Hidden input still registered so the form submit picks it up */}
                                <input type="hidden" {...register(field)} />
                            </div>
                        ))}
                    </div>
                    {(errors.image_url_1 || errors.image_url_2 || errors.image_url_3) && (
                        <p className="text-red-500 text-xs">One of the images is invalid.</p>
                    )}
                </div>

                {/* Row 6: Short Description */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Short Description <span className="text-gray-400 font-normal">(max 200 chars)</span></label>
                    <textarea
                        rows={2}
                        {...register('short_description')}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50 resize-none"
                        placeholder="Brief product summary..."
                    />
                </div>

                {/* Row 7: Full Description */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Description <span className="text-gray-400 font-normal">(max 1000 chars)</span></label>
                    <textarea
                        rows={4}
                        {...register('description')}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50 resize-none"
                        placeholder="Detailed product description..."
                    />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={onClose} className="border-gray-200">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#059669] hover:bg-[#047857] text-white font-semibold gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {editProduct ? 'Save Changes' : 'Add Product'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
