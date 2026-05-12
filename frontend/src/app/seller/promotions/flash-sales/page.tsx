'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
    Zap, Plus, Loader2, Search, Clock, CheckCircle2, XCircle, ShoppingBag, AlertTriangle,
    Pencil, Trash2, Check, X as XIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { normalizeListResponse } from '@/lib/response'

interface FlashSaleProduct {
    id: string
    product: any
    product_id?: string
    product_name: string
    original_price: string
    override_price: string
    sale_price: string
    quantity_limit: number | null
    sold_count: number
    store_id?: string
}

interface FlashSale {
    id: string
    title: string
    description?: string
    discount_percentage?: string
    starts_at: string
    ends_at: string
    is_active: boolean
    products?: FlashSaleProduct[]
}

function useCountdown(endsAt: string) {
    const calcRemaining = useCallback(() => {
        const diff = new Date(endsAt).getTime() - Date.now()
        if (diff <= 0) return null
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        return `${h}h ${m}m ${s}s`
    }, [endsAt])

    const [remaining, setRemaining] = useState(calcRemaining)

    useEffect(() => {
        const id = setInterval(() => setRemaining(calcRemaining()), 1000)
        return () => clearInterval(id)
    }, [calcRemaining])

    return remaining
}

function CountdownBadge({ endsAt }: { endsAt: string }) {
    const remaining = useCountdown(endsAt)
    if (!remaining) return null
    return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
            <Clock className="w-3 h-3" /> Ends in {remaining}
        </span>
    )
}

function getSaleStatus(sale: FlashSale) {
    const now = Date.now()
    const start = new Date(sale.starts_at).getTime()
    const end = new Date(sale.ends_at).getTime()
    if (now < start) return 'upcoming'
    if (now >= start && now <= end && sale.is_active) return 'active'
    return 'ended'
}

const STATUS_STYLES: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
    active:   { label: 'Active',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
    upcoming: { label: 'Upcoming', cls: 'bg-blue-50 text-blue-700 border-blue-200',         Icon: Clock },
    ended:    { label: 'Ended',    cls: 'bg-gray-100 text-gray-500 border-gray-200',         Icon: XCircle },
}

