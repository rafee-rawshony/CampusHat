'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { X, Loader2, ChevronDown, Pencil, Trash2, Plus, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { ImageUpload } from '@/components/common/ImageUpload'

const productSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(300),
    brand: z.string().optional(),
    sku: z.string().optional(),
    category: z.string().min(1, 'Select a category'),
    base_price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
    discount_price: z.coerce.number().min(0).optional().nullable(),
    stock_quantity: z.coerce.number().min(0),
    is_active: z.boolean(),
    short_description: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductVariant {
    id: string
    name: string
    sku: string | null
    price_override: string | null
    stock_quantity: number
    attributes: Record<string, string>
}

interface ProductFormPanelProps {
    editProduct: any | null
    onClose: () => void
}

function apiErrorMessage(error: any, fallback: string) {
    const data = error?.response?.data
    if (!data) return fallback
    if (typeof data === 'string') return data
    if (data.detail) return data.detail
    if (data.message && !data.errors) return data.message
    const errors = data.errors || data
    if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0]
        const firstValue = errors[firstKey]
        if (Array.isArray(firstValue)) return `${firstKey}: ${firstValue[0]}`
        if (typeof firstValue === 'string') return `${firstKey}: ${firstValue}`
        return `${firstKey}: Invalid value`
    }
    return data.message || fallback
}

