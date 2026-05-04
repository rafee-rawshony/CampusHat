'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
    Tag, Plus, Loader2, Pencil, Trash2, Eye, EyeOff, Ticket,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Coupon {
    id: string
    code: string
    coupon_type: 'percentage' | 'fixed'
    discount_value: string
    minimum_order_amount: string | null
    maximum_discount_amount: string | null
    usage_limit: number | null
    usage_count: number
    is_active: boolean
    valid_from: string | null
    valid_until: string | null
    created_at: string
}

// Helpers
const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null

const toLocalInput = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    // Format to datetime-local value
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function SellerCouponsPage() {
    const queryClient = useQueryClient()
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editCoupon, setEditCoupon] = useState<Coupon | null>(null)

    // Form state
    const [code, setCode] = useState('')
    const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage')
    const [discountValue, setDiscountValue] = useState('')
    const [minOrder, setMinOrder] = useState('')
    const [maxDiscount, setMaxDiscount] = useState('')
    const [usageLimit, setUsageLimit] = useState('')
    const [validFrom, setValidFrom] = useState('')
    const [validUntil, setValidUntil] = useState('')
    const [isActive, setIsActive] = useState(true)

    const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
        queryKey: ['seller-coupons'],
        queryFn: () =>
            api.get('/seller/coupons/').then(r => {
                const d = r.data?.data?.results || r.data?.results || r.data?.data || r.data
                return Array.isArray(d) ? d : []
            }),
    })

    const resetForm = () => {
        setCode('')
        setCouponType('percentage')
        setDiscountValue('')
        setMinOrder('')
        setMaxDiscount('')
        setUsageLimit('')
        setValidFrom('')
        setValidUntil('')
        setIsActive(true)
    }

    const openCreate = () => {
        setEditCoupon(null)
        resetForm()
        setSheetOpen(true)
    }

    const openEdit = (c: Coupon) => {
        setEditCoupon(c)
        setCode(c.code)
        setCouponType(c.coupon_type)
        setDiscountValue(c.discount_value)
        setMinOrder(c.minimum_order_amount || '')
        setMaxDiscount(c.maximum_discount_amount || '')
        setUsageLimit(c.usage_limit != null ? String(c.usage_limit) : '')
        setValidFrom(toLocalInput(c.valid_from))
        setValidUntil(toLocalInput(c.valid_until))
        setIsActive(c.is_active)
        setSheetOpen(true)
    }

    const buildPayload = () => {
        const dv = parseFloat(discountValue)
        if (isNaN(dv) || dv <= 0) { toast.error('Discount value is required'); return null }
        if (couponType === 'percentage' && (dv < 1 || dv > 100)) {
            toast.error('Percentage must be between 1 and 100')
            return null
        }
        if (!code.trim()) { toast.error('Coupon code is required'); return null }
        if (validFrom && validUntil && new Date(validUntil) <= new Date(validFrom)) {
            toast.error('End date must be after start date')
            return null
        }
        return {
            code: code.trim().toUpperCase(),
            coupon_type: couponType,
            discount_value: dv,
            minimum_order_amount: minOrder ? parseFloat(minOrder) : null,
            maximum_discount_amount: maxDiscount ? parseFloat(maxDiscount) : null,
            usage_limit: usageLimit ? parseInt(usageLimit) : null,
            valid_from: validFrom ? new Date(validFrom).toISOString() : null,
            valid_until: validUntil ? new Date(validUntil).toISOString() : null,
            is_active: isActive,
        }
    }

    const createMutation = useMutation({
        mutationFn: (payload: any) => api.post('/seller/coupons/', payload),
        onSuccess: () => {
            toast.success('Coupon created!')
            queryClient.invalidateQueries({ queryKey: ['seller-coupons'] })
            setSheetOpen(false)
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || err?.response?.data?.detail || 'Failed to create coupon'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) =>
            api.patch(`/seller/coupons/${id}/`, payload),
        onSuccess: () => {
            toast.success('Coupon updated!')
            queryClient.invalidateQueries({ queryKey: ['seller-coupons'] })
            setSheetOpen(false)
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update coupon'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/seller/coupons/${id}/`),
        onSuccess: () => {
            toast.success('Coupon deleted')
            queryClient.invalidateQueries({ queryKey: ['seller-coupons'] })
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete'),
    })

    const toggleMutation = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) =>
            api.patch(`/seller/coupons/${id}/`, { is_active: active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-coupons'] })
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to toggle'),
    })

    const handleSubmit = () => {
        const payload = buildPayload()
        if (!payload) return
        if (editCoupon) {
            updateMutation.mutate({ id: editCoupon.id, payload })
        } else {
            createMutation.mutate(payload)
        }
    }

    const handleDelete = (id: string) => {
        if (!confirm('Delete this coupon?')) return
        deleteMutation.mutate(id)
    }

    const isSaving = createMutation.isPending || updateMutation.isPending

    const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50'

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-bold text-2xl text-gray-900">Coupons</h1>
                    <p className="text-sm text-gray-500 mt-1">Create discount codes for your customers.</p>
                </div>
                <Button onClick={openCreate} className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2">
                    <Plus className="w-4 h-4" /> Add Coupon
                </Button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
            ) : coupons.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket className="h-8 w-8 text-[#4C3B8A]" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No coupons yet</h3>
                    <p className="text-sm text-gray-500">Create your first discount code.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Code</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Type</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Min Order</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Usage</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Validity</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map(c => (
                                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono font-bold text-[#4C3B8A] bg-purple-50 px-2 py-0.5 rounded text-xs">
                                                {c.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-700">
                                            {c.coupon_type === 'percentage'
                                                ? `${Number(c.discount_value)}% OFF`
                                                : `৳${Number(c.discount_value).toLocaleString()} OFF`}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {c.minimum_order_amount ? `Min ৳${Number(c.minimum_order_amount).toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {c.usage_limit
                                                ? `${c.usage_count} / ${c.usage_limit}`
                                                : 'Unlimited'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {c.valid_from && c.valid_until
                                                ? `${fmtDate(c.valid_from)} — ${fmtDate(c.valid_until)}`
                                                : 'No expiry'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                                                c.is_active
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {c.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="p-1.5 text-gray-400 hover:text-[#4C3B8A] rounded hover:bg-gray-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => toggleMutation.mutate({ id: c.id, active: !c.is_active })}
                                                    className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors"
                                                    title={c.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {c.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Slide-in Sheet for Create/Edit */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</SheetTitle>
                        <SheetDescription>
                            {editCoupon ? 'Update coupon settings.' : 'Set up a new discount code for your store.'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
                        {/* Code */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Coupon Code *</label>
                            <input
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                placeholder="e.g. CAMPUS20"
                                className={inputCls}
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Discount Type *</label>
                            <div className="flex gap-3">
                                {(['percentage', 'fixed'] as const).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setCouponType(t)}
                                        className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                                            couponType === t
                                                ? 'bg-[#4C3B8A] text-white border-[#4C3B8A]'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#4C3B8A]'
                                        }`}
                                    >
                                        {t === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (৳)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Discount Value */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Discount Value ({couponType === 'percentage' ? '%' : '৳'}) *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={discountValue}
                                onChange={e => setDiscountValue(e.target.value)}
                                placeholder={couponType === 'percentage' ? '1-100' : '0.00'}
                                className={inputCls}
                            />
                        </div>

                        {/* Min Order */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Minimum Order Amount (৳)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={minOrder}
                                onChange={e => setMinOrder(e.target.value)}
                                placeholder="No minimum"
                                className={inputCls}
                            />
                        </div>

                        {/* Max Discount (only for percentage) */}
                        {couponType === 'percentage' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Maximum Discount (৳)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={maxDiscount}
                                    onChange={e => setMaxDiscount(e.target.value)}
                                    placeholder="No cap"
                                    className={inputCls}
                                />
                            </div>
                        )}

                        {/* Usage Limit */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Usage Limit</label>
                            <input
                                type="number"
                                min="0"
                                value={usageLimit}
                                onChange={e => setUsageLimit(e.target.value)}
                                placeholder="Unlimited"
                                className={inputCls}
                            />
                        </div>

                        {/* Validity */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Valid From</label>
                                <input
                                    type="datetime-local"
                                    value={validFrom}
                                    onChange={e => setValidFrom(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Valid Until</label>
                                <input
                                    type="datetime-local"
                                    value={validUntil}
                                    onChange={e => setValidUntil(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Active toggle */}
                        <div className="flex items-center gap-3">
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                            <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSheetOpen(false)}
                                className="flex-1 border-gray-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="flex-1 bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editCoupon ? 'Update Coupon' : 'Create Coupon'}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
