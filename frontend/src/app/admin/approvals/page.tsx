'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { FileText, Check, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

import { format } from 'date-fns'

type TabType = 'students' | 'ads' | 'sellers'

export default function ApprovalsPage() {
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState<TabType>('students')

    // MOCK DATA STATES (would normally come from API)
    const [students, setStudents] = useState<any[]>([])
    const [ads, setAds] = useState<any[]>([])
    const [sellers, setSellers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Dialog States
    const [rejectReject, setRejectReject] = useState<{ isOpen: boolean, id: string | null, type: TabType | null }>({ isOpen: false, id: null, type: null })
    const [rejectReason, setRejectReason] = useState('')
    const [rejectNotes, setRejectNotes] = useState('')

    const [approveModal, setApproveModal] = useState<{ isOpen: boolean, id: string | null, type: TabType | null, name: string }>({ isOpen: false, id: null, type: null, name: '' })

    useEffect(() => {
        // Mocking API fetch
        setIsLoading(true)
        setTimeout(() => {
            setStudents([
                { id: '1', name: 'Rahim Uddin', uni_code: 'NSU', date: '2024-06-22', image: null, is_pdf: false },
                { id: '2', name: 'Sadia Rahman', uni_code: 'BRACU', date: '2024-06-25', image: 'https://placehold.co/400x250/orange/white?text=ID+Card', is_pdf: false },
            ])
            setAds([
                { id: '101', title: 'Calculus 8th Edition', type: 'Buy', seller: 'Karim', date: '2024-06-26T10:00:00Z', image: 'https://placehold.co/400x250/purple/white?text=Book' }
            ])
            setSellers([
                { id: '201', store_name: 'Tech Gadgets BD', applicant: 'Fahim', uni_code: 'AIUB', date: '2024-06-20' }
            ])
            setIsLoading(false)
        }, 800)
    }, [])

    const handleRejectSubmit = async () => {
        if (!rejectReason) {
            toast({ title: 'Error', description: 'Please select a reason for rejection.', variant: 'destructive' })
            return
        }

        // Mock API call
        // await api.post(`/admin/${rejectReject.type}/${rejectReject.id}/review/`, { action: 'reject', reason: rejectReason, notes: rejectNotes })

        toast({ title: 'Request Rejected', description: `Notification sent to the user.` })

        // Remove locally
        if (rejectReject.type === 'students') setStudents(s => s.filter(x => x.id !== rejectReject.id))
        else if (rejectReject.type === 'ads') setAds(a => a.filter(x => x.id !== rejectReject.id))
        else if (rejectReject.type === 'sellers') setSellers(s => s.filter(x => x.id !== rejectReject.id))

        setRejectReject({ isOpen: false, id: null, type: null })
        setRejectReason('')
        setRejectNotes('')
    }

    const handleApproveSubmit = async () => {
        // Mock API Call
        toast({ title: 'Approved successfully', description: `${approveModal.name} is now active.` })

        if (approveModal.type === 'students') setStudents(s => s.filter(x => x.id !== approveModal.id))
        else if (approveModal.type === 'ads') setAds(a => a.filter(x => x.id !== approveModal.id))
        else if (approveModal.type === 'sellers') setSellers(s => s.filter(x => x.id !== approveModal.id))

        setApproveModal({ isOpen: false, id: null, type: null, name: '' })
    }

    const openReject = (id: string, type: TabType) => setRejectReject({ isOpen: true, id, type })
    const openApprove = (id: string, type: TabType, name: string) => setApproveModal({ isOpen: true, id, type, name })

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-full">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Review Center</h1>
                <p className="text-gray-500 mt-1">Action pending requests across the platform</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-8 border-b border-gray-200 mb-8">
                {[
                    { id: 'students', label: 'Student Verification', count: students.length },
                    { id: 'ads', label: 'Marketplace Ads', count: ads.length },
                    { id: 'sellers', label: 'Seller Applications', count: sellers.length },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`pb-4 text-sm font-bold relative transition-colors ${activeTab === tab.id ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-black">
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl" />)}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && ((activeTab === 'students' && students.length === 0) || (activeTab === 'ads' && ads.length === 0) || (activeTab === 'sellers' && sellers.length === 0)) && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                    <p className="text-sm text-gray-500">There are no pending requests in this queue.</p>
                </div>
            )}

            {/* Tab Contents */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* STUDENTS */}
                    {activeTab === 'students' && students.map((s) => (
                        <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            {/* ID Preview Area */}
                            <div className="aspect-video bg-gray-100 relative group flex items-center justify-center overflow-hidden border-b border-gray-100">
                                {s.is_pdf ? (
                                    <div className="text-center">
                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <span className="text-xs font-bold text-gray-500">PDF DOCUMENT</span>
                                    </div>
                                ) : s.image ? (
                                    <Image src={s.image} alt="ID Card" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                ) : (
                                    <span className="text-sm font-bold text-gray-400 underline cursor-pointer hover:text-gray-600">Click to view ID Card</span>
                                )}
                            </div>

                            {/* Details */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-gray-900">{s.name}</h3>
                                        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">REQUESTED: {s.date}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">{s.uni_code} University</p>
                                </div>

                                <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                                    <Button variant="outline" onClick={() => openReject(s.id, 'students')} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">Reject</Button>
                                    <Button onClick={() => openApprove(s.id, 'students', s.name)} className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* MARKETPLACE ADS */}
                    {activeTab === 'ads' && ads.map((ad) => (
                        <div key={ad.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="aspect-video bg-gray-100 relative group flex items-center justify-center overflow-hidden border-b border-gray-100">
                                {ad.image ? <Image src={ad.image} alt="Ad" fill className="object-cover" unoptimized /> : <div className="text-gray-400 text-sm font-bold">No Image</div>}
                                <div className="absolute top-3 left-3">
                                    <Badge className="bg-purple-600 text-white border-0 shadow-sm">{ad.type}</Badge>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-lg font-black text-gray-900 line-clamp-1">{ad.title}</h3>
                                    <p className="text-sm text-gray-500">Posted by <span className="font-bold text-gray-700">{ad.seller}</span></p>
                                    <p className="text-xs text-gray-400 mt-1">Submitted on {format(new Date(ad.date), 'MMM dd, yyyy')}</p>
                                </div>
                                <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                                    <Button variant="outline" onClick={() => openReject(ad.id, 'ads')} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">Reject</Button>
                                    <Button onClick={() => openApprove(ad.id, 'ads', ad.title)} className="bg-green-600 hover:bg-green-700 text-white">Approve Listing</Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* SELLERS */}
                    {activeTab === 'sellers' && sellers.map((sel) => (
                        <div key={sel.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">{sel.store_name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">Applicant: <span className="font-bold text-gray-800">{sel.applicant}</span> ({sel.uni_code})</p>
                                </div>
                                <Store className="w-8 h-8 text-teal-600 opacity-20" />
                            </div>
                            <p className="text-xs text-gray-400 mb-6">Submitted on {sel.date}</p>

                            <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                                <Button variant="outline" onClick={() => openReject(sel.id, 'sellers')} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">Reject</Button>
                                <Button onClick={() => openApprove(sel.id, 'sellers', sel.store_name)} className="bg-green-600 hover:bg-green-700 text-white">Approve Seller</Button>
                            </div>
                        </div>
                    ))}

                </div>
            )}

            {/* === DIALOGS === */}

            {/* Reject Dialog */}
            <Dialog open={rejectReject.isOpen} onOpenChange={(o) => !o && setRejectReject({ isOpen: false, id: null, type: null })}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-gray-900">Reject Request</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="font-bold">Reason for Rejection</Label>
                            <Select value={rejectReason} onValueChange={setRejectReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ID not clear">ID not clear</SelectItem>
                                    <SelectItem value="Wrong document">Wrong document type</SelectItem>
                                    <SelectItem value="Expired ID">Expired identification</SelectItem>
                                    <SelectItem value="Name mismatch">Name does not match profile</SelectItem>
                                    <SelectItem value="Policy Violation">Platform policy violation</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Additional Notes (Optional)</Label>
                            <Textarea
                                placeholder="Explain specifically what needs to be fixed..."
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                className="h-24 resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRejectReject({ isOpen: false, id: null, type: null })}>Cancel</Button>
                        <Button onClick={handleRejectSubmit} className="bg-red-600 hover:bg-red-700 text-white">Send Rejection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Confirmation Dialog */}
            <Dialog open={approveModal.isOpen} onOpenChange={(o) => !o && setApproveModal({ isOpen: false, id: null, type: null, name: '' })}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-gray-900 border-b pb-4 mb-2 border-gray-100 flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" /> Confirm Approval
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">
                        Are you sure you want to approve <span className="font-bold text-gray-900">{approveModal.name}</span>?
                        {approveModal.type === 'students' && ' This user will gain full access to the marketplace and student privileges.'}
                        {approveModal.type === 'ads' && ' This listing will immediately go live on the public marketplace feed.'}
                        {approveModal.type === 'sellers' && ' This user will instantly be converted into a recognized Seller.'}
                    </p>
                    <DialogFooter className="mt-6">
                        <Button variant="ghost" onClick={() => setApproveModal({ isOpen: false, id: null, type: null, name: '' })}>Cancel</Button>
                        <Button onClick={handleApproveSubmit} className="bg-green-600 hover:bg-green-700 text-white">Confirm Approval</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
