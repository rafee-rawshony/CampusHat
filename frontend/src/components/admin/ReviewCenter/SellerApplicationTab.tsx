'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Inbox, XCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { ReviewItemCard } from './ReviewItemCard'
import { RejectDialog } from './RejectDialog'
import { ApproveConfirmDialog } from './ApproveConfirmDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { timeAgo } from '@/lib/timeAgo'
import { Input } from '@/components/ui/input'

// Utility to generate consistent gradient class based on store name
function getGradientFromStoreName(name: string = '') {
    const gradients = [
        'from-[#4C3B8A] to-[#7C3AED]',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-amber-500',
        'from-pink-500 to-rose-500'
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return `bg-gradient-to-r ${gradients[hash % gradients.length]}`
}

export function SellerApplicationTab() {
    const queryClient = useQueryClient()
    
    // Modal States
    const [rejectItem, setRejectItem] = useState<any | null>(null)
    const [approveItem, setApproveItem] = useState<any | null>(null)
    const [badgeLabel, setBadgeLabel] = useState('')

    // Data Fetch
    const { data: sellers = [], isLoading } = useQuery({
        queryKey: ['admin-sellers-pending'],
        queryFn: () => api.get('/admin/sellers/pending/').then(r => r.data?.data || r.data?.results || r.data),
        staleTime: 0,
        refetchOnWindowFocus: true
    })

    // Mutations
    const reviewMutation = useMutation({
        mutationFn: ({ id, action, reason, notes, badge_label }: any) => {
            const payload: any = { action }
            if (reason) payload.reason = reason
            if (notes) payload.notes = notes
            if (badge_label) payload.badge_label = badge_label
            return api.post(`/admin/sellers/${id}/review/`, payload)
        },
        onSuccess: (_, variables) => {
            if (variables.action === 'approve') {
                toast.success('Seller approved successfully!')
            } else {
                toast.success('Application rejected. Applicant notified.')
            }
            queryClient.invalidateQueries({ queryKey: ['admin-sellers-pending'] })
            queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] })
            
            setRejectItem(null)
            setApproveItem(null)
            setBadgeLabel('')
        },
        onError: () => {
            toast.error('Action failed. Please try again.')
        }
    })

    const handleReject = async (reason: string, notes: string) => {
        if (!rejectItem) return
        await reviewMutation.mutateAsync({ id: rejectItem.id, action: 'reject', reason, notes })
    }

    const handleApprove = async () => {
        if (!approveItem) return
        await reviewMutation.mutateAsync({ id: approveItem.id, action: 'approve', badge_label: badgeLabel })
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-xl" />
                ))}
            </div>
        )
    }

    if (sellers.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center">
                <Inbox className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="font-semibold text-gray-700 text-lg">Empty Inbox</h3>
                <p className="text-sm text-gray-400">No pending seller applications.</p>
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {sellers.map((item: any) => {
                    const storeParams = item.store || {}
                    const userParams = item.user || {}
                    
                    return (
                        <ReviewItemCard key={item.id}>
                            {/* STORE BANNER / LOGO AREA */}
                            <div className={`h-32 relative ${storeParams.banner ? '' : getGradientFromStoreName(storeParams.name)}`}>
                                {storeParams.banner && (
                                    <Image src={storeParams.banner} alt="Banner" fill className="object-cover" unoptimized />
                                )}
                                
                                <div className="absolute -bottom-5 left-4">
                                    <div className="w-12 h-12 rounded-full border-4 border-white overflow-hidden bg-white shrink-0">
                                        {storeParams.logo ? (
                                            <div className="w-full h-full relative">
                                                <Image src={storeParams.logo} alt="Logo" fill className="object-cover" unoptimized />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-[#4C3B8A] text-white flex items-center justify-center font-bold text-lg">
                                                {getInitials(storeParams.name || 'S')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* CARD BODY */}
                            <div className="pt-8 px-4 pb-4 flex flex-col flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-gray-900 text-base leading-tight break-words line-clamp-2">
                                        {storeParams.name || 'Unnamed Store'}
                                    </h3>
                                    <span className="text-[10px] uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold shrink-0">
                                        {item.business_type || 'INDIVIDUAL'}
                                    </span>
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                    <Avatar className="w-6 h-6 rounded-full shrink-0">
                                        <AvatarImage src={userParams.profile_picture} />
                                        <AvatarFallback className="bg-gray-200 text-gray-600 text-[10px]">{getInitials(userParams.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-gray-600 truncate">{userParams.full_name}</span>
                                    <span className="text-gray-300">·</span>
                                    <span className="text-xs text-gray-400 truncate">{userParams.email}</span>
                                </div>

                                {storeParams.description && (
                                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                        {storeParams.description}
                                    </p>
                                )}

                                {/* Documents */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {item.nid_front && (
                                        <a href={item.nid_front} target="_blank" rel="noreferrer" className="bg-gray-100/80 hover:bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded font-medium transition-colors">
                                            NID Front ↗
                                        </a>
                                    )}
                                    {item.nid_back && (
                                        <a href={item.nid_back} target="_blank" rel="noreferrer" className="bg-gray-100/80 hover:bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded font-medium transition-colors">
                                            NID Back ↗
                                        </a>
                                    )}
                                    {item.trade_license && (
                                        <a href={item.trade_license} target="_blank" rel="noreferrer" className="bg-gray-100/80 hover:bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded font-medium transition-colors">
                                            Trade License ↗
                                        </a>
                                    )}
                                </div>

                                <div className="mt-auto pt-4">
                                    <p className="text-xs text-gray-400 mb-3">Applied {item.created_at ? timeAgo(item.created_at) : 'recently'}</p>
                                    
                                    {/* ACTION BUTTONS */}
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            className="flex-1 border-red-300 text-red-500 hover:bg-red-50 font-semibold h-10 rounded-lg gap-1.5"
                                            onClick={() => setRejectItem(item)}
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </Button>
                                        <Button 
                                            className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold h-10 rounded-lg gap-1.5 shadow-sm"
                                            onClick={() => { setBadgeLabel(''); setApproveItem(item) }}
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </ReviewItemCard>
                    )
                })}
            </div>

            {/* Dialogs */}
            {rejectItem && (
                <RejectDialog
                    isOpen={!!rejectItem}
                    onClose={() => setRejectItem(null)}
                    title="Reject Seller Application"
                    subjectName={`${rejectItem.user?.full_name} — ${rejectItem.store?.name}`}
                    reasons={[
                        "Incomplete information",
                        "Invalid business documents",
                        "Does not meet requirements",
                        "Duplicate application",
                        "Suspicious activity",
                        "Other"
                    ]}
                    onConfirm={handleReject}
                    isLoading={reviewMutation.isPending}
                />
            )}

            {approveItem && (
                <ApproveConfirmDialog
                    isOpen={!!approveItem}
                    onClose={() => setApproveItem(null)}
                    title="Approve Seller Application?"
                    body={`This will create the '${approveItem.store?.name}' store and grant ${approveItem.user?.full_name} seller access.`}
                    onConfirm={handleApprove}
                    isLoading={reviewMutation.isPending}
                    extraContent={
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700">Store Badge (optional)</label>
                            <Input 
                                placeholder="e.g. Official Store, Student Seller" 
                                value={badgeLabel} 
                                onChange={(e) => setBadgeLabel(e.target.value)}
                                className="bg-gray-50 border-gray-200"
                            />
                            <p className="text-[10px] text-gray-400">This badge appears on the seller&apos;s store page.</p>
                        </div>
                    }
                />
            )}
        </>
    )
}
