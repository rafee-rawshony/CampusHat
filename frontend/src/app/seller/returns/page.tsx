'use client'

/**
 * Seller Returns / Refund Requests — Daraz-style.
 *
 * Read-only list of refund requests raised against this seller's orders.
 * Approving / rejecting is admin-only (intentional separation), but
 * sellers can see what's pending so they can prepare evidence.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
    RotateCcw, Loader2, Filter, Clock, CheckCircle2, XCircle, Wallet,
} from 'lucide-react'

import { api } from '@/lib/api'

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
    const [statusFilter, setStatusFilter] = useState<string>('all')

    const { data: refunds = [], isLoading } = useQuery<SellerRefund[]>({
        queryKey: ['seller-refunds', statusFilter],
        queryFn: () =>
            api.get('/seller/refunds/', {
                params: statusFilter !== 'all' ? { status: statusFilter } : {},
            }).then((r) => r.data?.data || []),
    })

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-bold text-2xl text-gray-900">Returns &amp; Refunds</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Track refund requests on your orders. Final approval is handled by admins
                    to ensure fairness for both sides.
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
                                ? 'bg-brand-primary text-white border border-brand-primary'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-primary'
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
                                            className="font-mono font-semibold text-gray-700 hover:text-brand-primary"
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
                                                        className="block w-16 h-16 rounded border border-gray-200 overflow-hidden hover:border-brand-primary"
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

            {/* Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                <strong>📋 How returns work:</strong> Buyers raise refund requests after delivery.
                The CampusHat admin team reviews each one and decides the outcome based on evidence
                from both sides. If you want to dispute a request, contact support with your evidence.
            </div>
        </div>
    )
}
