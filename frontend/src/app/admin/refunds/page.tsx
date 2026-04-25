'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import {
    RotateCcw, Eye, CheckCircle, XCircle, CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-600',
    processed: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
}

export default function AdminRefundsPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()

    const [selectedRefund, setSelectedRefund] = useState<any>(null)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectTarget, setRejectTarget] = useState<any>(null)
    const [rejectReason, setRejectReason] = useState('')

    useEffect(() => {
        if (!isAdmin()) router.replace('/admin/approvals')
    }, [isAdmin, router])

    // Fetch pending refunds
    const { data: refundsData, isLoading } = useQuery({
        queryKey: ['admin-refunds'],
        queryFn: () => api.get('/admin/refunds/pending/').then(r => {
            const d = r.data?.data || r.data
            return Array.isArray(d) ? d : d?.results || []
        }),
        staleTime: 30_000,
    })

    const refunds = Array.isArray(refundsData) ? refundsData : []

    // Approve refund
    const { mutate: approveRefund, isPending: approving } = useMutation({
        mutationFn: (id: string) => api.post(`/admin/refunds/${id}/approve/`),
        onSuccess: () => {
            toast.success('Refund approved.')
            queryClient.invalidateQueries({ queryKey: ['admin-refunds'] })
        },
        onError: () => toast.error('Failed to approve refund.'),
    })

    // Process refund (mark as money returned)
    const { mutate: processRefund, isPending: processing } = useMutation({
        mutationFn: (id: string) => api.post(`/admin/refunds/${id}/process/`),
        onSuccess: () => {
            toast.success('Refund processed successfully.')
            queryClient.invalidateQueries({ queryKey: ['admin-refunds'] })
        },
        onError: () => toast.error('Failed to process refund.'),
    })

    // Reject refund
    const { mutate: rejectRefund, isPending: rejecting } = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            api.post(`/admin/refunds/${id}/reject/`, { reason }),
        onSuccess: () => {
            toast.success('Refund rejected.')
            setRejectDialogOpen(false)
            setRejectTarget(null)
            setRejectReason('')
            queryClient.invalidateQueries({ queryKey: ['admin-refunds'] })
        },
        onError: () => toast.error('Failed to reject refund.'),
    })

    if (!isAdmin()) return null

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div>
                <h1 className="font-bold text-2xl text-gray-900 tracking-tight">Refund Management</h1>
                <p className="text-sm text-gray-500 mt-1">Review and process customer refund requests.</p>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                <div className="h-4 w-32 bg-gray-200 rounded" />
                                <div className="h-4 w-20 bg-gray-200 rounded" />
                                <div className="flex-1" />
                                <div className="h-6 w-16 bg-gray-200 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : refunds.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl py-16 flex flex-col items-center text-center">
                    <RotateCcw className="w-12 h-12 text-gray-200 mb-4" />
                    <h3 className="font-semibold text-gray-700 text-lg">No pending refunds</h3>
                    <p className="text-sm text-gray-400 mt-1">All refund requests have been processed.</p>
                </div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Order</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {refunds.map((refund: any) => (
                                    <tr key={refund.id} className="hover:bg-gray-50/50 transition">
                                        <td className="px-5 py-4 text-gray-900 font-medium text-sm">
                                            {refund.buyer_name || refund.user?.full_name || '—'}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-xs text-[#4C3B8A]">
                                            #{refund.order_number || refund.order_id?.slice(0, 8) || '—'}
                                        </td>
                                        <td className="px-5 py-4 font-bold text-gray-900">
                                            ৳{Number(refund.amount || refund.refund_amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 text-xs max-w-[200px] truncate">
                                            {refund.reason || '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${STATUS_COLORS[refund.status] || STATUS_COLORS.pending}`}>
                                                {refund.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-400">
                                            {refund.created_at ? new Date(refund.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 px-3 text-gray-500" onClick={() => setSelectedRefund(refund)}>
                                                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                                                </Button>
                                                {refund.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                                                            onClick={() => approveRefund(refund.id)}
                                                            disabled={approving}
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                                                        </Button>
                                                        <Button
                                                            size="sm" variant="outline"
                                                            className="h-8 px-3 border-red-200 text-red-600 text-xs font-bold"
                                                            onClick={() => { setRejectTarget(refund); setRejectDialogOpen(true) }}
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {refund.status === 'approved' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                                        onClick={() => processRefund(refund.id)}
                                                        disabled={processing}
                                                    >
                                                        <CreditCard className="w-3.5 h-3.5 mr-1" /> Process
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
                        {refunds.map((refund: any) => (
                            <div key={refund.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{refund.buyer_name || refund.user?.full_name || '—'}</p>
                                        <p className="text-xs text-gray-400 font-mono">#{refund.order_number || refund.order_id?.slice(0, 8) || '—'}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${STATUS_COLORS[refund.status] || STATUS_COLORS.pending}`}>
                                        {refund.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900">৳{Number(refund.amount || refund.refund_amount || 0).toLocaleString()}</span>
                                    <span className="text-xs text-gray-400">
                                        {refund.created_at ? new Date(refund.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                                    </span>
                                </div>
                                {refund.reason && <p className="text-xs text-gray-500 line-clamp-2">{refund.reason}</p>}
                                {refund.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-bold" onClick={() => approveRefund(refund.id)}>Approve</Button>
                                        <Button size="sm" variant="outline" className="flex-1 h-8 border-red-200 text-red-600 text-xs font-bold" onClick={() => { setRejectTarget(refund); setRejectDialogOpen(true) }}>Reject</Button>
                                    </div>
                                )}
                                {refund.status === 'approved' && (
                                    <Button size="sm" className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold" onClick={() => processRefund(refund.id)}>
                                        Process Refund
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedRefund} onOpenChange={open => !open && setSelectedRefund(null)}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Refund Details</DialogTitle>
                    </DialogHeader>
                    {selectedRefund && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-gray-400">Customer:</span> <span className="font-semibold">{selectedRefund.buyer_name || selectedRefund.user?.full_name || '—'}</span></div>
                                <div><span className="text-gray-400">Order:</span> <span className="font-semibold font-mono">#{selectedRefund.order_number || selectedRefund.order_id?.slice(0, 8) || '—'}</span></div>
                                <div><span className="text-gray-400">Amount:</span> <span className="font-semibold">৳{Number(selectedRefund.amount || selectedRefund.refund_amount || 0).toLocaleString()}</span></div>
                                <div><span className="text-gray-400">Status:</span> <span className="font-semibold capitalize">{selectedRefund.status}</span></div>
                            </div>
                            {selectedRefund.reason && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Reason:</p>
                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedRefund.reason}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRefund(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={open => !open && setRejectDialogOpen(false)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Reject Refund</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">Provide a reason for rejecting this refund request.</p>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]"
                            rows={4}
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={rejecting || rejectReason.trim().length < 5}
                            onClick={() => rejectTarget && rejectRefund({ id: rejectTarget.id, reason: rejectReason.trim() })}
                        >
                            {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