const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// ─── Product Picker ────────────────────────────────────────────────
function ProductPicker({ saleId, onDone, existingProductIds }: { saleId: string; onDone: () => void; existingProductIds: Set<string> }) {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<Array<{ product_id: string; name: string; base_price: string; flash_price: string; quantity_limit: string }>>([])

    const { data: products = [], isFetching } = useQuery<any[]>({
        queryKey: ['seller-products-search', search],
        queryFn: () =>
            api.get('/seller/products/', { params: search ? { search } : {} })
                .then(r => normalizeListResponse<any>(r.data?.data ?? r.data)),
        enabled: true,
    })

    const addProductsMutation = useMutation({
        mutationFn: (payload: any) =>
            api.post(`/seller/flash-sales/${saleId}/add-products/`, payload),
        onSuccess: () => {
            toast.success('Products added to flash sale!')
            queryClient.invalidateQueries({ queryKey: ['seller-flash-sales'] })
            onDone()
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add products'),
    })

    const toggleProduct = (p: any) => {
        const exists = selected.find(s => s.product_id === p.id)
        if (exists) {
            setSelected(selected.filter(s => s.product_id !== p.id))
        } else {
            setSelected([...selected, {
                product_id: p.id,
                name: p.name,
                base_price: p.base_price,
                flash_price: '',
                quantity_limit: '10',
            }])
        }
    }

    const updateSelected = (pid: string, field: 'flash_price' | 'quantity_limit', value: string) => {
        setSelected(selected.map(s => s.product_id === pid ? { ...s, [field]: value } : s))
    }

    const handleSubmit = () => {
        if (selected.length === 0) { toast.error('Select at least one product'); return }
        const invalid = selected.find(s => !s.flash_price || parseFloat(s.flash_price) <= 0)
        if (invalid) { toast.error(`Flash price required for ${invalid.name}`); return }
        addProductsMutation.mutate({
            products: selected.map(s => ({
                product_id: s.product_id,
                flash_price: parseFloat(s.flash_price),
                quantity_limit: parseInt(s.quantity_limit) || 10,
            })),
        })
    }

    const inputCls = 'border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50'

    return (
        <div className="mt-4 border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#4C3B8A]" />
                Add Products to Sale
            </h4>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search your products..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                {isFetching && (
                    <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                )}
                {!isFetching && Array.isArray(products) && products
                    .filter(p => !existingProductIds.has(p.id))
                    .map((p: any) => {
                        const isSelected = selected.some(s => s.product_id === p.id)
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => toggleProduct(p)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                                    isSelected
                                        ? 'bg-purple-50 border border-[#4C3B8A]/20'
                                        : 'hover:bg-gray-50 border border-transparent'
                                }`}
                            >
                                {p.images?.[0]?.image_url || p.images?.[0]?.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={p.images[0].image_url || p.images[0].image}
                                        alt={p.name}
                                        className="w-8 h-8 rounded object-cover border border-gray-100"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">N/A</div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{p.name}</p>
                                </div>
                                <span className="text-xs font-bold text-gray-500">৳{Number(p.base_price).toLocaleString()}</span>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4C3B8A] shrink-0" />}
                            </button>
                        )
                    })}
            </div>

            {selected.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">Selected ({selected.length})</p>
                    {selected.map(s => (
                        <div key={s.product_id} className="flex items-center gap-2 text-sm">
                            <span className="flex-1 truncate text-gray-700 font-medium">{s.name}</span>
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={s.flash_price}
                                onChange={e => updateSelected(s.product_id, 'flash_price', e.target.value)}
                                placeholder="Flash ৳"
                                className={`${inputCls} w-24`}
                            />
                            <input
                                type="number"
                                min="1"
                                value={s.quantity_limit}
                                onChange={e => updateSelected(s.product_id, 'quantity_limit', e.target.value)}
                                placeholder="Qty"
                                className={`${inputCls} w-16`}
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onDone} className="border-gray-200 text-xs" size="sm">
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={addProductsMutation.isPending || selected.length === 0}
                    className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white text-xs gap-1"
                    size="sm"
                >
                    {addProductsMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Add to Sale
                </Button>
            </div>
        </div>
    )
}

// ─── Stock badge helper ──────────────────────────────────────────
function StockBadge({ product }: { product: FlashSaleProduct }) {
    if (product.quantity_limit == null) return null
    const remaining = product.quantity_limit - product.sold_count
    if (remaining <= 0) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                <XCircle className="w-3 h-3" /> STOCK OUT
            </span>
        )
    }
    if (remaining <= 5) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3" /> {remaining} left
            </span>
        )
    }
    return (
        <span className="text-[10px] text-gray-400">{product.sold_count}/{product.quantity_limit} sold</span>
    )
}

// ─── Single seller product row in flash sale ───────────────────────
function SellerProductRow({ saleId, fsp }: { saleId: string; fsp: FlashSaleProduct }) {
    const queryClient = useQueryClient()
    const [editing, setEditing] = useState(false)
    const [price, setPrice] = useState(fsp.override_price || fsp.sale_price || '')
    const [qty, setQty] = useState(fsp.quantity_limit?.toString() ?? '')

    const isStockOut = fsp.quantity_limit != null && fsp.sold_count >= fsp.quantity_limit

    const updateMutation = useMutation({
        mutationFn: (payload: any) =>
            api.patch(`/seller/flash-sales/${saleId}/products/${fsp.id}/`, payload),
        onSuccess: () => {
            toast.success('Product updated')
            queryClient.invalidateQueries({ queryKey: ['seller-flash-sales'] })
            setEditing(false)
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
    })

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/seller/flash-sales/${saleId}/products/${fsp.id}/`),
        onSuccess: () => {
            toast.success('Product removed from flash sale')
            queryClient.invalidateQueries({ queryKey: ['seller-flash-sales'] })
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to remove'),
    })

    const handleSave = () => {
        if (!price || parseFloat(price) <= 0) { toast.error('Flash price required'); return }
        const qtyNum = qty ? parseInt(qty) : null
        if (qtyNum != null && qtyNum < fsp.sold_count) {
            toast.error(`Cannot reduce below sold (${fsp.sold_count})`)
            return
        }
        updateMutation.mutate({
            flash_price: parseFloat(price),
            quantity_limit: qtyNum,
        })
    }

    const handleRemove = () => {
        if (!confirm(`Remove "${fsp.product_name}" from this flash sale?`)) return
        deleteMutation.mutate()
    }

    if (editing) {
        return (
            <div className="flex items-center gap-2 bg-purple-50 rounded px-2 py-1.5 text-xs">
                <span className="flex-1 truncate font-medium text-gray-700">{fsp.product_name}</span>
                <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="Price"
                    className="w-20 border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white"
                />
                <input
                    type="number"
                    min={fsp.sold_count}
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    placeholder="Qty"
                    className="w-14 border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white"
                />
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                    title="Save"
                >
                    {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </button>
                <button
                    onClick={() => setEditing(false)}
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    title="Cancel"
                >
                    <XIcon className="w-3 h-3" />
                </button>
            </div>
        )
    }

    return (
        <div className={`flex items-center justify-between text-xs rounded px-2 py-1.5 ${isStockOut ? 'bg-red-50/50' : 'bg-gray-50'}`}>
            <span className={`truncate font-medium ${isStockOut ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {fsp.product_name}
            </span>
            <div className="flex gap-2 shrink-0 ml-2 items-center">
                <span className="line-through text-gray-400">৳{Number(fsp.original_price).toLocaleString()}</span>
                <span className={`font-bold ${isStockOut ? 'text-gray-400' : 'text-red-600'}`}>
                    ৳{Number(fsp.override_price || fsp.sale_price || 0).toLocaleString()}
                </span>
                <StockBadge product={fsp} />
                <button
                    onClick={() => setEditing(true)}
                    className="p-1 text-[#4C3B8A] hover:bg-[#4C3B8A]/10 rounded transition-colors"
                    title="Edit"
                >
                    <Pencil className="w-3 h-3" />
                </button>
                <button
                    onClick={handleRemove}
                    disabled={deleteMutation.isPending}
                    className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                    title="Remove"
                >
                    {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
            </div>
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function SellerFlashSalesPage() {
    const [addingProductsTo, setAddingProductsTo] = useState<string | null>(null)

    const { data: sales = [], isLoading } = useQuery<FlashSale[]>({
        queryKey: ['seller-flash-sales'],
        queryFn: () =>
            api.get('/seller/flash-sales/').then(r => {
                const d = r.data?.data ?? r.data
                return Array.isArray(d) ? d : normalizeListResponse<FlashSale>(d)
            }),
    })

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-bold text-2xl text-gray-900">Flash Sales</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Flash sales are created by admin. You can add, edit price/quantity, or remove your own products.
                    </p>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
            ) : sales.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No flash sales yet</h3>
                    <p className="text-sm text-gray-500">Flash sales will appear here when admin creates one for your store.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sales.map(sale => {
                        const status = getSaleStatus(sale)
                        const style = STATUS_STYLES[status]
                        const Icon = style.Icon
                        const productCount = sale.products?.length || 0
                        const canAddProducts = new Date(sale.ends_at).getTime() > Date.now()
                        const existingIds = new Set((sale.products || []).map(p => p.product?.id || p.product_id || '').filter(Boolean))

                        return (
                            <div key={sale.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                {/* Card header */}
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate">{sale.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {fmtDateTime(sale.starts_at)} → {fmtDateTime(sale.ends_at)}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${style.cls}`}>
                                            <Icon className="w-3 h-3" /> {style.label}
                                        </span>
                                    </div>
                                    {status === 'active' && <div className="mt-2"><CountdownBadge endsAt={sale.ends_at} /></div>}
                                </div>

                                {/* Card body */}
                                <div className="px-5 py-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{productCount} product{productCount !== 1 ? 's' : ''} in sale</span>
                                    </div>

                                    {/* Products in sale */}
                                    {sale.products && sale.products.length > 0 && (
                                        <div className="space-y-1">
                                            {sale.products.map(p => (
                                                <SellerProductRow key={p.id} saleId={sale.id} fsp={p} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Product picker inline */}
                                    {addingProductsTo === sale.id && (
                                        <ProductPicker
                                            saleId={sale.id}
                                            onDone={() => setAddingProductsTo(null)}
                                            existingProductIds={existingIds}
                                        />
                                    )}
                                </div>

                                {/* Card footer */}
                                <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex gap-2">
                                    {canAddProducts && addingProductsTo !== sale.id && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setAddingProductsTo(sale.id)}
                                            className="text-xs gap-1 bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white"
                                        >
                                            <Plus className="w-3 h-3" /> Add My Products
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
