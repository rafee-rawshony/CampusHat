'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, FileText, Image as ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

type TabType = 'student' | 'marketplace' | 'seller'

const BADGE_OPTIONS = ['Verified Seller', 'Student Seller', 'Official Store']

export default function AdminReviewCenter() {
    const [activeTab, setActiveTab] = useState<TabType>('student')
    // Student Verification tab:
    const { data: verifications, refetch: refetchVerifications, isLoading: pendingStLoading } = useQuery({
        queryKey: ['admin-verifications-pending'],
        queryFn: () => api.get('/admin/verifications/pending/').then(r => r.data?.data || r.data?.results || r.data),
        enabled: activeTab === 'student',
    })

    // Marketplace Ads tab:
    const { data: pendingAds, refetch: refetchAds, isLoading: pendingAdsLoading } = useQuery({
        queryKey: ['admin-marketplace-pending'],
        queryFn: () => api.get('/admin/marketplace/pending/').then(r => r.data?.data || r.data?.results || r.data),
        enabled: activeTab === 'marketplace',
    })

    // Seller Applications tab:
    const { data: sellerApps, refetch: refetchSellers, isLoading: pendingSeLoading } = useQuery({
        queryKey: ['admin-sellers-pending'],
        queryFn: () => api.get('/admin/sellers/pending/').then(r => r.data?.data || r.data?.results || r.data),
        enabled: activeTab === 'seller',
    })

    const isLoading = pendingStLoading || pendingAdsLoading || pendingSeLoading
    const students = verifications || []
    const ads = pendingAds || []
    const sellers = sellerApps || []

    // Modal state
    const [approveModal, setApproveModal] = useState<{ type: TabType; item: any } | null>(null)
    const [rejectModal, setRejectModal] = useState<{ type: TabType; item: any } | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [rejectNotes, setRejectNotes] = useState('')
    const [sellerBadge, setSellerBadge] = useState(BADGE_OPTIONS[0])
    const [lightboxMedia, setLightboxMedia] = useState<{ url: string; isPdf?: boolean } | null>(null)
    const [isMutating, setIsMutating] = useState(false)

    const { mutateAsync: reviewVerification } = useMutation({
        mutationFn: ({ id, action, reason }: { id: string, action: string, reason?: string }) => 
            api.post(`/admin/verifications/${id}/review/`, { action, reason }),
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'approve' ? 'Verification approved' : 'Verification rejected')
            refetchVerifications()
        }
    })

    const { mutateAsync: reviewAd } = useMutation({
        mutationFn: ({ id, action, reason }: { id: string, action: string, reason?: string }) => 
            api.post(`/admin/marketplace/${id}/review/`, { action, reason }),
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'approve' ? 'Ad approved' : 'Ad rejected')
            refetchAds()
        }
    })

    const { mutateAsync: reviewSeller } = useMutation({
        mutationFn: ({ id, action, reason, payload }: { id: string, action: string, reason?: string, payload?: any }) => 
            api.post(`/admin/sellers/${id}/review/`, { action, reason, ...payload }),
        onSuccess: (_, variables) => {
            toast.success(variables.action === 'approve' ? 'Seller approved' : 'Application rejected')
            refetchSellers()
        }
    })


    const handleApprove = async () => {
        if (!approveModal) return
        const { type, item } = approveModal
        setIsMutating(true)
        try {
            if (type === 'student') await reviewVerification({ id: item.id, action: 'approve' })
            if (type === 'marketplace') await reviewAd({ id: item.id, action: 'approve' })
            if (type === 'seller') await reviewSeller({ id: item.id, action: 'approve', payload: { badge: sellerBadge } })
        } catch {
            toast.error('Action failed. Try again.')
        } finally {
            setIsMutating(false)
            setApproveModal(null)
        }
    }

    const handleReject = async () => {
        if (!rejectModal || !rejectReason) { toast.error('Please select a reason'); return }
        const { type, item } = rejectModal
        setIsMutating(true)
        try {
            const reason = rejectNotes ? `${rejectReason}: ${rejectNotes}` : rejectReason
            if (type === 'student') await reviewVerification({ id: item.id, action: 'reject', reason })
            if (type === 'marketplace') await reviewAd({ id: item.id, action: 'reject', reason })
            if (type === 'seller') await reviewSeller({ id: item.id, action: 'reject', reason })
        } catch {
            toast.error('Action failed. Try again.')
        } finally {
            setIsMutating(false)
            setRejectModal(null)
            setRejectReason('')
            setRejectNotes('')
        }
    }

    const unassignedCount = students.length + ads.length + sellers.length

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Review Center</h1>
                <p className="text-gray-500 text-sm mt-1">Action pending requests across the platform</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200">
                {[
                    { id: 'student', label: 'Student Verification', count: students.length },
                    { id: 'marketplace', label: 'Marketplace Ads', count: ads.length },
                    { id: 'seller', label: 'Seller Applications', count: sellers.length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2
                            ${activeTab === tab.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-100 text-gray-500'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Grids */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* STUDENT VERIFICATION TAB */}
                    {activeTab === 'student' && (students.length === 0 ? <p className="text-gray-500 font-medium p-8 bg-white rounded-2xl text-center border col-span-full">No pending verifications.</p> :
                        students.map((student: any) => (
                            <div key={student.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                                {/* Image Preview */}
                                <div
                                    className="aspect-video bg-gray-100 relative cursor-pointer flex items-center justify-center overflow-hidden"
                                    onClick={() => setLightboxMedia({ url: student.docUrl, isPdf: student.isPdf })}
                                >
                                    {student.isPdf ? (
                                        <div className="flex flex-col items-center text-gray-400 group-hover:text-brand-primary transition-colors">
                                            <FileText className="w-10 h-10 mb-2" />
                                            <span className="text-xs font-bold uppercase tracking-wider">View PDF Document</span>
                                        </div>
                                    ) : student.docUrl ? (
                                        <Image src={student.docUrl} alt="ID Document" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400">
                                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                            <span className="text-xs font-bold">No Preview</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-black text-gray-900 text-lg leading-tight">{student.name}</h3>
                                            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 uppercase tracking-widest px-1.5">{student.university}</Badge>
                                        </div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Requested on: {student.date}</p>
                                    </div>
                                    <div className="flex gap-2 mt-5">
                                        <Button onClick={() => { setRejectReason(''); setRejectNotes(''); setRejectModal({ type: 'student', item: student }) }} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl gap-2 h-10">
                                            <XCircle className="w-4 h-4" /> Reject
                                        </Button>
                                        <Button onClick={() => setApproveModal({ type: 'student', item: student })} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl gap-2 h-10 shadow-sm">
                                            <CheckCircle2 className="w-4 h-4" /> Approve
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* MARKETPLACE ADS TAB */}
                    {activeTab === 'marketplace' && (ads.length === 0 ? <p className="text-gray-500 font-medium p-8 bg-white rounded-2xl text-center border col-span-full">No pending ads.</p> :
                        ads.map((ad: any) => (
                            <div key={ad.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                                <div className="aspect-video bg-gray-100 relative overflow-hidden" onClick={() => setLightboxMedia({ url: ad.imgUrl })}>
                                    {ad.imgUrl ? <Image src={ad.imgUrl} alt={ad.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" unoptimized /> : <div className="flex h-full items-center justify-center text-gray-300"><ImageIcon className="w-8 h-8" /></div>}
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="font-black text-gray-900 leading-tight mb-2 line-clamp-1">{ad.title}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-600 border-gray-200 uppercase tracking-wider">{ad.type.replace(/_/g, ' ')}</Badge>
                                            <span className="text-xs text-brand-primary font-bold">{ad.poster}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Posted: {ad.date}</p>
                                    </div>
                                    <div className="flex gap-2 mt-5">
                                        <Button onClick={() => { setRejectReason(''); setRejectNotes(''); setRejectModal({ type: 'marketplace', item: ad }) }} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl gap-2 h-10">
                                            <XCircle className="w-4 h-4" /> Reject
                                        </Button>
                                        <Button onClick={() => setApproveModal({ type: 'marketplace', item: ad })} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl gap-2 h-10 shadow-sm">
                                            <CheckCircle2 className="w-4 h-4" /> Approve
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* SELLER APPLICATIONS TAB */}
                    {activeTab === 'seller' && (sellers.length === 0 ? <p className="text-gray-500 font-medium p-8 bg-white rounded-2xl text-center border col-span-full">No pending applications.</p> :
                        sellers.map((seller: any) => (
                            <div key={seller.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all p-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-700 text-white flex items-center justify-center font-black text-2xl shadow-sm mb-4">
                                    {seller.store[0]}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">{seller.store}</h3>
                                    <p className="text-xs text-gray-500 font-medium mb-3">{seller.applicant} · {seller.university}</p>
                                    <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-600 border-gray-200 uppercase tracking-wider">{seller.type}</Badge>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mt-3">Submitted: {seller.date}</p>
                                </div>
                                <div className="flex gap-2 mt-5">
                                    <Button onClick={() => { setRejectReason(''); setRejectNotes(''); setRejectModal({ type: 'seller', item: seller }) }} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl gap-2 h-10">
                                        <XCircle className="w-4 h-4" /> Reject
                                    </Button>
                                    <Button onClick={() => { setSellerBadge(BADGE_OPTIONS[0]); setApproveModal({ type: 'seller', item: seller }) }} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl gap-2 h-10 shadow-sm">
                                        <CheckCircle2 className="w-4 h-4" /> Approve
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Reject Modal */}
            <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogTitle className="font-black text-gray-900">
                        Reject {rejectModal?.type === 'student' ? 'Verification' : rejectModal?.type === 'marketplace' ? 'Ad' : 'Application'}
                    </DialogTitle>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Rejection Reason</label>
                            <Select value={rejectReason} onValueChange={setRejectReason}>
                                <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ID not clear">ID not clear</SelectItem>
                                    <SelectItem value="Wrong document">Wrong document</SelectItem>
                                    <SelectItem value="Expired ID">Expired ID</SelectItem>
                                    <SelectItem value="Name mismatch">Name mismatch</SelectItem>
                                    <SelectItem value="Inappropriate content">Inappropriate content</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Additional Notes (Optional)</label>
                            <textarea
                                value={rejectNotes}
                                onChange={e => setRejectNotes(e.target.value)}
                                placeholder="Explain what the user needs to fix..."
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end mt-2">
                        <Button variant="outline" onClick={() => setRejectModal(null)} className="border-gray-200 rounded-xl" disabled={isMutating}>Cancel</Button>
                        <Button onClick={handleReject} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-sm" disabled={isMutating}>
                            {isMutating ? 'Sending...' : 'Send Rejection'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Approve Modal */}
            <Dialog open={!!approveModal} onOpenChange={() => setApproveModal(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogTitle className="font-black text-gray-900">Confirm Approval</DialogTitle>

                    {approveModal?.type === 'student' && (
                        <p className="text-sm text-gray-600 leading-relaxed py-2">
                            Approve <strong>{approveModal.item.name}</strong> as a verified student at <strong>{approveModal.item.university}</strong>?
                        </p>
                    )}

                    {approveModal?.type === 'marketplace' && (
                        <p className="text-sm text-gray-600 leading-relaxed py-2">
                            Approve listing <strong>&ldquo;{approveModal.item.title}&rdquo;</strong> to go live on the marketplace?
                        </p>
                    )}

                    {approveModal?.type === 'seller' && (
                        <div className="space-y-4 py-2">
                            <p className="text-sm text-gray-600">
                                Select a storefront badge for <strong>{approveModal.item.store}</strong>:
                            </p>
                            <Select value={sellerBadge} onValueChange={setSellerBadge}>
                                <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {BADGE_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end mt-2">
                        <Button variant="outline" onClick={() => setApproveModal(null)} className="border-gray-200 rounded-xl" disabled={isMutating}>Cancel</Button>
                        <Button onClick={handleApprove} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm" disabled={isMutating}>
                            {isMutating ? 'Approving...' : (approveModal?.type === 'seller' ? `Approve as ${sellerBadge}` : 'Approve')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lightbox */}
            {lightboxMedia && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 md:p-10" onClick={() => setLightboxMedia(null)}>
                    <Button
                        variant="ghost"
                        onClick={() => setLightboxMedia(null)}
                        className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
                    >
                        <XCircle className="w-8 h-8" />
                    </Button>
                    <div className="w-full max-w-5xl md:h-[80vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        {lightboxMedia.isPdf ? (
                            <iframe src={lightboxMedia.url} className="w-full h-full bg-white rounded-xl shadow-2xl" />
                        ) : (
                            <div className="relative w-full h-full">
                                <Image src={lightboxMedia.url} alt="Document View" fill className="object-contain" unoptimized />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