// ─── Variants Section (only shown in edit mode) ────────────────────
function VariantsSection({ productSlug }: { productSlug: string }) {
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(true)
    const [addingVariant, setAddingVariant] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [formName, setFormName] = useState('')
    const [formSku, setFormSku] = useState('')
    const [formPrice, setFormPrice] = useState('')
    const [formStock, setFormStock] = useState('0')

    const { data: variants = [], isLoading } = useQuery<ProductVariant[]>({
        queryKey: ['product-variants', productSlug],
        queryFn: () =>
            api.get(`/mall/products/${productSlug}/variants/`)
                .then(r => r.data?.data || r.data || []),
        enabled: !!productSlug,
    })

    const resetForm = () => {
        setFormName('')
        setFormSku('')
        setFormPrice('')
        setFormStock('0')
    }

    const createMutation = useMutation({
        mutationFn: (payload: any) =>
            api.post(`/mall/products/${productSlug}/variants/`, payload),
        onSuccess: () => {
            toast.success('Variant added!')
            queryClient.invalidateQueries({ queryKey: ['product-variants', productSlug] })
            setAddingVariant(false)
            resetForm()
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to add variant')
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ vid, payload }: { vid: string; payload: any }) =>
            api.patch(`/mall/products/${productSlug}/variants/${vid}/`, payload),
        onSuccess: () => {
            toast.success('Variant updated!')
            queryClient.invalidateQueries({ queryKey: ['product-variants', productSlug] })
            setEditingId(null)
            resetForm()
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to update variant')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (vid: string) =>
            api.delete(`/mall/products/${productSlug}/variants/${vid}/`),
        onSuccess: () => {
            toast.success('Variant deleted')
            queryClient.invalidateQueries({ queryKey: ['product-variants', productSlug] })
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to delete variant')
        },
    })

    const handleSaveNew = () => {
        if (!formName.trim()) { toast.error('Variant name is required'); return }
        createMutation.mutate({
            name: formName.trim(),
            sku: formSku.trim() || null,
            price_override: formPrice ? parseFloat(formPrice) : null,
            stock_quantity: parseInt(formStock) || 0,
        })
    }

    const handleSaveEdit = (vid: string) => {
        if (!formName.trim()) { toast.error('Variant name is required'); return }
        updateMutation.mutate({
            vid,
            payload: {
                name: formName.trim(),
                sku: formSku.trim() || null,
                price_override: formPrice ? parseFloat(formPrice) : null,
                stock_quantity: parseInt(formStock) || 0,
            },
        })
    }

    const startEdit = (v: ProductVariant) => {
        setEditingId(v.id)
        setAddingVariant(false)
        setFormName(v.name)
        setFormSku(v.sku || '')
        setFormPrice(v.price_override || '')
        setFormStock(String(v.stock_quantity))
    }

    const handleDelete = (vid: string) => {
        if (!confirm('Delete this variant?')) return
        deleteMutation.mutate(vid)
    }

    const cancelForm = () => {
        setAddingVariant(false)
        setEditingId(null)
        resetForm()
    }

    const totalStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0)
    const isMutating = createMutation.isPending || updateMutation.isPending

    const renderFormRow = (vid?: string) => (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Red / XL"
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#4C3B8A] bg-white"
                />
                <input
                    value={formSku}
                    onChange={e => setFormSku(e.target.value)}
                    placeholder="SKU (optional)"
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#4C3B8A] bg-white"
                />
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="Same as product price"
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#4C3B8A] bg-white"
                />
                <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    placeholder="Stock"
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#4C3B8A] bg-white"
                />
            </div>
            <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={cancelForm} className="text-xs border-gray-200">
                    Cancel
                </Button>
                <Button
                    type="button"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => vid ? handleSaveEdit(vid) : handleSaveNew()}
                    className="bg-[#059669] hover:bg-[#047857] text-white text-xs gap-1"
                >
                    {isMutating && <Loader2 className="w-3 h-3 animate-spin" />}
                    {vid ? 'Save' : 'Add Variant'}
                </Button>
            </div>
        </div>
    )

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#4C3B8A]" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Variants</span>
                    {variants.length > 0 && (
                        <span className="text-[10px] bg-[#4C3B8A] text-white rounded-full px-1.5 py-0.5 font-bold">
                            {variants.length}
                        </span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                    ) : variants.length === 0 && !addingVariant ? (
                        <p className="text-sm text-gray-400 text-center py-4">No variants yet. Add size/color options above.</p>
                    ) : (
                        <div className="space-y-2">
                            {variants.map(v => (
                                editingId === v.id ? (
                                    <div key={v.id}>{renderFormRow(v.id)}</div>
                                ) : (
                                    <div
                                        key={v.id}
                                        className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2.5 hover:border-gray-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 text-sm flex-1 min-w-0">
                                            <span className="font-semibold text-gray-900 truncate">{v.name}</span>
                                            {v.sku && (
                                                <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{v.sku}</span>
                                            )}
                                            <span className={`text-xs font-bold ${v.price_override ? 'text-[#4C3B8A]' : 'text-gray-400'}`}>
                                                {v.price_override ? `৳${Number(v.price_override).toLocaleString()}` : '—'}
                                            </span>
                                            <span className="text-xs text-gray-500">{v.stock_quantity} in stock</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(v)}
                                                className="p-1.5 text-gray-400 hover:text-[#4C3B8A] rounded hover:bg-gray-50 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(v.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    {addingVariant && !editingId && renderFormRow()}

                    {!addingVariant && !editingId && (
                        <button
                            type="button"
                            onClick={() => { setAddingVariant(true); resetForm() }}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#4C3B8A] hover:text-[#2D1B69] transition-colors py-1"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Variant
                        </button>
                    )}

                    {variants.length > 0 && (
                        <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                            Total stock across variants: <span className="font-bold text-gray-700">{totalStock} units</span>
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Main Form Panel ───────────────────────────────────────────────
export function ProductFormPanel({ editProduct, onClose }: ProductFormPanelProps) {
    const queryClient = useQueryClient()
    const [imageUrls, setImageUrls] = useState<string[]>(Array(10).fill(''))

    const { data: categoriesData } = useQuery({
        queryKey: ['mall-categories', 'flat'],
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

    // Pre-fill for edit mode, reset for add mode
    useEffect(() => {
        if (editProduct) {
            reset({
                name: editProduct.name || '',
                brand: editProduct.brand?.name || editProduct.brand_name || '',
                sku: editProduct.sku || '',
                category: editProduct.category?.id || editProduct.category || '',
                base_price: parseFloat(editProduct.base_price) || 0,
                discount_price: editProduct.discount_price ? parseFloat(editProduct.discount_price) : undefined,
                stock_quantity: editProduct.stock_quantity || 0,
                is_active: editProduct.is_active ?? true,
                short_description: editProduct.short_description || '',
                description: editProduct.description || '',
            })
            const existingUrls = (editProduct.images || []).map((img: any) => img.image_url || img.image || '')
            setImageUrls([...existingUrls, ...Array(10).fill('')].slice(0, 10))
        } else {
            reset({ is_active: true, stock_quantity: 0, base_price: 0 })
            setImageUrls(Array(10).fill(''))
        }
    }, [editProduct, reset])

    const buildPayload = (data: ProductFormValues) => {
        return {
            name: data.name,
            brand: data.brand?.trim() || null,
            sku: data.sku?.trim() || null,
            category: data.category,
            base_price: data.base_price,
            discount_price: (data.discount_price && data.discount_price > 0) ? data.discount_price : null,
            stock_quantity: data.stock_quantity,
            is_active: data.is_active,
            has_variants: false,
            is_featured: false,
            short_description: data.short_description || '',
            description: data.description || '',
            image_urls: imageUrls.filter(url => url && url.trim()),
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
            toast.error(apiErrorMessage(err, 'Failed to add product'))
        },
    })

    const editMutation = useMutation({
        mutationFn: (payload: any) => api.patch(`/mall/products/${editProduct.slug || editProduct.id}/`, payload),
        onSuccess: () => {
            toast.success('Product updated!')
            queryClient.invalidateQueries({ queryKey: ['seller-products'] })
            onClose()
        },
        onError: (err: any) => {
            toast.error(apiErrorMessage(err, 'Failed to update product'))
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

    const setImageUrl = (index: number, url: string | null) => {
        setImageUrls(prev => {
            const next = [...prev]
            next[index] = url || ''
            return next
        })
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
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
                        <Select value={watch('category') || ''} onValueChange={(v) => setValue('category', v, { shouldDirty: true })}>
                            <SelectTrigger className="w-full text-sm border-gray-200 bg-gray-50 focus:ring-[#4C3B8A]">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat: any) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                        {cat.level > 1 ? '  '.repeat(cat.level - 1) + '↳ ' : ''}{cat.name}
                                    </SelectItem>
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

                {/* Variants Section */}
                {editProduct ? (
                    <VariantsSection productSlug={editProduct.slug} />
                ) : (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                        <p className="text-xs text-blue-700">
                            <strong>Variants:</strong> Save the product first, then add size/color variants from the edit view.
                        </p>
                    </div>
                )}

                {/* Product Images — up to 10 */}
                <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Product Images</label>
                    <p className="text-[11px] text-gray-500 -mt-1 mb-2">
                        Upload up to 10 photos. The first one is shown as the main image.
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {imageUrls.map((url, i) => (
                            <ImageUpload
                                key={i}
                                value={url || null}
                                onChange={(newUrl) => setImageUrl(i, newUrl)}
                                category="product"
                                variant="rectangle"
                                label={i === 0 ? 'Main image' : `Image ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Short Description */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Short Description <span className="text-gray-400 font-normal">(max 200 chars)</span>
                    </label>
                    <textarea
                        rows={2}
                        {...register('short_description')}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50 resize-none"
                        placeholder="Brief product summary..."
                    />
                    {errors.short_description && <p className="text-red-500 text-xs mt-1">{errors.short_description.message}</p>}
                </div>

                {/* Full Description */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Full Description <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                        rows={4}
                        {...register('description')}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50 resize-none"
                        placeholder="Detailed product description..."
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
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
