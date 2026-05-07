'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Grid3x3, XCircle, CheckCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { ReviewItemCard } from './ReviewItemCard'
import { RejectDialog } from './RejectDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { timeAgo } from '@/lib/timeAgo'

function normalizePostType(type?: string) {
    if (type === 'sell') return 'buy'
    if (type === 'rent') return 'rental'
    return type || 'buy'
}

function getImageUrl(image: any) {
    if (!image) return ''
    if (typeof image === 'string') return image
    return image.image_url || image.image || ''
}

function getPostTypeColor(type?: string) {
    const normalized = normalizePostType(type)
    if (normalized === 'buy') return 'bg-purple-500'
    if (normalized === 'rental') return 'bg-green-500'
    if (normalized === 'service') return 'bg-blue-500'
    if (normalized === 'food') return 'bg-amber-500'
    return 'bg-gray-500'
}

export function MarketplaceAdReviewTab() {
    const queryClient = useQueryClient()
    
    const [rejectItem, setRejectItem] = useState<any | null>(null)
    const [approvingIds, setApprovingIds] = useState<string[]>([])
    const [showReported, setShowReported] = useState(false)

    // Data Fetch (Pending)
    const { data: pendingAds = [], isLoading: pLoading } = useQuery({
        queryKey: ['admin-marketplace-pending'],
        queryFn: () => api.get('/admin/marketplace/pending/').then(r => r.data?.data || r.data?.results || r.data),
        staleTime: 30_000,
        refetchOnWindowFocus: true
    })

    // Data Fetch (Reported)
    const { data: reportedAds = [], isLoading: rLoading } = useQuery({
        queryKey: ['admin-marketplace-reported'],
        queryFn: () => api.get('/admin/marketplace/reported/').then(r => r.data?.data || r.data?.results || r.data),
        enabled: showReported,
        staleTime: 30_000
    })

    // Mutations
    const reviewMutation = useMutation({
        mutationFn: async ({ id, action, reason, notes }: any) => {
            const payload: any = { action }
            if (reason) payload.reason = reason
            if (notes) payload.notes = notes
            // Fallback for API mapping depending on route strategy
            // Using POST to review as described
            return api.post(`/admin/marketplace/${id}/review/`, payload).catch(e => {
                if(e.response?.status === 404 || e.response?.status === 405) {
                    return api.patch(`/admin/marketplace/${id}/review/`, payload) // Fallback PATCH
                }
                throw e;
            })
        },
        onSuccess: (_, variables) => {
            if (variables.action === 'approve') {
                toast.success('Ad approved! Now live on marketplace.')
            } else {
                toast.success('Ad rejected. Seller has been notified.')
            }
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-pending'] })
            queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] })
            setRejectItem(null)
            setApprovingIds(prev => prev.filter(id => id !== variables.id))
        },
        onError: (_, variables) => {
            toast.error('Action failed. Try again.')
            setApprovingIds(prev => prev.filter(id => id !== variables.id))
        }
    })

    const handleReject = async (reason: string, notes: string) => {
        if (!rejectItem) return
        await reviewMutation.mutateAsync({ id: rejectItem.id, action: 'reject', reason, notes })
    }

    const handleApprove = async (id: string) => {
        setApprovingIds(prev => [...prev, id])
        await reviewMutation.mutateAsync({ id, action: 'approve' })
    }

    const { mutateAsync: reportAction } = useMutation({
        mutationFn: ({ reportId, action }: any) => {
            return api.post(`/admin/marketplace/reports/${reportId}/resolve/`, { action })
        },
        onSuccess: () => {
            toast.success('Report resolved.')
            queryClient.invalidateQueries({ queryKey: ['admin-marketplace-reported'] })
        }
    })

    if (pLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-xl" />
                ))}
            </div>
        )
    }

    const renderAdCard = (ad: any, isReported = false) => {
        const typeColor = getPostTypeColor(ad.post_type)
        const postType = normalizePostType(ad.post_type)
        const imgSrc = getImageUrl(ad.images?.[0])
        const isApproving = approvingIds.includes(ad.id)
        const sellerName = ad.user?.full_name || ad.user?.name || 'Unknown Seller'
        const universityShort = ad.university?.short_code || ad.university?.short_name || ad.university_short || 'UNI'

        return (
            <ReviewItemCard key={ad.id}>
                {isReported && (
                    <div className="bg-yellow-500 text-black px-4 py-2 flex flex-col justify-center">
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <AlertTriangle className="w-4 h-4" /> 
                            Reported {ad.report_count || 1} time(s)
                        </div>
                        <span className="text-[10px] mt-0.5 truncate font-medium">Reason: {ad.most_common_reason || 'Inappropriate Content'}</span>
                    </div>
                )}
                
                {/* PREVIEW AREA */}
                <div className="aspect-[16/9] bg-gray-100 relative shadow-inner">
                    {imgSrc ? (
                        <Image src={imgSrc} alt="Ad Image" fill className="object-cover" unoptimized />
                    ) : (
                        <div className={`absolute inset-0 ${typeColor} flex items-center justify-center p-4 text-center`}>
                            <h3 className="text-white font-bold text-lg drop-shadow-md line-clamp-2">{ad.title}</h3>
                        </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded text-white font-bold ${typeColor}`}>
                            {postType === 'buy' ? 'SELL ITEM' : postType.toUpperCase()}
                        </span>
                    </div>
                    
                    {postType === 'buy' && ad.condition && (
                        <div className="absolute top-2 right-2">
                            <span className="bg-white/90 backdrop-blur text-gray-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm border border-gray-100">
                                {ad.condition?.replace(/_/g, ' ')}
                            </span>
                        </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2">
                        <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            {universityShort}
                        </span>
                    </div>
                </div>

                {/* CARD BODY */}
                <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{ad.title}</h3>
                    
                    <div className="mt-1 flex items-baseline gap-1">
                        <span className="font-bold text-gray-900">৳{Number(ad.price).toLocaleString()}</span>
                        {postType === 'rental' && <span className="text-sm text-gray-500">/ month</span>}
                        {postType === 'service' && <span className="text-sm text-gray-500">/ hour</span>}
                    </div>
                    
                    <p className="text-xs uppercase text-gray-400 mt-1 font-semibold truncate">
                        {ad.category?.name || 'General'} · {ad.university?.name || 'Campus'}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                        {ad.is_anonymous ? (
                            <>
                                <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
                                <span className="text-sm text-gray-500 italic font-medium">Anonymous Seller</span>
                            </>
                        ) : (
                            <>
                                <Avatar className="w-6 h-6 rounded-full shrink-0">
                                    <AvatarImage src={ad.user?.profile_picture} />
                                    <AvatarFallback className="bg-gray-200 text-gray-600 text-[10px]">{getInitials(sellerName)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-600 truncate">{sellerName}</span>
                                {ad.user?.role && (
                                    <span className="bg-gray-100 text-gray-500 text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold">
                                        {ad.user.role.replace('normal_user', 'student')}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mt-3 flex-1">{ad.description}</p>
                    
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">Submitted {timeAgo(ad.created_at)}</span>
                        <a href={`/marketplace/listings/${ad.id}`} target="_blank" rel="noreferrer" className="text-[#4C3B8A] text-xs font-semibold hover:underline">
                            View Full Listing ↗
                        </a>
                    </div>
                    
                    {/* ACTIONS */}
                    {!isReported ? (
                        <div className="mt-4 flex gap-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 border-red-300 text-red-500 hover:bg-red-50 font-semibold h-10 rounded-lg gap-1.5"
                                onClick={() => setRejectItem(ad)}
                                disabled={isApproving}
                            >
                                <XCircle className="w-4 h-4" /> Reject
                            </Button>
                            <Button 
                                className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold h-10 rounded-lg gap-1.5 shadow-sm"
                                onClick={() => handleApprove(ad.id)}
                                disabled={isApproving}
                            >
                                {isApproving ? <span className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent" /> : <CheckCircle className="w-4 h-4" />}
                                {isApproving ? 'Approving...' : 'Approve'}
                            </Button>
                        </div>
                    ) : (
                        <div className="mt-4 flex gap-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold h-10 rounded-lg text-xs"
                                onClick={() => reportAction({ reportId: ad.report_id || ad.id, action: 'dismiss' })}
                            >
                                Dismiss Report
                            </Button>
                            <Button 
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold h-10 rounded-lg text-xs shadow-sm"
                                onClick={() => reportAction({ reportId: ad.report_id || ad.id, action: 'remove_ad' })}
                            >
                                Remove Ad
                            </Button>
                        </div>
                    )}
                </div>
            </ReviewItemCard>
        )
    }

    return (
        <div className="space-y-10">
            {/* PENDING SECTION */}
            <div>
                {pendingAds.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center bg-white border border-gray-100 rounded-2xl">
                        <Grid3x3 className="w-16 h-16 text-gray-200 mb-4" />
                        <h3 className="font-semibold text-gray-700 text-lg">No New Listings</h3>
                        <p className="text-sm text-gray-400">All pending marketplace ads have been reviewed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {pendingAds.map((ad: any) => renderAdCard(ad, false))}
                    </div>
                )}
            </div>

            {/* REPORTED SECTION */}
            <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
                <button 
                    className="w-full p-4 flex flex-row items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setShowReported(!showReported)}
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="font-semibold text-gray-800">
                            Reported Ads {showReported && reportedAds.length > 0 ? `(${reportedAds.length})` : ''}
                        </h3>
                    </div>
                    {showReported ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                {showReported && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                        {rLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[1, 2].map(i => <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-xl" />)}
                            </div>
                        ) : reportedAds.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">No reported ads currently.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {reportedAds.map((ad: any) => renderAdCard(ad, true))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Dialogs */}
            {rejectItem && (
                <RejectDialog
                    isOpen={!!rejectItem}
                    onClose={() => setRejectItem(null)}
                    title="Reject Marketplace Ad"
                    subjectName={rejectItem.title}
                    reasons={[
                        "Inappropriate content",
                        "Spam or misleading information",
                        "Wrong category",
                        "Price not in BDT",
                        "Prohibited item",
                        "Low quality listing",
                        "Other"
                    ]}
                    onConfirm={handleReject}
                    isLoading={reviewMutation.isPending}
                />
            )}
        </div>
    )
}
