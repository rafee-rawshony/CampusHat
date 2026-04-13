'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { FileText, XCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { ReviewItemCard } from './ReviewItemCard'
import { RejectDialog } from './RejectDialog'
import { ApproveConfirmDialog } from './ApproveConfirmDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { timeAgo } from '@/lib/timeAgo'

export function VerificationReviewTab() {
    const queryClient = useQueryClient()
    
    // Lightbox State
    const [lightboxMedia, setLightboxMedia] = useState<{ url: string; isPdf?: boolean } | null>(null)
    
    // Modal States
    const [rejectItem, setRejectItem] = useState<any | null>(null)
    const [approveItem, setApproveItem] = useState<any | null>(null)

    // Data Fetch
    const { data: verifications = [], isLoading } = useQuery({
        queryKey: ['admin-verifications-pending'],
        queryFn: () => api.get('/admin/verifications/pending/').then(r => r.data?.data || r.data?.results || r.data),
        staleTime: 0,
        refetchOnWindowFocus: true
    })

    // Mutations
    const reviewMutation = useMutation({
        mutationFn: ({ id, action, reason, notes }: { id: string, action: string, reason?: string, notes?: string }) => {
            const payload: any = { action }
            if (reason) payload.reason = reason
            if (notes) payload.notes = notes
            return api.post(`/admin/verifications/${id}/review/`, payload)
        },
        onSuccess: (_, variables) => {
            if (variables.action === 'approve') {
                toast.success('Verified successfully!')
            } else {
                toast.success('Verification rejected. Student notified.')
            }
            queryClient.invalidateQueries({ queryKey: ['admin-verifications-pending'] })
            queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] })
            
            setRejectItem(null)
            setApproveItem(null)
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
        await reviewMutation.mutateAsync({ id: approveItem.id, action: 'approve' })
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

    if (verifications.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                <h3 className="font-semibold text-gray-700 text-lg">All clear!</h3>
                <p className="text-sm text-gray-400">No pending verification requests.</p>
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {verifications.map((item: any) => {
                    const isPdf = item.id_document_type === 'pdf'
                    const docUrl = item.id_document
                    const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString('en-BD') : 'N/A'

                    return (
                        <ReviewItemCard key={item.id}>
                            {/* DOCUMENT PREVIEW AREA */}
                            <div className="aspect-video bg-gray-100 relative group cursor-pointer" onClick={() => docUrl && setLightboxMedia({ url: docUrl, isPdf })}>
                                {isPdf ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <FileText className="w-16 h-16 text-gray-400 mb-2" />
                                        <span className="text-sm font-bold text-gray-500">PDF Document</span>
                                        <a href={docUrl} target="_blank" rel="noreferrer" className="text-[#4C3B8A] text-sm font-medium mt-2 z-10 hover:underline inline-flex" onClick={e => e.stopPropagation()}>
                                            Open PDF ↗
                                        </a>
                                    </div>
                                ) : docUrl ? (
                                    <div className="relative w-full h-full">
                                        <Image src={docUrl} alt="Student ID" fill className="object-contain" unoptimized />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No Document Provided</div>
                                )}
                                
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none">
                                    REQUESTED ON: {createdDate}
                                </div>
                            </div>

                            {/* CARD BODY */}
                            <div className="p-4 flex flex-col flex-1">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8 rounded-full border border-gray-100 shrink-0">
                                        <AvatarImage src={item.user?.profile_picture} />
                                        <AvatarFallback className="bg-brand-primary text-white text-xs">{getInitials(item.user?.full_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{item.user?.full_name}</h4>
                                    </div>
                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0">
                                        {item.user?.university_short_code || 'UNI'}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-1.5 flex-1">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold text-gray-500">Student ID:</span> {item.student_id_number}
                                    </p>
                                    {item.university_email && (
                                        <p className="text-sm text-gray-600 truncate">
                                            <span className="font-semibold text-gray-500">Uni Email:</span> {item.university_email}
                                        </p>
                                    )}
                                </div>

                                {/* ACTION BUTTONS */}
                                <div className="mt-4 flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 border-red-300 text-red-500 hover:bg-red-50 font-semibold h-10 rounded-lg gap-1.5"
                                        onClick={() => setRejectItem(item)}
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </Button>
                                    <Button 
                                        className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold h-10 rounded-lg gap-1.5 shadow-sm"
                                        onClick={() => setApproveItem(item)}
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </Button>
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
                    title="Reject Verification Request"
                    subjectName={rejectItem.user?.full_name}
                    reasons={[
                        "ID card not clearly visible",
                        "Wrong document type uploaded",
                        "Student ID expired or invalid",
                        "Name mismatch with ID",
                        "Duplicate submission",
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
                    title="Approve Verification?"
                    body={`This will verify ${approveItem.user?.full_name} as a student and grant marketplace access.`}
                    onConfirm={handleApprove}
                    isLoading={reviewMutation.isPending}
                />
            )}

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
                    <div className="w-full max-w-5xl h-[80vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
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
        </>
    )
}
