'use client'

import React, { useState, useEffect } from 'react'
import {
    CheckCircle2, XCircle, MessageSquare, Building2, FileText, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'

type SellerTab = 'pending' | 'approved' | 'rejected' | 'suspended'

const BADGE_OPTIONS = ['Verified Seller', 'Student Seller', 'Official Store']

export default function AdminSellersPage() {
    const [sellers, setSellers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [tab, setTab] = useState<SellerTab>('pending')
    const [approveModal, setApproveModal] = useState<any>(null)
    const [rejectModal, setRejectModal] = useState<any>(null)
    const [selectedBadge, setSelectedBadge] = useState(BADGE_OPTIONS[0])
    const [rejectReason, setRejectReason] = useState('')

    useEffect(() => {
        // API: GET /api/v1/admin/sellers/
        setTimeout(() => {
            setSellers([
                {
                    id: 's1', businessName: 'TechHub Store', businessType: 'Individual',
                    applicant: 'Rahim Uddin', university: 'BUET',
                    submittedDate: '2024-06-20', status: 'pending',
                    documents: [{ name: 'Student ID', url: 'https://example.com/doc1.pdf' }],
                    email: 'techhub@gmail.com'
                },
                {
                    id: 's2', businessName: 'Campus Books BD', businessType: 'Student',
                    applicant: 'Sadia Rahman', university: 'DU',
                    submittedDate: '2024-06-18', status: 'pending',
                    documents: [{ name: 'NID', url: 'https://example.com/doc2.pdf' }, { name: 'Student ID', url: 'https://example.com/doc3.pdf' }],
                    email: 'sadia@du.ac.bd'
                },
                {
                    id: 's3', businessName: 'Karim Electronics', businessType: 'Business',
                    applicant: 'Karim Hasan', university: 'NSU',
                    submittedDate: '2024-06-10', status: 'approved',
                    documents: [], email: 'karim@gmail.com', badge: 'Verified Seller'
                },
                {
                    id: 's4', businessName: 'Spam Store', businessType: 'Individual',
                    applicant: 'Unknown User', university: 'DIU',
                    submittedDate: '2024-06-05', status: 'rejected',
                    documents: [], email: 'spam@fake.com', rejectReason: 'Incomplete documents'
                },
            ])
            setIsLoading(false)
        }, 600)
    }, [])

    const tabs: { id: SellerTab; label: string }[] = [
        { id: 'pending', label: 'Pending' },
        { id: 'approved', label: 'Approved' },
        { id: 'rejected', label: 'Rejected' },
        { id: 'suspended', label: 'Suspended' },
    ]

    const filtered = sellers.filter(s => s.status === tab)

    const handleApprove = () => {
        if (!approveModal) return
        setSellers(prev => prev.map(s => s.id === approveModal.id ? { ...s, status: 'approved', badge: selectedBadge } : s))
        toast.success(`${approveModal.businessName} approved as "${selectedBadge}"`)
        setApproveModal(null)
    }

    const handleReject = () => {
        if (!rejectModal || !rejectReason.trim()) { toast.error('Please provide a reason'); return }
        setSellers(prev => prev.map(s => s.id === rejectModal.id ? { ...s, status: 'rejected', rejectReason } : s))
        toast.success(`${rejectModal.businessName} application rejected`)
        setRejectModal(null)
        setRejectReason('')
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Seller Approvals</h1>
                <p className="text-gray-500 text-sm mt-1">Review seller applications, approve, reject, or request more info.</p>
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
                        {t.id === 'pending' && sellers.filter(s => s.status === 'pending').length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                {sellers.filter(s => s.status === 'pending').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Seller Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                    <p className="text-gray-500 font-medium">No {tab} applications found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {filtered.map(seller => (
                        <div key={seller.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-purple-700 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                                    {seller.businessName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-black text-gray-900 leading-none">{seller.businessName}</h3>
                                            <p className="text-xs text-gray-500 font-medium mt-1">{seller.applicant} · {seller.university}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{seller.email}</p>
                                        </div>
                                        <div>
                                            <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-600 border-gray-200 uppercase tracking-wider">
                                                {seller.businessType}
                                            </Badge>
                                            {seller.badge && (
                                                <Badge variant="outline" className="ml-1 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                                    {seller.badge}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium mt-2">
                                        Submitted: {seller.submittedDate}
                                    </p>
                                </div>
                            </div>

                            {/* Documents */}
                            {seller.documents?.length > 0 && (
                                <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-2">
                                    {seller.documents.map((doc: any, i: number) => (
                                        <a
                                            key={i}
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-brand-primary/5 border border-brand-primary/20 px-3 py-1.5 rounded-lg hover:bg-brand-primary/10 transition-colors"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            {doc.name}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* Reject reason display */}
                            {seller.rejectReason && (
                                <div className="px-5 py-3 border-b border-gray-100 bg-red-50/50">
                                    <p className="text-xs font-bold text-red-600">Rejection Reason: <span className="font-medium text-red-500">{seller.rejectReason}</span></p>
                                </div>
                            )}

                            {/* Actions */}
                            {tab === 'pending' && (
                                <div className="p-4 flex gap-3 flex-wrap">
                                    <Button
                                        onClick={() => { setSelectedBadge(BADGE_OPTIONS[0]); setApproveModal(seller) }}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Approve
                                    </Button>
                                    <Button
                                        onClick={() => { setRejectReason(''); setRejectModal(seller) }}
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-gray-200 text-gray-600 font-bold rounded-xl flex items-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" /> Request Info
                                    </Button>
                                </div>
                            )}
                            {tab === 'approved' && (
                                <div className="p-4 flex gap-3 flex-wrap">
                                    <Button variant="outline" className="border-gray-200 text-gray-600 font-bold rounded-xl flex items-center gap-2">
                                        <Building2 className="w-4 h-4" /> View Store
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, status: 'suspended' } : s)); toast.success('Store suspended') }}
                                        className="border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl"
                                    >
                                        Suspend Store
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Approve Modal */}
            <Dialog open={!!approveModal} onOpenChange={() => setApproveModal(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogTitle className="font-black text-gray-900">Approve Seller Application</DialogTitle>
                    <p className="text-sm text-gray-500">Select a badge type for <span className="font-bold text-gray-800">{approveModal?.businessName}</span>:</p>
                    <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                        <SelectTrigger className="bg-gray-50 border-gray-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {BADGE_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        This will grant seller access and display the <strong>{selectedBadge}</strong> badge on their store.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setApproveModal(null)} className="border-gray-200">Cancel</Button>
                        <Button onClick={handleApprove} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">Approve</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogTitle className="font-black text-gray-900">Reject Application</DialogTitle>
                    <p className="text-sm text-gray-500">Provide a reason for rejecting <span className="font-bold text-gray-800">{rejectModal?.businessName}</span>:</p>
                    <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="e.g. Incomplete or invalid documentation provided."
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
