'use client'

/**
 * Seller Returns / Refund Requests — Daraz-style.
 *
 * Sellers can view refund requests, and for pending/under_review ones,
 * accept or dispute them. Final decision is still admin-only.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    RotateCcw, Loader2, Filter, Clock, CheckCircle2, XCircle, Wallet,
    ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { normalizeListResponse } from '@/lib/response'

interface SellerRefund {
    id: string
    order_id: string
    order_number: string
    buyer_email: string | null
    product_name: string | null
    reason: string
    evidence_urls: string[]
    refund_amount: string
    seller_deduction_amount: string
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'processed'
    rejection_reason?: string | null
    seller_response?: 'accepted' | 'disputed' | null
    seller_response_note?: string | null
    approved_at?: string | null
    processed_at?: string | null
    created_at: string
}

const STATUS_DEF: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:      { label: 'Pending',      color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
    under_review: { label: 'Under Review', color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Clock },
    approved:     { label: 'Approved',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    rejected:     { label: 'Rejected',     color: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
    processed:    { label: 'Processed',    color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Wallet },
}

export default function SellerReturnsPage() {
    const queryClient = useQueryClient()
    const [statusFilter, setStatusFilter] = useState<string>('all')

    // Track which refund has an expanded action form
    const [acceptingId, setAcceptingId] = useState<string | null>(null)
    const [disputingId, setDisputingId] = useState<string | null>(null)
    const [acceptNote, setAcceptNote] = useState('')
    const [disputeNote, setDisputeNote] = useState('')

    const { data: refunds = [], isLoading } = useQuery<SellerRefund[]>({
        queryKey: ['seller-refunds', statusFilter],
        queryFn: () =>
            api.get('/seller/refunds/', {
                params: statusFilter !== 'all' ? { status: statusFilter } : {},
            }).then((r) => normalizeListResponse<SellerRefund>(r.data?.data ?? r.data)),
    })

    const acceptMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note: string }) =>
            api.post(`/seller/refunds/${id}/accept/`, { note }),
        onSuccess: () => {
            toast.success('Return accepted. Admin will review.')
            queryClient.invalidateQueries({ queryKey: ['seller-refunds'] })
            setAcceptingId(null)
            setAcceptNote('')
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to accept'),
    })

    const disputeMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note: string }) =>
            api.post(`/seller/refunds/${id}/dispute/`, { note }),
        onSuccess: () => {
            toast.success('Dispute submitted. Admin will review your response.')
            queryClient.invalidateQueries({ queryKey: ['seller-refunds'] })
            setDisputingId(null)
            setDisputeNote('')
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to submit dispute'),
    })

    const canRespond = (r: SellerRefund) =>
        (r.status === 'pending' || r.status === 'under_review') && !r.seller_response

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-bold text-2xl text-gray-900">Returns &amp; Refunds</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Track refund requests on your orders. Accept or dispute returns — admin makes the final decision.
                </p>
            </div>

            {/* Status filter tabs */}
            <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4 flex flex-wrap gap-2 items-center">
                <Filter className="h-4 w-4 text-gray-500 ml-1" />
                {[
                    { key: 'all',          label: 'All' },
                    { key: 'pending',      label: 'Pending' },
                    { key: 'under_review', label: 'Under Review' },
                    { key: 'approved',     label: 'Approved' },
                    { key: 'rejected',     label: 'Rejected' },
                    { key: 'processed',    label: 'Processed' },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            statusFilter === f.key
                                ? 'bg-[#4C3B8A] text-white border border-[#4C3B8A]'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-[#4C3B8A]'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
            ) : refunds.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RotateCcw className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No refund requests</h3>
                    <p className="text-sm text-gray-500">
                        {statusFilter !== 'all' ? 'Try a different status filter.' : "You haven't received any refund requests."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {refunds.map((r) => {
                        const def = STATUS_DEF[r.status] || STATUS_DEF.pending
                        const Icon = def.icon
                        return (
                            <div
                                key={r.id}
                                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Link
                                            href={`/seller/orders/${r.order_id}`}
                                            className="font-mono font-semibold text-gray-700 hover:text-[#4C3B8A]"
                                        >
                                            #{r.order_number}
                                        </Link>
                                        {r.buyer_email && (
                                            <>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-xs text-gray-500 truncate max-w-[180px]">
                                                    {r.buyer_email}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded border ${def.color}`}>
                                        <Icon className="h-3 w-3" />
                                        {def.label}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-5">
                                    {r.product_name && (
                                        <p className="text-sm font-semibold text-gray-900 mb-2">
                                            {r.product_name}
                                        </p>
                                    )}
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                            Buyer's Reason
                                        </p>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">{r.reason}</p>
                                    </div>

                                    {r.evidence_urls && r.evidence_urls.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                                Evidence ({r.evidence_urls.length})
                                            </p>
                                            <div className="flex gap-2 flex-wrap">
                                                {r.evidence_urls.map((url, i) => (
                                                    <a
                                                        key={i}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block w-16 h-16 rounded border border-gray-200 overflow-hidden hover:border-[#4C3B8A]"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {r.rejection_reason && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded">
                                            <p className="text-xs font-bold text-red-700 uppercase mb-1">Rejection Reason</p>
                                            <p className="text-sm text-red-700">{r.rejection_reason}</p>
                                        </div>
                                    )}

                                    {/* ─── Seller Response Display ─── */}
                                    {r.seller_response && (
                                        <div className={`mt-3 p-3 rounded border ${
                                            r.seller_response === 'accepted'
                                                ? 'bg-emerald-50 border-emerald-100'
                                                : 'bg-amber-50 border-amber-100'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                {r.seller_response === 'accepted' ? (
                                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                )}
                                                <span className={`text-xs font-bold uppercase ${
                                                    r.seller_response === 'accepted' ? 'text-emerald-700' : 'text-amber-700'
                                                }`}>
                                                    {r.seller_response === 'accepted'
                                                        ? 'You accepted this return'
                                                        : 'You disputed this return'}
                                                </span>
                                            </div>
                                            {r.seller_response_note && (
                                                <p className={`text-sm ${
                                                    r.seller_response === 'accepted' ? 'text-emerald-700' : 'text-amber-700'
                                                }`}>
                                                    {r.seller_response_note}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* ─── Seller Action Buttons ─── */}
                                    {canRespond(r) && (
                                        <div className="mt-4 space-y-3">
                                            {/* Accept flow */}
                                            {acceptingId === r.id ? (
                                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg space-y-2">
                                                    <p className="text-xs font-bold text-emerald-700 uppercase">Accept Return</p>
                                                    <textarea
                                                        rows={2}
                                                        value={acceptNote}
                                                        onChange={e => setAcceptNote(e.target.value)}
                                                        placeholder="Optional note (e.g. 'Product received back')"
                                                        className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-white resize-none"
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => { setAcceptingId(null); setAcceptNote('') }}
                                                            className="text-xs border-gray-200"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            disabled={acceptMutation.isPending}
                                                            onClick={() => acceptMutation.mutate({ id: r.id, note: acceptNote })}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                                                        >
                                                            {acceptMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                                                            Confirm Accept
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : disputingId === r.id ? (
                                                /* Dispute flow */
                                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg space-y-2">
                                                    <p className="text-xs font-bold text-amber-700 uppercase">Dispute Return</p>
                                                    <textarea
                                                        rows={3}
                                                        value={disputeNote}
                                                        onChange={e => setDisputeNote(e.target.value)}
                                                        placeholder="Explain why this return should not be approved... (min 20 chars)"
                                                        className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 bg-white resize-none"
                                                    />
                                                    {disputeNote.length > 0 && disputeNote.length < 20 && (
                                                        <p className="text-xs text-red-500">{20 - disputeNote.length} more characters needed</p>
                                                    )}
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => { setDisputingId(null); setDisputeNote('') }}
                                                            className="text-xs border-gray-200"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            disabled={disputeMutation.isPending || disputeNote.length < 20}
                                                            onClick={() => disputeMutation.mutate({ id: r.id, note: disputeNote })}
                                                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1"
                                                        >
                                                            {disputeMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                                                            Submit Dispute
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Action buttons */
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => { setAcceptingId(r.id); setDisputingId(null) }}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept Return
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => { setDisputingId(r.id); setAcceptingId(null) }}
                                                        className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs gap-1"
                                                    >
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Dispute
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer — amounts */}
                                <div className="px-5 py-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                                    <span className="text-xs text-gray-500">
                                        Requested {new Date(r.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-6 text-sm">
                                        <div>
                                            <p className="text-[11px] uppercase text-gray-500 font-bold">Refund Amount</p>
                                            <p className="font-bold text-gray-900">৳{Number(r.refund_amount).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] uppercase text-gray-500 font-bold">Your Deduction</p>
                                            <p className="font-bold text-red-600">-৳{Number(r.seller_deduction_amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Updated Note */}
            <div className="mt-6 p-4 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700">
                <strong>📋 How returns work:</strong> Your response (accept or dispute) is recorded and reviewed by the CampusHat
                team before a final decision is made. Provide evidence for disputes to strengthen your case.
            </div>
        </div>
    )
}
