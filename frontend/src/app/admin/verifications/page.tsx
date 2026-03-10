'use client'

import React, { useState, useEffect } from 'react'
import {
    CheckCircle2, XCircle, FileText, ExternalLink, RefreshCw, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'

type VerifTab = 'pending' | 'approved' | 'rejected'

export default function AdminVerificationsPage() {
    const [items, setItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [tab, setTab] = useState<VerifTab>('pending')
    const [approveModal, setApproveModal] = useState<any>(null)
    const [rejectModal, setRejectModal] = useState<any>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

    useEffect(() => {
        // API: GET /api/v1/admin/verifications/
        setTimeout(() => {
            setItems([
                {
                    id: 'v1', userName: 'Rahim Uddin', email: 'rahim@du.ac.bd',
                    university: 'University of Dhaka', verificationType: 'Student ID',
                    submittedDate: '2024-06-24', status: 'pending',
                    documentUrl: 'https://placehold.co/600x400/purple/white?text=Student+ID',
                    targetRole: 'student'
                },
                {
                    id: 'v2', userName: 'Dr. Karim Hasan', email: 'karim.f@buet.ac.bd',
                    university: 'BUET', verificationType: 'Faculty ID',
                    submittedDate: '2024-06-23', status: 'pending',
                    documentUrl: 'https://placehold.co/600x400/blue/white?text=Faculty+ID',
                    targetRole: 'faculty'
                },
                {
                    id: 'v3', userName: 'Sadia Rahman', email: 'sadia@nsu.edu.bd',
                    university: 'NSU', verificationType: 'Student ID',
                    submittedDate: '2024-06-20', status: 'approved',
                    documentUrl: null, targetRole: 'student'
                },
                {
                    id: 'v4', userName: 'Unknown Person', email: 'unknown@fake.com',
                    university: 'Unknown', verificationType: 'Student ID',
                    submittedDate: '2024-06-18', status: 'rejected',
                    documentUrl: null, rejectReason: 'Blurry or unreadable document',
                    targetRole: 'student'
                },
            ])
            setIsLoading(false)
        }, 600)
    }, [])

    const tabs: { id: VerifTab; label: string }[] = [
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Rejected' },
    ]

    const filtered = items.filter(i => i.status === tab)

    const handleApprove = () => {
        if (!approveModal) return
        setItems(prev => prev.map(i => i.id === approveModal.id ? { ...i, status: 'approved' } : i))
        toast.success(`${approveModal.userName} verified as ${approveModal.targetRole}`)
        setApproveModal(null)
    }

    const handleReject = () => {
        if (!rejectModal || !rejectReason.trim()) { toast.error('Please provide a reason'); return }
        setItems(prev => prev.map(i => i.id === rejectModal.id ? { ...i, status: 'rejected', rejectReason } : i))
        toast.success('Verification rejected')
        setRejectModal(null)
        setRejectReason('')
    }

    const viewDocument = (item: any) => {
        // In production: fetch presigned URL from API
        // API: GET /api/v1/admin/verifications/{id}/document/
        if (item.documentUrl) {
            setLightboxUrl(item.documentUrl)
        } else {
            toast.error('No document available')
        }
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Student Verifications</h1>
                <p className="text-gray-500 text-sm mt-1">Review and approve student and faculty identity verification requests.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2
                            ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {t.label}
                        {t.id === 'pending' && items.filter(i => i.status === 'pending').length > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                {items.filter(i => i.status === 'pending').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Verification Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-44 bg-gray-200 rounded-2xl"></div>)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                    <p className="text-gray-500 font-medium">No {tab} verifications found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {filtered.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shrink-0">
                                        {item.userName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-gray-900">{item.userName}</h3>
                                        <p className="text-xs text-gray-500 font-medium">{item.email}</p>
                                        <p className="text-xs text-gray-400 mt-1 font-medium">{item.university}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">{item.verificationType}</div>
                                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Submitted {item.submittedDate}</p>
                                    </div>
                                </div>
                            </div>

                            {item.rejectReason && (
                                <div className="px-5 py-3 border-b border-gray-100 bg-red-50/50">
                                    <p className="text-xs font-bold text-red-600">Rejection Reason: <span className="font-medium text-red-500">{item.rejectReason}</span></p>
                                </div>
                            )}

                            <div className="p-4 flex flex-wrap gap-2">
                                <Button
                                    onClick={() => viewDocument(item)}
                                    variant="outline"
                                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl gap-2 text-sm"
                                >
                                    <FileText className="w-4 h-4" /> View Documents
                                    <ExternalLink className="w-3 h-3" />
                                </Button>

                                {tab === 'pending' && (
                                    <>
                                        <Button
                                            onClick={() => setApproveModal(item)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Approve
                                        </Button>
                                        <Button
                                            onClick={() => { setRejectReason(''); setRejectModal(item) }}
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl gap-2"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => toast.success('Resubmission requested')}
                                            className="border-amber-200 text-amber-700 hover:bg-amber-50 font-bold rounded-xl gap-2"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Request Resubmission
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxUrl && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
                    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setLightboxUrl(null)}
                            className="absolute -top-10 right-0 text-white/70 hover:text-white p-2 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={lightboxUrl} alt="Verification Document" className="w-full rounded-xl shadow-2xl" />
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            <Dialog open={!!approveModal} onOpenChange={() => setApproveModal(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogTitle className="font-black text-gray-900">Approve Verification</DialogTitle>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                        <p>This will upgrade <strong>{approveModal?.userName}</strong> to <strong>{approveModal?.targetRole}</strong> status on CampusHat.</p>
                        <p className="text-xs text-emerald-600 mt-1">They will receive a notification confirming their new verification status.</p>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setApproveModal(null)} className="border-gray-200">Cancel</Button>
                        <Button onClick={handleApprove} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">Confirm Approval</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogTitle className="font-black text-gray-900">Reject Verification</DialogTitle>
                    <p className="text-sm text-gray-500">Provide a reason for rejecting <span className="font-bold text-gray-800">{rejectModal?.userName}&apos;s</span> verification:</p>
                    <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="e.g. Blurry or unreadable document. Please resubmit a clear photo."
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setRejectModal(null)} className="border-gray-200">Cancel</Button>
                        <Button onClick={handleReject} className="bg-red-500 hover:bg-red-600 text-white font-bold">Reject</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
