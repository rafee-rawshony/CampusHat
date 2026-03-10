'use client'

import React, { useState, useEffect } from 'react'
import {
    CheckCircle2, XCircle, AlertTriangle, User, Building2,
    ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

type MarketplaceTab = 'pending' | 'active' | 'reported' | 'rejected'

const REJECT_REASONS = [
    'Inappropriate content',
    'Spam',
    'Duplicate listing',
    'Pricing violation',
    'Misleading description',
    'Other',
]

export default function AdminMarketplacePage() {
    const [ads, setAds] = useState<any[]>([])
    const [reports, setReports] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [tab, setTab] = useState<MarketplaceTab>('pending')
    const [rejectModal, setRejectModal] = useState<any>(null)
    const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0])
    const [rejectCustom, setRejectCustom] = useState('')
    const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({})

    useEffect(() => {
        setTimeout(() => {
            setAds([
                {
                    id: 'ad1', title: 'iPhone 14 Pro Max 256GB', type: 'item_for_sale', price: 120000,
                    status: 'pending', university: 'BUET',
                    poster: 'Rahim Uddin', postedDate: '2024-06-25',
                    description: 'Brand new, sealed box. Brought from Dubai. No scratches.',
                    images: ['https://placehold.co/400x300/purple/white?text=iPhone', 'https://placehold.co/400x300/blue/white?text=Box'],
                },
                {
                    id: 'ad2', title: 'Looking for Chemistry Tutor', type: 'service', price: 2000,
                    status: 'pending', university: 'DU',
                    poster: 'Sadia Rahman', postedDate: '2024-06-24',
                    description: 'Need a HSC Chemistry tutor for 3 days a week.',
                    images: [],
                },
                {
                    id: 'ad3', title: 'Campus Backpack (Used)', type: 'item_for_sale', price: 500,
                    status: 'active', university: 'NSU',
                    poster: 'Karim Hasan', postedDate: '2024-06-20',
                    description: 'Slightly used JanSport backpack.',
                    images: ['https://placehold.co/400x300/orange/white?text=Backpack'],
                },
                {
                    id: 'ad4', title: 'Free Money Scam', type: 'item_for_sale', price: 0,
                    status: 'reported', university: 'DIU',
                    poster: 'Spam User', postedDate: '2024-06-22',
                    description: 'Suspicious ad for get-rich-quick scheme.',
                    images: [],
                },
            ])
            setReports([
                { id: 'r1', reporter: 'Alice (student)', ad: 'Free Money Scam', reason: 'Spam', reportDate: '2024-06-23' },
                { id: 'r2', reporter: 'Bob (seller)', ad: 'Campus Backpack', reason: 'Duplicate listing', reportDate: '2024-06-21' },
            ])
            setIsLoading(false)
        }, 600)
    }, [])

    const tabs: { id: MarketplaceTab; label: string }[] = [
        { id: 'pending', label: 'Pending Approval' },
        { id: 'active', label: 'Active' },
        { id: 'reported', label: 'Reported' },
        { id: 'rejected', label: 'Rejected' },
    ]

    const filteredAds = ads.filter(a => a.status === tab)

    const handleApprove = (adId: string) => {
        setAds(prev => prev.map(a => a.id === adId ? { ...a, status: 'active' } : a))
        toast.success('Ad approved and now live')
    }

    const handleReject = () => {
        if (!rejectModal) return
        const reason = rejectReason === 'Other' ? rejectCustom : rejectReason
        setAds(prev => prev.map(a => a.id === rejectModal.id ? { ...a, status: 'rejected', rejectReason: reason } : a))
        toast.success('Ad rejected')
        setRejectModal(null)
    }

    const cycleImage = (adId: string, dir: 1 | -1, maxLen: number) => {
        setCarouselIndex(prev => {
            const cur = prev[adId] || 0
            const next = (cur + dir + maxLen) % maxLen
            return { ...prev, [adId]: next }
        })
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Marketplace Moderation</h1>
                <p className="text-gray-500 text-sm mt-1">Review, approve, or reject marketplace listings.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2
                            ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {t.label}
                        {t.id === 'pending' && ads.filter(a => a.status === 'pending').length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                {ads.filter(a => a.status === 'pending').length}
                            </span>
                        )}
                        {t.id === 'reported' && reports.length > 0 && (
                            <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                {reports.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Reports Tab */}
            {tab === 'reported' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" /> Active Reports
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {reports.map(r => (
                            <div key={r.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{r.ad}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-1">
                                        Reported by <span className="font-bold text-gray-700">{r.reporter}</span> · {r.reportDate}
                                    </p>
                                    <Badge variant="outline" className="mt-2 text-[10px] bg-orange-50 text-orange-700 border-orange-200">{r.reason}</Badge>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button variant="outline" onClick={() => toast.success('Report dismissed')} className="text-xs font-bold border-gray-200 text-gray-600">
                                        Dismiss
                                    </Button>
                                    <Button onClick={() => toast.success('Ad removed')} className="text-xs font-bold bg-red-500 hover:bg-red-600 text-white">
                                        Remove Ad
                                    </Button>
                                    <Button variant="outline" onClick={() => toast.success('Escalated to admin')} className="text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50">
                                        <User className="w-3.5 h-3.5 mr-1" /> Suspend User
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-96 bg-gray-200 rounded-2xl"></div>)}
                </div>
            ) : filteredAds.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                    <p className="text-gray-500 font-medium">No {tab} ads found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {filteredAds.map(ad => {
                        const imgIndex = carouselIndex[ad.id] || 0
                        return (
                            <div key={ad.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                {/* Image Carousel */}
                                {ad.images?.length > 0 ? (
                                    <div className="relative h-48 bg-gray-100">
                                        <Image
                                            src={ad.images[imgIndex]}
                                            alt={ad.title}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        {ad.images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => cycleImage(ad.id, -1, ad.images.length)}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => cycleImage(ad.id, 1, ad.images.length)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60"
                                                >
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                </button>
                                                <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
                                                    {ad.images.map((_: string, i: number) => (
                                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <p className="text-xs font-bold text-gray-300">No Images</p>
                                    </div>
                                )}

                                {/* Ad Info */}
                                <div className="p-5 flex-1 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-black text-gray-900 text-base">{ad.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-600 border-gray-200 uppercase tracking-wider">{ad.type.replace(/_/g, ' ')}</Badge>
                                                <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{ad.university}</span>
                                            </div>
                                        </div>
                                        <p className="text-lg font-black text-gray-900 shrink-0">৳{ad.price.toLocaleString()}</p>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <User className="w-3.5 h-3.5" />
                                        <span className="font-bold text-gray-700">{ad.poster}</span>
                                        <span>·</span>
                                        <span>{ad.postedDate}</span>
                                    </div>

                                    <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{ad.description}</p>
                                </div>

                                {/* Actions */}
                                {tab === 'pending' && (
                                    <div className="px-5 pb-5 flex gap-3">
                                        <Button onClick={() => handleApprove(ad.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl gap-2">
                                            <CheckCircle2 className="w-4 h-4" /> Approve
                                        </Button>
                                        <Button
                                            onClick={() => { setRejectReason(REJECT_REASONS[0]); setRejectCustom(''); setRejectModal(ad) }}
                                            variant="outline"
                                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl gap-2"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </Button>
                                    </div>
                                )}
                                {tab === 'active' && (
                                    <div className="px-5 pb-5">
                                        <Button
                                            onClick={() => { setRejectReason(REJECT_REASONS[0]); setRejectCustom(''); setRejectModal(ad) }}
                                            variant="outline"
                                            className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl gap-2"
                                        >
                                            <XCircle className="w-4 h-4" /> Remove Ad
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Reject Modal */}
            <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogTitle className="font-black text-gray-900">Reject / Remove Ad</DialogTitle>
                    <p className="text-sm text-gray-500">Select a reason for rejecting <span className="font-bold text-gray-800">&ldquo;{rejectModal?.title}&rdquo;</span>:</p>
                    <Select value={rejectReason} onValueChange={setRejectReason}>
                        <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {REJECT_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {rejectReason === 'Other' && (
                        <textarea
                            value={rejectCustom}
                            onChange={e => setRejectCustom(e.target.value)}
                            placeholder="Describe the issue..."
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                    )}
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setRejectModal(null)} className="border-gray-200">Cancel</Button>
                        <Button onClick={handleReject} className="bg-red-500 hover:bg-red-600 text-white font-bold">Confirm</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
