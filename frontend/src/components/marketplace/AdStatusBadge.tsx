import React from 'react'
import { Clock, CheckCircle, XCircle, BadgeCheck, EyeOff } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export type AdStatus = 'pending' | 'active' | 'expired' | 'sold' | 'rejected' | 'hidden'

interface AdStatusBadgeProps {
    status: AdStatus
    rejectionReason?: string
    showReasonInline?: boolean
}

export function AdStatusBadge({ status, rejectionReason, showReasonInline }: AdStatusBadgeProps) {
    const renderBadge = () => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Under Review
                    </span>
                )
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 border border-green-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Active
                    </span>
                )
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Expired
                    </span>
                )
            case 'sold':
                return (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3" /> Sold
                    </span>
                )
            case 'hidden':
                return (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 border border-gray-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3" /> Hidden
                    </span>
                )
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-200 text-xs font-semibold px-2 py-0.5 rounded-full hover:bg-red-200 transition-colors">
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                )
            default:
                return null
        }
    }

    if (status === 'rejected' && rejectionReason && !showReasonInline) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className="cursor-help">
                        {renderBadge()}
                    </TooltipTrigger>
                    <TooltipContent className="bg-red-50 text-red-900 border-red-200 shadow-md">
                        <p className="font-semibold text-xs text-left max-w-xs leading-tight">Reason: {rejectionReason}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <div className="flex flex-col gap-1 items-start">
            {renderBadge()}
            {status === 'rejected' && showReasonInline && rejectionReason && (
                <p className="text-[10px] sm:text-xs text-red-500 font-medium leading-snug">
                    Reson: {rejectionReason}
                </p>
            )}
        </div>
    )
}
