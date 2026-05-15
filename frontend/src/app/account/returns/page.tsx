'use client'

/**
 * My Returns.
 *
 * Lists buyer's refund requests + allows initiating new return requests
 * on delivered orders (within 7-day window like Daraz).
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Package, RotateCcw, Loader2, ImageIcon, X, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { api } from '@/lib/api'
import { listMyOrders } from '@/services/orders.service'
import { uploadImage } from '@/services/upload.service'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const RETURN_REASONS = [
    { value: 'defective', label: 'Defective / Damaged Product' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'not_as_described', label: 'Not as Described' },
    { value: 'changed_mind', label: 'Changed My Mind' },
    { value: 'other', label: 'Other' },
]

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    pending: { icon: Clock, color: 'bg-amber-50 text-amber-700', label: 'Pending' },
    under_review: { icon: AlertCircle, color: 'bg-blue-50 text-blue-700', label: 'Under Review' },
    approved: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700', label: 'Approved' },
    rejected: { icon: XCircle, color: 'bg-red-50 text-red-700', label: 'Rejected' },
    processed: { icon: CheckCircle2, color: 'bg-purple-50 text-purple-700', label: 'Refunded' },
}

export default function ReturnsPage() {
    const searchParams = useSearchParams()
    const preselectedOrderId = searchParams.get('order')
    const queryClient = useQueryClient()

    const [showForm, setShowForm] = useState(!!preselectedOrderId)
    const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '')
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
    const [evidencePreviews, setEvidencePreviews] = useState<string[]>([])
    const [uploadingEvidence, setUploadingEvidence] = useState(false)
    const evidenceInputRef = useRef<HTMLInputElement>(null)

    // Fetch refund requests
    const { data: refunds, isLoading: refundsLoading } = useQuery({
        queryKey: ['my-refunds'],
        queryFn: async () => {
            const res = await api.get('/refunds/my-refunds/')
            return res.data?.data?.results || res.data?.data || res.data?.results || []
        },
    })

    // Fetch delivered orders (eligible for return)
    const { data: deliveredOrders } = useQuery({
        queryKey: ['delivered-orders'],
        queryFn: async () => {
            const res = await listMyOrders({ ordering: '-created_at', status: 'delivered' })
            return res?.data?.results || res?.results || res?.data || res || []
        },
        enabled: showForm,
    })

    // Submit return request
    const submitMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/refunds/request/', {
                order_id: selectedOrderId,
                reason: `[${reason}] ${description}`.trim(),
                evidence_urls: evidenceUrls,
            })
            return res.data
        },
        onSuccess: () => {
            toast.success('Return request submitted!')
            setShowForm(false)
            setSelectedOrderId('')
            setReason('')
            setDescription('')
            evidencePreviews.forEach(p => URL.revokeObjectURL(p))
            setEvidenceUrls([])
            setEvidencePreviews([])
            queryClient.invalidateQueries({ queryKey: ['my-refunds'] })
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Failed to submit return request.'
            toast.error(msg)
        },
    })

    const handleEvidenceFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ''
        const slots = 5 - evidenceUrls.length
        if (slots <= 0) return

        setUploadingEvidence(true)
        for (const file of files.slice(0, slots)) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                toast.error(`${file.name}: Only JPG/PNG/WebP allowed`)
                continue
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name}: Must be under 5 MB`)
                continue
            }
            const preview = URL.createObjectURL(file)
            setEvidencePreviews(prev => [...prev, preview])
            try {
                const result = await uploadImage(file, 'review')
                setEvidenceUrls(prev => [...prev, result.url])
            } catch {
                toast.error(`Failed to upload ${file.name}`)
                setEvidencePreviews(prev => prev.filter(p => p !== preview))
                URL.revokeObjectURL(preview)
            }
        }
        setUploadingEvidence(false)
    }

    const removeEvidence = (idx: number) => {
        URL.revokeObjectURL(evidencePreviews[idx])
        setEvidenceUrls(prev => prev.filter((_, i) => i !== idx))
        setEvidencePreviews(prev => prev.filter((_, i) => i !== idx))
    }

    const refundList: any[] = Array.isArray(refunds) ? refunds : []

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 sm:px-6 md:px-8 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">My Returns</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Track return requests and initiate new returns (within 7 days of delivery).
                    </p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold rounded-xl">
                        <Plus className="w-4 h-4 mr-1" /> New Return
                    </Button>
                )}
            </div>

            {/* Return Request Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Request a Return</h2>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-5 max-w-2xl">
                        {/* Order Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Select Order</label>
                            <select
                                value={selectedOrderId}
                                onChange={(e) => setSelectedOrderId(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30 focus:border-[#4C3B8A]"
                            >
                                <option value="">Choose a delivered order...</option>
                                {(deliveredOrders || []).map((order: any) => (
                                    <option key={order.id} value={order.id}>
                                        #{order.order_number} — ৳{parseFloat(order.total_amount).toLocaleString()} — {new Date(order.created_at).toLocaleDateString('en-BD', { dateStyle: 'medium' })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Reason for Return</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30 focus:border-[#4C3B8A]"
                            >
                                <option value="">Select a reason...</option>
                                {RETURN_REASONS.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the issue in detail..."
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30 focus:border-[#4C3B8A] resize-none"
                                rows={4}
                                maxLength={1000}
                            />
                        </div>

                        {/* Evidence Photos */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700">
                                    Evidence Photos <span className="text-gray-400 font-normal">(Optional, max 5)</span>
                                </label>
                                <span className="text-xs text-gray-400">{evidencePreviews.length}/5</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {/* Thumbnails */}
                                {evidencePreviews.map((preview, idx) => (
                                    <div key={preview} className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={preview} alt="" className="w-full h-full object-cover" />
                                        {/* show spinner if upload still in progress (url not yet set) */}
                                        {!evidenceUrls[idx] && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                                            </div>
                                        )}
                                        {evidenceUrls[idx] && (
                                            <button
                                                type="button"
                                                onClick={() => removeEvidence(idx)}
                                                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Add photo button */}
                                {evidencePreviews.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => evidenceInputRef.current?.click()}
                                        disabled={uploadingEvidence}
                                        className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#4C3B8A] hover:border-[#4C3B8A] hover:bg-purple-50 transition-colors shrink-0 disabled:opacity-50"
                                    >
                                        {uploadingEvidence ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <ImageIcon className="w-5 h-5" />
                                                <span className="text-[9px] font-semibold">Upload</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-400">JPG, PNG or WebP — max 5 MB each</p>
                            <input
                                ref={evidenceInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                                onChange={handleEvidenceFiles}
                            />
                        </div>

                        {/* Submit */}
                        <div className="pt-2">
                            <Button
                                onClick={() => submitMutation.mutate()}
                                disabled={!selectedOrderId || !reason || submitMutation.isPending}
                                className="w-full h-12 bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-bold rounded-xl"
                            >
                                {submitMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <RotateCcw className="w-4 h-4 mr-2" /> Submit Return Request
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Returns */}
            {refundsLoading ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
            ) : refundList.length === 0 && !showForm ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RotateCcw className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No returns yet</h3>
                    <p className="text-sm text-gray-500 mb-5">
                        Return requests will appear here. You can return delivered orders within 7 days.
                    </p>
                    <Link href="/account/orders">
                        <Button variant="outline">Back to My Orders</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {refundList.map((refund: any) => {
                        const statusInfo = STATUS_CONFIG[refund.status] || STATUS_CONFIG.pending
                        const StatusIcon = statusInfo.icon
                        return (
                            <div
                                key={refund.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3 text-sm">
                                        <RotateCcw className="w-4 h-4 text-gray-400" />
                                        <span className="font-semibold text-gray-700">
                                            Return #{refund.id?.slice(0, 8).toUpperCase()}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(refund.created_at).toLocaleDateString('en-BD', { dateStyle: 'medium' })}
                                        </span>
                                    </div>
                                    <span className={cn('text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded flex items-center gap-1', statusInfo.color)}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusInfo.label}
                                    </span>
                                </div>

                                <div className="p-5 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Order</span>
                                        <Link href={`/orders/${refund.order_id || refund.order}`} className="font-semibold text-[#4C3B8A] hover:underline">
                                            #{refund.order_number || 'View'}
                                        </Link>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Reason</span>
                                        <span className="font-semibold text-gray-900 max-w-[200px] text-right truncate">{refund.reason}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Refund Amount</span>
                                        <span className="font-bold text-gray-900">৳{parseFloat(refund.refund_amount || '0').toLocaleString()}</span>
                                    </div>
                                    {refund.rejection_reason && (
                                        <div className="mt-2 bg-red-50 rounded-xl p-3 text-sm text-red-700">
                                            <strong>Rejection Reason:</strong> {refund.rejection_reason}
                                        </div>
                                    )}
                                    {refund.evidence_urls && refund.evidence_urls.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {refund.evidence_urls.map((url: string, idx: number) => (
                                                <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
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
