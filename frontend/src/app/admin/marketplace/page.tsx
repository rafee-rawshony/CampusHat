'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { Search, Eye, CheckCircle, XCircle, Flag, ShoppingBag, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
    reported: 'bg-orange-100 text-orange-700',
    active: 'bg-blue-100 text-blue-700',
}

const AD_TYPES = [
    { value: 'all', label: 'All Types' },
    { value: 'buy', label: 'Buy / Sell' },
    { value: 'rental', label: 'Rental' },
    { value: 'service', label: 'Services' },
    { value: 'food', label: 'Food' },
]

const AD_STATUSES = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'reported', label: 'Reported' },
]

function formatDate(d: string) {
    return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
}

export default function AdminMarketplacePage() {
    const queryClient = useQueryClient()

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [adType, setAdType] = useState('all')
    const [page, setPage] = useState(1)

    const [selectedAd, setSelectedAd] = useState<any>(null)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [actionAd, setActionAd] = useState<any>(null)

    const params = useMemo(() => {
        const p: Record<string, any> = { page, page_size: 20 }
        if (search) p.search = search
        if (status !== 'all') p.status = status
        if (adType !== 'all') p.ad_type = adType
        return p
    }, [page, search, status, adType])

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-marketplace-ads', params],
        queryFn: () => api.get('/admin/marketplace/', { params }).then(r => r.data),
        staleTime: 30_000,
    })

    const ads = response?.data?.results || response?.results || []
    const totalCount = response?.data?.count || response?.count || 0
    const totalPages = Math.ceil(totalCount / 20) || 1

    const { mutate: approveAd, isPending: approving } = useMutation({
        mutationFn: (id: string) => api.post(`/admin/marketplace/${id}/approve/`),
        onSuccess: () => {
            toast.success('Ad approved successfully.')
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-ads'] })
        },
        onError: () => toast.error('Failed to approve ad.')
    })

    const { mutate: rejectAd, isPending: rejecting } = useMutation({
        mutationFn: ({ id, reason }: { id: string, reason: string }) =>
            api.post(`/admin/marketplace/${id}/reject/`, { reason }),
        onSuccess: () => {
            toast.success('Ad rejected.')
            setRejectDialogOpen(false)
            setRejectReason('')
            setActionAd(null)
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-ads'] })
        },
        onError: () => toast.error('Failed to reject ad.')
    })

    const handleRejectOpen = (ad: any) => {
        setActionAd(ad)
        setRejectDialogOpen(true)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="font-bold text-2xl text-gray-900 tracking-tight">Marketplace Ads</h1>
                <p className="text-sm text-gray-500 mt-1">Review, approve, and manage all marketplace listings.</p>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1) }}
                            placeholder="Search by title or seller..."
                            className="bg-gray-50 border-gray-200 pl-9 rounded-lg"
                        />
                    </div>
                    <div className="w-full sm:w-[160px]">
                        <Select value={status} onValueChange={v => { setStatus(v); setPage(1) }}>
                            <SelectTrigger className="bg-gray-50 border-gray-200 font-semibold text-gray-700">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {AD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full sm:w-[160px]">
                        <Select value={adType} onValueChange={v => { setAdType(v); setPage(1) }}>
                            <SelectTrigger className="bg-gray-50 border-gray-200 font-semibold text-gray-700">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                {AD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {totalCount > 0 && (
                        <span className="text-sm text-gray-500 ml-auto font-medium">
                            {totalCount} listing{totalCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="px-4 py-4 flex items-center justify-between animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-48 bg-gray-200 rounded" />
                                        <div className="h-3 w-32 bg-gray-200 rounded" />
                                    </div>
                                </div>
                                <div className="h-6 w-20 bg-gray-200 rounded-full hidden md:block" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : ads.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl py-20 flex flex-col items-center text-center shadow-sm">
                    <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
                    <h3 className="font-semibold text-gray-700 text-lg">No ads found</h3>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[260px]">AD</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[120px]">TYPE</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[130px]">STATUS</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[130px]">POSTED</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[160px] text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {ads.map((ad: any) => {
                                const statusKey = ad.is_reported ? 'reported' : (ad.status || ad.approval_status || 'pending')
                                const pill = STATUS_COLORS[statusKey] || STATUS_COLORS['pending']

                                return (
                                    <tr key={ad.id} className="hover:bg-gray-50/50 transition group">
                                        <td className="px-4 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                                    {ad.images?.[0]?.image || ad.image_url ? (
                                                        <img
                                                            src={ad.images?.[0]?.image || ad.image_url}
                                                            alt={ad.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 pr-2">
                                                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-[#4C3B8A] transition-colors">
                                                        {ad.title}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                                                        by {ad.seller_name || ad.user?.full_name || 'Unknown'}
                                                    </p>
                                                    {ad.price && (
                                                        <p className="text-xs font-bold text-gray-600 mt-0.5">৳{ad.price}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-xs font-semibold text-gray-600 capitalize">
                                                {ad.ad_type || ad.category || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${pill}`}>
                                                {statusKey}
                                            </span>
                                            {ad.is_reported && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Flag className="w-3 h-3 text-orange-500" />
                                                    <span className="text-[10px] text-orange-500 font-semibold">{ad.report_count} report{ad.report_count !== 1 ? 's' : ''}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-500">{formatDate(ad.created_at)}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-3 rounded-lg text-gray-500 hover:text-gray-700"
                                                    onClick={() => setSelectedAd(ad)}
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                                                </Button>
                                                {(statusKey === 'pending' || statusKey === 'reported') && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                                                            onClick={() => approveAd(ad.id)}
                                                            disabled={approving}
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                                                            onClick={() => handleRejectOpen(ad)}
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition bg-white shadow-sm font-bold"
                    >&larr;</button>
                    <span className="w-9 h-9 rounded-lg bg-[#4C3B8A] text-white flex items-center justify-center font-bold shadow-sm">{page}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition bg-white shadow-sm font-bold"
                    >&rarr;</button>
                </div>
            )}

            {/* Ad Detail Modal */}
            <Dialog open={!!selectedAd} onOpenChange={open => !open && setSelectedAd(null)}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Ad Details</DialogTitle>
                    </DialogHeader>
                    {selectedAd && (
                        <div className="space-y-4">
                            <div>
                                <p className="font-bold text-gray-900 text-lg">{selectedAd.title}</p>
                                <p className="text-sm text-gray-500 mt-1">{selectedAd.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-gray-400">Type:</span> <span className="font-semibold">{selectedAd.ad_type || '—'}</span></div>
                                <div><span className="text-gray-400">Price:</span> <span className="font-semibold">৳{selectedAd.price || '—'}</span></div>
                                <div><span className="text-gray-400">Seller:</span> <span className="font-semibold">{selectedAd.seller_name || selectedAd.user?.full_name || '—'}</span></div>
                                <div><span className="text-gray-400">Posted:</span> <span className="font-semibold">{formatDate(selectedAd.created_at)}</span></div>
                            </div>
                            {selectedAd.is_reported && (
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-orange-700 font-medium">{selectedAd.report_count} report{selectedAd.report_count !== 1 ? 's' : ''} received.</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSelectedAd(null)}>Close</Button>
                        {selectedAd && (selectedAd.status === 'pending' || selectedAd.is_reported) && (
                            <>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => { approveAd(selectedAd.id); setSelectedAd(null) }}
                                >
                                    Approve
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => { setActionAd(selectedAd); setSelectedAd(null); setRejectDialogOpen(true) }}
                                >
                                    Reject
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={open => !open && setRejectDialogOpen(false)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Reject Ad</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">Provide a reason for rejecting <strong>{actionAd?.title}</strong>.</p>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]"
                            rows={4}
                            placeholder="E.g. Violates community guidelines..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={rejecting || rejectReason.trim().length < 5}
                            onClick={() => rejectAd({ id: actionAd.id, reason: rejectReason.trim() })}
                        >
                            {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
