'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import {
    Store, Eye, CheckCircle, XCircle, Ban,
    Wallet, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
    suspended: 'bg-gray-100 text-gray-600',
    under_review: 'bg-blue-100 text-blue-700',
    active: 'bg-emerald-100 text-emerald-700',
}

// Tabs to switch between Sellers, Stores, Payouts
const TABS = [
    { id: 'sellers', label: 'Seller Profiles', icon: Store },
    { id: 'stores', label: 'Stores', icon: Shield },
    { id: 'payouts', label: 'Payouts', icon: Wallet },
]

export default function AdminSellersPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()

    const [activeTab, setActiveTab] = useState('sellers')

    useEffect(() => {
        if (!isAdmin()) router.replace('/admin/approvals')
    }, [isAdmin, router])

    // Reject dialog state
    const [rejectTarget, setRejectTarget] = useState<any>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [rejectType, setRejectType] = useState<'seller' | 'store' | 'payout'>('seller')

    // Detail dialog state
    const [detailItem, setDetailItem] = useState<any>(null)

    // --- Sellers ---
    const { data: sellersData, isLoading: sellersLoading } = useQuery({
        queryKey: ['admin-all-sellers'],
        queryFn: async () => {
            const sellers = await api.get('/admin/sellers/', { params: { status: 'all' } })
                .then(r => r.data?.data || r.data?.results || r.data || [])
            return Array.isArray(sellers) ? sellers : []
        },
        enabled: activeTab === 'sellers',
    })

    // --- Stores ---
    const { data: storesData, isLoading: storesLoading } = useQuery({
        queryKey: ['admin-all-stores'],
        queryFn: () => api.get('/admin/stores/', { params: { status: 'all' } }).then(r => r.data?.data || r.data?.results || r.data || []),
        enabled: activeTab === 'stores',
    })

    // --- Payouts ---
    const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
        queryKey: ['admin-pending-payouts'],
        queryFn: () => api.get('/admin/payouts/pending/').then(r => r.data?.data || r.data || []),
        enabled: activeTab === 'payouts',
    })

    // Seller actions
    const { mutate: approveSeller } = useMutation({
        mutationFn: (id: string) => api.post(`/admin/sellers/${id}/approve/`),
        onSuccess: () => { toast.success('Seller approved.'); queryClient.invalidateQueries({ queryKey: ['admin-all-sellers'] }) },
        onError: () => toast.error('Failed to approve seller.'),
    })

    const { mutate: rejectSeller, isPending: rejectingSeller } = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            api.post(`/admin/sellers/${id}/reject/`, { reason }),
        onSuccess: () => {
            toast.success('Seller rejected.')
            setRejectTarget(null); setRejectReason('')
            queryClient.invalidateQueries({ queryKey: ['admin-all-sellers'] })
        },
        onError: () => toast.error('Failed to reject seller.'),
    })

    const { mutate: suspendSeller } = useMutation({
        mutationFn: (id: string) => api.post(`/admin/sellers/${id}/suspend/`),
        onSuccess: () => { toast.success('Seller suspended.'); queryClient.invalidateQueries({ queryKey: ['admin-all-sellers'] }) },
        onError: () => toast.error('Failed to suspend seller.'),
    })

    // Store actions
    const { mutate: approveStore } = useMutation({
        mutationFn: (id: string) => api.post(`/admin/stores/${id}/approve/`),
        onSuccess: () => { toast.success('Store approved.'); queryClient.invalidateQueries({ queryKey: ['admin-all-stores'] }) },
        onError: () => toast.error('Failed to approve store.'),
    })

    const { mutate: rejectStore, isPending: rejectingStore } = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            api.post(`/admin/stores/${id}/reject/`, { reason }),
        onSuccess: () => {
            toast.success('Store rejected.')
            setRejectTarget(null); setRejectReason('')
            queryClient.invalidateQueries({ queryKey: ['admin-all-stores'] })
        },
        onError: () => toast.error('Failed to reject store.'),
    })

    // Payout actions
    const { mutate: processPayout } = useMutation({
        mutationFn: (id: string) => api.post(`/admin/payouts/${id}/process/`),
        onSuccess: () => { toast.success('Payout processed.'); queryClient.invalidateQueries({ queryKey: ['admin-pending-payouts'] }) },
        onError: () => toast.error('Failed to process payout.'),
    })

    const { mutate: rejectPayout, isPending: rejectingPayout } = useMutation({
        mutationFn: ({ id, note }: { id: string; note: string }) =>
            api.post(`/admin/payouts/${id}/reject/`, { note }),
        onSuccess: () => {
            toast.success('Payout rejected.')
            setRejectTarget(null); setRejectReason('')
            queryClient.invalidateQueries({ queryKey: ['admin-pending-payouts'] })
        },
        onError: () => toast.error('Failed to reject payout.'),
    })

    const handleRejectOpen = (item: any, type: 'seller' | 'store' | 'payout') => {
        setRejectTarget(item); setRejectType(type); setRejectReason('')
    }

    const handleRejectConfirm = () => {
        if (!rejectTarget) return
        if (rejectType === 'seller') rejectSeller({ id: rejectTarget.id, reason: rejectReason })
        else if (rejectType === 'store') rejectStore({ id: rejectTarget.id, reason: rejectReason })
        else rejectPayout({ id: rejectTarget.id, note: rejectReason })
    }

    const sellers = Array.isArray(sellersData) ? sellersData : []
    const stores = Array.isArray(storesData) ? storesData : []
    const payouts = Array.isArray(payoutsData) ? payoutsData : []

    if (!isAdmin()) return null

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-bold text-2xl text-gray-900 tracking-tight">Sellers & Stores</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage seller profiles, stores, and payout requests.</p>
                </div>
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

            {/* SELLERS TAB */}
            {activeTab === 'sellers' && (
                <div className="space-y-4">
                    {sellersLoading ? (
                        <LoadingSkeleton />
                    ) : sellers.length === 0 ? (
                        <EmptyState icon={Store} message="No sellers found" description="Seller applications will appear here once users apply." />
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Seller</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Business</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Applied</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sellers.map((seller: any) => (
                                            <tr key={seller.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-9 h-9">
                                                            <AvatarFallback className="bg-[#4C3B8A]/10 text-[#4C3B8A] text-xs font-bold">
                                                                {(seller.user?.full_name || seller.business_name || 'S')[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{seller.user?.full_name || '—'}</p>
                                                            <p className="text-xs text-gray-400">{seller.user?.email || ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-gray-600 text-sm">{seller.business_name || seller.business_type || '—'}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${STATUS_COLORS[seller.status] || STATUS_COLORS.pending}`}>
                                                        {seller.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-400">
                                                    {seller.created_at ? new Date(seller.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" variant="ghost" className="h-8 px-3 text-gray-500" onClick={() => setDetailItem(seller)}>
                                                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                                                        </Button>
                                                        {seller.status === 'pending' && (
                                                            <>
                                                                <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold" onClick={() => approveSeller(seller.id)}>
                                                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="h-8 px-3 border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold" onClick={() => handleRejectOpen(seller, 'seller')}>
                                                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        {seller.status === 'approved' && (
                                                            <Button size="sm" variant="outline" className="h-8 px-3 border-gray-200 text-gray-600 text-xs font-bold" onClick={() => {
                                                                if (confirm(`Suspend seller ${seller.user?.full_name}?`)) suspendSeller(seller.id)
                                                            }}>
                                                                <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden space-y-3">
                                {sellers.map((seller: any) => (
                                    <div key={seller.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9">
                                                    <AvatarFallback className="bg-[#4C3B8A]/10 text-[#4C3B8A] text-xs font-bold">
                                                        {(seller.user?.full_name || 'S')[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{seller.user?.full_name || '—'}</p>
                                                    <p className="text-xs text-gray-400">{seller.business_name || '—'}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${STATUS_COLORS[seller.status] || STATUS_COLORS.pending}`}>
                                                {seller.status}
                                            </span>
                                        </div>
                                        {seller.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-bold" onClick={() => approveSeller(seller.id)}>Approve</Button>
                                                <Button size="sm" variant="outline" className="flex-1 h-8 border-red-200 text-red-600 text-xs font-bold" onClick={() => handleRejectOpen(seller, 'seller')}>Reject</Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* STORES TAB */}
            {activeTab === 'stores' && (
                <div className="space-y-4">
                    {storesLoading ? (
                        <LoadingSkeleton />
                    ) : stores.length === 0 ? (
                        <EmptyState icon={Shield} message="No stores found" description="Seller stores will appear here once users apply." />
                    ) : (
                        <>
                            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Store</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Seller</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">University</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stores.map((store: any) => (
                                            <tr key={store.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-gray-900 text-sm">{store.name || '—'}</p>
                                                    <p className="text-xs text-gray-400">{store.slug || ''}</p>
                                                </td>
                                                <td className="px-5 py-4 text-gray-600 text-sm">{store.seller?.user?.full_name || store.seller_name || '—'}</td>
                                                <td className="px-5 py-4 text-gray-500 text-xs">{store.university?.name || store.university_name || '—'}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${STATUS_COLORS[store.status] || STATUS_COLORS.under_review}`}>
                                                        {store.status?.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {(store.status === 'under_review') && (
                                                            <>
                                                                <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold" onClick={() => approveStore(store.id)}>
                                                                    Approve
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="h-8 px-3 border-red-200 text-red-600 text-xs font-bold" onClick={() => handleRejectOpen(store, 'store')}>
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden space-y-3">
                                {stores.map((store: any) => (
                                    <div key={store.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{store.name || '—'}</p>
                                                <p className="text-xs text-gray-400">{store.seller?.user?.full_name || '—'}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${STATUS_COLORS[store.status] || STATUS_COLORS.under_review}`}>
                                                {store.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        {store.status === 'under_review' && (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-bold" onClick={() => approveStore(store.id)}>Approve</Button>
                                                <Button size="sm" variant="outline" className="flex-1 h-8 border-red-200 text-red-600 text-xs font-bold" onClick={() => handleRejectOpen(store, 'store')}>Reject</Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* PAYOUTS TAB */}
            {activeTab === 'payouts' && (
                <div className="space-y-4">
                    {payoutsLoading ? (
                        <LoadingSkeleton />
                    ) : payouts.length === 0 ? (
                        <EmptyState icon={Wallet} message="No pending payouts" description="All payout requests have been processed." />
                    ) : (
                        <>
                            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Seller</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Method</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Requested</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {payouts.map((payout: any) => (
                                            <tr key={payout.id} className="hover:bg-gray-50/50 transition">
                                                <td className="px-5 py-4 text-gray-900 font-medium text-sm">{payout.seller?.user?.full_name || payout.seller_name || '—'}</td>
                                                <td className="px-5 py-4 font-bold text-gray-900">৳{Number(payout.amount || 0).toLocaleString()}</td>
                                                <td className="px-5 py-4 text-gray-500 text-xs capitalize">{payout.payout_method || payout.method || '—'}</td>
                                                <td className="px-5 py-4 text-xs text-gray-400">
                                                    {payout.created_at ? new Date(payout.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold" onClick={() => processPayout(payout.id)}>
                                                            Process
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-8 px-3 border-red-200 text-red-600 text-xs font-bold" onClick={() => handleRejectOpen(payout, 'payout')}>
                                                            Reject
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
                                {payouts.map((payout: any) => (
                                    <div key={payout.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{payout.seller?.user?.full_name || '—'}</p>
                                                <p className="text-xs text-gray-400 capitalize">{payout.payout_method || '—'}</p>
                                            </div>
                                            <p className="font-bold text-gray-900">৳{Number(payout.amount || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-bold" onClick={() => processPayout(payout.id)}>Process</Button>
                                            <Button size="sm" variant="outline" className="flex-1 h-8 border-red-200 text-red-600 text-xs font-bold" onClick={() => handleRejectOpen(payout, 'payout')}>Reject</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Reject Dialog */}
            <Dialog open={!!rejectTarget} onOpenChange={open => !open && setRejectTarget(null)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {rejectType === 'payout' ? 'Reject Payout' : rejectType === 'store' ? 'Reject Store' : 'Reject Seller'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            Provide a reason for this rejection.
                        </p>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]"
                            rows={4}
                            placeholder="Reason..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={rejectingSeller || rejectingStore || rejectingPayout || rejectReason.trim().length < 3}
                            onClick={handleRejectConfirm}
                        >
                            Confirm Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={!!detailItem} onOpenChange={open => !open && setDetailItem(null)}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Seller Details</DialogTitle>
                    </DialogHeader>
                    {detailItem && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-gray-400">Name:</span> <span className="font-semibold">{detailItem.user?.full_name || '—'}</span></div>
                                <div><span className="text-gray-400">Email:</span> <span className="font-semibold">{detailItem.user?.email || '—'}</span></div>
                                <div><span className="text-gray-400">Business:</span> <span className="font-semibold">{detailItem.business_name || '—'}</span></div>
                                <div><span className="text-gray-400">Type:</span> <span className="font-semibold capitalize">{detailItem.business_type || '—'}</span></div>
                                <div><span className="text-gray-400">Status:</span> <span className="font-semibold capitalize">{detailItem.status || '—'}</span></div>
                                <div><span className="text-gray-400">Phone:</span> <span className="font-semibold">{detailItem.phone || detailItem.user?.phone || '—'}</span></div>
                            </div>
                            {detailItem.rejection_reason && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                    <p className="text-sm text-red-700"><strong>Rejection Reason:</strong> {detailItem.rejection_reason}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailItem(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Reusable loading skeleton for all tabs
function LoadingSkeleton() {
    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-50">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="px-5 py-4 flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-200 rounded-full" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-gray-200 rounded" />
                                <div className="h-3 w-24 bg-gray-200 rounded" />
                            </div>
                        </div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Reusable empty state
function EmptyState({ icon: Icon, message, description }: { icon: any; message: string; description: string }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl py-16 flex flex-col items-center text-center">
            <Icon className="w-12 h-12 text-gray-200 mb-4" />
            <h3 className="font-semibold text-gray-700 text-lg">{message}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
    )
}
