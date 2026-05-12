'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import {
    Ticket, Zap, Search,
    Trash2, Eye, ToggleLeft, ToggleRight, Clock, Plus, Pencil, Package,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'

const TABS = [
    { id: 'coupons', label: 'Coupons', icon: Ticket },
    { id: 'flash-sales', label: 'Flash Sales', icon: Zap },
]

function pad(n: number) { return String(n).padStart(2, '0') }
function isoToLocalInput(iso: string) {
    const d = new Date(iso)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminCouponsPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('coupons')
    const [search, setSearch] = useState('')
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [flashSaleFormOpen, setFlashSaleFormOpen] = useState(false)
    const [editingSale, setEditingSale] = useState<any>(null)
    const [viewingSale, setViewingSale] = useState<any>(null)

    useEffect(() => {
        if (!isAdmin()) router.replace('/admin/approvals')
    }, [isAdmin, router])

    // Fetch coupons
    const { data: couponsData, isLoading: couponsLoading } = useQuery({
        queryKey: ['admin-coupons', search],
        queryFn: () => {
            const params: any = {}
            if (search) params.search = search
            return api.get('/admin/coupons/', { params }).then(r => {
                const d = r.data?.data || r.data
                return Array.isArray(d) ? d : d?.results || []
            })
        },
        enabled: activeTab === 'coupons',
        staleTime: 30_000,
    })

    // Fetch flash sales
    const { data: flashSalesData, isLoading: flashSalesLoading } = useQuery({
        queryKey: ['admin-flash-sales'],
        queryFn: () => api.get('/admin/flash-sales/').then(r => {
            const d = r.data?.data || r.data
            return Array.isArray(d) ? d : d?.results || []
        }),
        enabled: activeTab === 'flash-sales',
        staleTime: 30_000,
    })

    // Toggle flash sale active/inactive
    const { mutate: toggleFlashSale } = useMutation({
        mutationFn: (sale: any) =>
            api.patch(`/admin/flash-sales/${sale.id}/`, { is_active: !sale.is_active }),
        onSuccess: () => {
            toast.success('Flash sale updated.')
            queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] })
        },
        onError: () => toast.error('Failed to update flash sale.'),
    })

    // Delete flash sale
    const { mutate: deleteFlashSale } = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/flash-sales/${id}/`),
        onSuccess: () => {
            toast.success('Flash sale deleted.')
            queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] })
        },
        onError: () => toast.error('Failed to delete flash sale.'),
    })

    // Toggle coupon active/inactive
    const { mutate: toggleCoupon } = useMutation({
        mutationFn: (coupon: any) =>
            api.patch(`/admin/coupons/${coupon.id}/`, { is_active: !coupon.is_active }),
        onSuccess: () => {
            toast.success('Coupon updated.')
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
        },
        onError: () => toast.error('Failed to update coupon.'),
    })

    // Delete coupon
    const { mutate: deleteCoupon } = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/coupons/${id}/`),
        onSuccess: () => {
            toast.success('Coupon deleted.')
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
        },
        onError: () => toast.error('Failed to delete coupon.'),
    })

    const coupons = Array.isArray(couponsData) ? couponsData : []
    const flashSales = Array.isArray(flashSalesData) ? flashSalesData : []

    if (!isAdmin()) return null

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-bold text-2xl text-gray-900 tracking-tight">Coupons & Promotions</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage discount coupons and flash sale events.</p>
                </div>
                {activeTab === 'flash-sales' && (
                    <Button
                        onClick={() => { setEditingSale(null); setFlashSaleFormOpen(true) }}
                        className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" /> Create Flash Sale
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
                {TABS.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2
                                ${isActive
                                    ? 'border-[#4C3B8A] text-[#4C3B8A]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Search (coupons only) */}
            {activeTab === 'coupons' && (
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search coupons..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 text-sm"
                    />
                </div>
            )}

            {/* COUPONS TAB */}
            {activeTab === 'coupons' && (
                <div className="space-y-4">
                    {couponsLoading ? (
                        <LoadingSkeleton rows={5} />
                    ) : coupons.length === 0 ? (
                        <EmptyState icon={Ticket} message="No coupons found" description="There are no coupons on the platform yet." />
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Discount</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Usage</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Validity</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {coupons.map((coupon: any) => (
                                            <tr key={coupon.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-5 py-4">
                                                    <span className="font-mono text-sm font-bold text-[#4C3B8A] bg-[#4C3B8A]/5 px-2 py-0.5 rounded">
                                                        {coupon.code}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-gray-700 font-medium">
                                                    {coupon.discount_type === 'percentage'
                                                        ? `${coupon.discount_value}%`
                                                        : `৳${Number(coupon.discount_value || 0).toLocaleString()}`
                                                    }
                                                    {coupon.max_discount_amount && (
                                                        <span className="text-xs text-gray-400 ml-1">(max ৳{coupon.max_discount_amount})</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-gray-500 text-xs">
                                                    {coupon.times_used || 0} / {coupon.max_uses || '∞'}
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-400">
                                                    {coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                                    {' → '}
                                                    {coupon.valid_to ? new Date(coupon.valid_to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                                                        coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {coupon.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm" variant="ghost"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                                                            onClick={() => setSelectedItem(coupon)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm" variant="ghost"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                                                            onClick={() => toggleCoupon(coupon)}
                                                        >
                                                            {coupon.is_active
                                                                ? <ToggleRight className="w-4 h-4 text-green-600" />
                                                                : <ToggleLeft className="w-4 h-4" />
                                                            }
                                                        </Button>
                                                        <Button
                                                            size="sm" variant="ghost"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                                            onClick={() => {
                                                                if (confirm(`Delete coupon ${coupon.code}?`)) deleteCoupon(coupon.id)
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden space-y-3">
                                {coupons.map((coupon: any) => (
                                    <div key={coupon.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-sm font-bold text-[#4C3B8A] bg-[#4C3B8A]/5 px-2 py-0.5 rounded">
                                                {coupon.code}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                                coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {coupon.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Discount</span>
                                            <span className="font-bold text-gray-900">
                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `৳${coupon.discount_value}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>Used {coupon.times_used || 0} / {coupon.max_uses || '∞'}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => toggleCoupon(coupon)} className="text-blue-600">
                                                    {coupon.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => { if (confirm('Delete?')) deleteCoupon(coupon.id) }} className="text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* FLASH SALES TAB */}
            {activeTab === 'flash-sales' && (
                <div className="space-y-4">
                    {flashSalesLoading ? (
                        <LoadingSkeleton rows={4} />
                    ) : flashSales.length === 0 ? (
                        <EmptyState
                            icon={Zap}
                            message="No flash sales"
                            description="Click 'Create Flash Sale' to set up your first event."
                        />
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Store</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Products</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {flashSales.map((sale: any) => {
                                            const now = new Date()
                                            const start = sale.starts_at ? new Date(sale.starts_at) : null
                                            const end = sale.ends_at ? new Date(sale.ends_at) : null
                                            const isLive = start && end && now >= start && now <= end && sale.is_active
                                            const isUpcoming = start && now < start

                                            return (
                                                <tr key={sale.id} className="hover:bg-gray-50/50 transition">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className={`w-4 h-4 ${isLive ? 'text-orange-500' : 'text-gray-300'}`} />
                                                            <span className="font-medium text-gray-900">{sale.title || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-500 text-sm">
                                                        {sale.store_name || sale.store?.name || (
                                                            <span className="inline-flex items-center text-[10px] font-bold uppercase bg-purple-50 text-[#4C3B8A] px-2 py-0.5 rounded">
                                                                Platform-wide
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-600 text-sm">{sale.products?.length || 0}</td>
                                                    <td className="px-5 py-4 text-xs text-gray-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {start ? start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                            {' → '}
                                                            {end ? end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                                                            isLive ? 'bg-green-100 text-green-700' :
                                                            isUpcoming ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {isLive ? 'Live' : isUpcoming ? 'Upcoming' : 'Ended'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                size="sm" variant="ghost"
                                                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                                                                title="View products"
                                                                onClick={() => setViewingSale(sale)}
                                                            >
                                                                <Package className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm" variant="ghost"
                                                                className="h-8 w-8 p-0 text-gray-400 hover:text-[#4C3B8A]"
                                                                title="Edit"
                                                                onClick={() => { setEditingSale(sale); setFlashSaleFormOpen(true) }}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm" variant="ghost"
                                                                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                                                                onClick={() => toggleFlashSale(sale)}
                                                            >
                                                                {sale.is_active
                                                                    ? <ToggleRight className="w-4 h-4 text-green-600" />
                                                                    : <ToggleLeft className="w-4 h-4" />
                                                                }
                                                            </Button>
                                                            <Button
                                                                size="sm" variant="ghost"
                                                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                                                onClick={() => {
                                                                    if (confirm(`Delete flash sale "${sale.title}"?`)) deleteFlashSale(sale.id)
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden space-y-3">
                                {flashSales.map((sale: any) => {
                                    const now = new Date()
                                    const start = sale.starts_at ? new Date(sale.starts_at) : null
                                    const end = sale.ends_at ? new Date(sale.ends_at) : null
                                    const isLive = start && end && now >= start && now <= end && sale.is_active

                                    return (
                                        <div key={sale.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Zap className={`w-4 h-4 ${isLive ? 'text-orange-500' : 'text-gray-300'}`} />
                                                    <span className="font-medium text-gray-900 text-sm">{sale.title || '—'}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                                    isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {isLive ? 'Live' : start && now < start ? 'Upcoming' : 'Ended'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{sale.store_name || 'Platform-wide'} | {sale.products?.length || 0} products</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingSale(sale); setFlashSaleFormOpen(true) }} className="text-[#4C3B8A]">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => toggleFlashSale(sale)} className="text-blue-600">
                                                        {sale.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => { if (confirm('Delete?')) deleteFlashSale(sale.id) }} className="text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Coupon Detail Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={open => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Coupon Details</DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4">
                            <div className="text-center py-3">
                                <span className="font-mono text-2xl font-bold text-[#4C3B8A]">{selectedItem.code}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-gray-400">Type:</span> <span className="font-semibold capitalize">{selectedItem.discount_type}</span></div>
                                <div><span className="text-gray-400">Value:</span> <span className="font-semibold">
                                    {selectedItem.discount_type === 'percentage' ? `${selectedItem.discount_value}%` : `৳${selectedItem.discount_value}`}
                                </span></div>
                                <div><span className="text-gray-400">Min Order:</span> <span className="font-semibold">৳{selectedItem.min_order_amount || 0}</span></div>
                                <div><span className="text-gray-400">Max Discount:</span> <span className="font-semibold">৳{selectedItem.max_discount_amount || '—'}</span></div>
                                <div><span className="text-gray-400">Used:</span> <span className="font-semibold">{selectedItem.times_used || 0} / {selectedItem.max_uses || '∞'}</span></div>
                                <div><span className="text-gray-400">Active:</span> <span className="font-semibold">{selectedItem.is_active ? 'Yes' : 'No'}</span></div>
                            </div>
                            {selectedItem.store_name && (
                                <p className="text-xs text-gray-400">Store: <span className="font-medium text-gray-600">{selectedItem.store_name}</span></p>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Flash Sale Products Viewer */}
            <Dialog open={!!viewingSale} onOpenChange={open => !open && setViewingSale(null)}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{viewingSale?.title} — Products</DialogTitle>
                        <DialogDescription>
                            Sellers can add and edit their own products. Admin cannot edit per-product prices.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingSale && (
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {(!viewingSale.products || viewingSale.products.length === 0) ? (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    No products added yet. Sellers will add their products from the seller dashboard.
                                </p>
                            ) : (
                                viewingSale.products.map((p: any) => {
                                    const isStockOut = p.quantity_limit != null && p.sold_count >= p.quantity_limit
                                    return (
                                        <div key={p.id} className={`flex items-center justify-between text-sm rounded p-2 ${isStockOut ? 'bg-red-50' : 'bg-gray-50'}`}>
                                            <span className={`font-medium ${isStockOut ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                {p.product_name}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-gray-400 line-through">৳{Number(p.original_price || 0).toLocaleString()}</span>
                                                <span className="font-bold text-red-600">৳{Number(p.override_price || p.sale_price || 0).toLocaleString()}</span>
                                                <span className="text-gray-500">
                                                    {p.quantity_limit != null
                                                        ? `${p.sold_count}/${p.quantity_limit} sold`
                                                        : `${p.sold_count} sold`}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewingSale(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Flash Sale Create/Edit Form */}
            <FlashSaleFormDialog
                open={flashSaleFormOpen}
                onOpenChange={(open) => {
                    setFlashSaleFormOpen(open)
                    if (!open) setEditingSale(null)
                }}
                editingSale={editingSale}
            />
        </div>
    )
}

function FlashSaleFormDialog({
    open, onOpenChange, editingSale,
}: { open: boolean; onOpenChange: (o: boolean) => void; editingSale: any }) {
    const queryClient = useQueryClient()
    const [title, setTitle] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        if (editingSale) {
            setTitle(editingSale.title || '')
            setStartTime(editingSale.starts_at ? isoToLocalInput(editingSale.starts_at) : '')
            setEndTime(editingSale.ends_at ? isoToLocalInput(editingSale.ends_at) : '')
            setIsActive(editingSale.is_active ?? true)
        } else {
            setTitle('')
            setStartTime('')
            setEndTime('')
            setIsActive(true)
        }
    }, [editingSale, open])

    const createMutation = useMutation({
        mutationFn: (payload: any) => api.post('/admin/flash-sales/', payload),
        onSuccess: () => {
            toast.success('Flash sale created! Seller has been notified.')
            queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] })
            onOpenChange(false)
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create flash sale.'),
    })

    const updateMutation = useMutation({
        mutationFn: (payload: any) => api.patch(`/admin/flash-sales/${editingSale.id}/`, payload),
        onSuccess: () => {
            toast.success('Flash sale updated.')
            queryClient.invalidateQueries({ queryKey: ['admin-flash-sales'] })
            onOpenChange(false)
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update flash sale.'),
    })

    const handleSubmit = () => {
        if (!title.trim()) { toast.error('Title is required'); return }
        if (!startTime || !endTime) { toast.error('Start and end times are required'); return }
        if (new Date(endTime) <= new Date(startTime)) { toast.error('End time must be after start time'); return }

        const payload: any = {
            title: title.trim(),
            starts_at: new Date(startTime).toISOString(),
            ends_at: new Date(endTime).toISOString(),
            is_active: isActive,
        }

        if (editingSale) {
            updateMutation.mutate(payload)
        } else {
            createMutation.mutate(payload)
        }
    }

    const isSaving = createMutation.isPending || updateMutation.isPending
    const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</DialogTitle>
                    <DialogDescription>
                        {editingSale
                            ? 'Update sale details. Sellers manage their products separately.'
                            : 'Create a platform-wide flash sale. All approved sellers will be notified and can add their own products.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Title *</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Mid-Year Mega Sale"
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

                    <div className="flex items-center gap-2">
                        <input
                            id="is_active"
                            type="checkbox"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                            className="w-4 h-4 text-[#4C3B8A] border-gray-300 rounded focus:ring-[#4C3B8A]"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            Active
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white"
                    >
                        {isSaving ? 'Saving...' : editingSale ? 'Update Sale' : 'Create Sale'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-50">
                {Array(rows).fill(null).map((_, i) => (
                    <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                        <div className="flex-1" />
                        <div className="h-6 w-16 bg-gray-200 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function EmptyState({ icon: Icon, message, description }: { icon: any; message: string; description: string }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl py-16 flex flex-col items-center text-center">
            <Icon className="w-12 h-12 text-gray-200 mb-4" />
            <h3 className="font-semibold text-gray-700 text-lg">{message}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
    )
}
