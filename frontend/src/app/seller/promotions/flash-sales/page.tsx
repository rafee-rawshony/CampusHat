'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
    Zap, Plus, Loader2, Pencil, Search, Clock, CheckCircle2, XCircle, ShoppingBag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { normalizeListResponse } from '@/lib/response'

interface FlashSaleProduct {
    id: string
    product: any
    product_name: string
    original_price: string
    override_price: string
    sale_price: string
    quantity_limit: number | null
    sold_count: number
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

// ─── Countdown hook ────────────────────────────────────────────────
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

// ─── Countdown display component ──────────────────────────────────
function CountdownBadge({ endsAt }: { endsAt: string }) {
    const remaining = useCountdown(endsAt)
    if (!remaining) return null
    return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
            <Clock className="w-3 h-3" /> Ends in {remaining}
        </span>
    )
}

// ─── Status helpers ────────────────────────────────────────────────
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
function ProductPicker({ saleId, onDone }: { saleId: string; onDone: () => void }) {
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

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search your products..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                />
            </div>

            {/* Product list */}
            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                {isFetching && (
                    <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                )}
                {!isFetching && Array.isArray(products) && products.map((p: any) => {
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

            {/* Selected products with pricing */}
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

// ─── Main Page ─────────────────────────────────────────────────────
export default function SellerFlashSalesPage() {
    const queryClient = useQueryClient()
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editSale, setEditSale] = useState<FlashSale | null>(null)
    const [addingProductsTo, setAddingProductsTo] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [isActive, setIsActive] = useState(true)

    const { data: sales = [], isLoading } = useQuery<FlashSale[]>({
        queryKey: ['seller-flash-sales'],
        queryFn: () =>
            api.get('/seller/flash-sales/').then(r => {
                const d = r.data?.data ?? r.data
                return Array.isArray(d) ? d : normalizeListResponse<FlashSale>(d)
            }),
    })

    const openCreate = () => {
        setEditSale(null)
        setName('')
        setStartTime('')
        setEndTime('')
        setIsActive(true)
        setSheetOpen(true)
    }

    const openEdit = (s: FlashSale) => {
        setEditSale(s)
        setName(s.title)
        const pad = (n: number) => String(n).padStart(2, '0')
        const fmtLocal = (iso: string) => {
            const d = new Date(iso)
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
        setStartTime(fmtLocal(s.starts_at))
        setEndTime(fmtLocal(s.ends_at))
        setIsActive(s.is_active)
        setSheetOpen(true)
    }

    const createMutation = useMutation({
        mutationFn: (payload: any) => api.post('/seller/flash-sales/', payload),
        onSuccess: () => {
            toast.success('Flash sale created!')
            queryClient.invalidateQueries({ queryKey: ['seller-flash-sales'] })
            setSheetOpen(false)
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create flash sale'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) =>
            api.patch(`/seller/flash-sales/${id}/`, payload),
        onSuccess: () => {
            toast.success('Flash sale updated!')
            queryClient.invalidateQueries({ queryKey: ['seller-flash-sales'] })
            setSheetOpen(false)
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
    })

    const handleSubmit = () => {
        if (!name.trim()) { toast.error('Sale name is required'); return }
        if (!startTime || !endTime) { toast.error('Start and end times are required'); return }
        if (new Date(endTime) <= new Date(startTime)) { toast.error('End time must be after start time'); return }

        const payload = {
            title: name.trim(),
            starts_at: new Date(startTime).toISOString(),
            ends_at: new Date(endTime).toISOString(),
            is_active: isActive,
        }
        if (editSale) {
            updateMutation.mutate({ id: editSale.id, payload })
        } else {
            createMutation.mutate(payload)
        }
    }

    const isSaving = createMutation.isPending || updateMutation.isPending
    const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50'

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-bold text-2xl text-gray-900">Flash Sales</h1>
                    <p className="text-sm text-gray-500 mt-1">Run time-limited sales on your products.</p>
                </div>
                <Button onClick={openCreate} className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2">
                    <Plus className="w-4 h-4" /> Create Flash Sale
                </Button>
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
                    <p className="text-sm text-gray-500">Create one to boost sales.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sales.map(sale => {
                        const status = getSaleStatus(sale)
                        const style = STATUS_STYLES[status]
                        const Icon = style.Icon
                        const productCount = sale.products?.length || 0
                        const canAddProducts = new Date(sale.ends_at).getTime() > Date.now()

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
                                            {sale.products.slice(0, 3).map(p => (
                                                <div key={p.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5">
                                                    <span className="truncate text-gray-700 font-medium">{p.product_name}</span>
                                                    <div className="flex gap-2 shrink-0 ml-2">
                                                        <span className="line-through text-gray-400">৳{Number(p.original_price).toLocaleString()}</span>
                                                        <span className="font-bold text-red-600">৳{Number(p.override_price || p.sale_price || 0).toLocaleString()}</span>
                                                        {p.quantity_limit != null && <span className="text-gray-400">{p.sold_count}/{p.quantity_limit} sold</span>}
                                                    </div>
                                                </div>
                                            ))}
                                            {sale.products.length > 3 && (
                                                <p className="text-[11px] text-gray-400 text-center">+{sale.products.length - 3} more</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Product picker inline */}
                                    {addingProductsTo === sale.id && (
                                        <ProductPicker saleId={sale.id} onDone={() => setAddingProductsTo(null)} />
                                    )}
                                </div>

                                {/* Card footer */}
                                <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEdit(sale)}
                                        className="text-xs gap-1 border-gray-200"
                                    >
                                        <Pencil className="w-3 h-3" /> Edit
                                    </Button>
                                    {canAddProducts && addingProductsTo !== sale.id && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setAddingProductsTo(sale.id)}
                                            className="text-xs gap-1 bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white"
                                        >
                                            <Plus className="w-3 h-3" /> Add Products
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create/Edit Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>{editSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</SheetTitle>
                        <SheetDescription>
                            {editSale ? 'Update sale details.' : 'Set up a new time-limited sale.'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sale Name *</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Summer Flash Sale"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Time *</label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Time *</label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className={inputCls}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                            <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1 border-gray-200">
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="flex-1 bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editSale ? 'Update Sale' : 'Create Sale'}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
