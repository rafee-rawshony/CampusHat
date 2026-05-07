import React from 'react'
import Link from 'next/link'
import { ArrowRight, LucideIcon } from 'lucide-react'

interface AdminStatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    iconBg: string
    iconColor: string
    subtitle?: string
    insightHref?: string
    loading?: boolean
}

export function AdminStatCard({
    title,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    subtitle,
    insightHref,
    loading
}: AdminStatCardProps) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition flex items-start justify-between">
            <div className="flex flex-col">
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1 overflow-hidden" />
                ) : (
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                )}
                
                {loading ? (
                    <div className="h-3 w-16 bg-gray-200 animate-pulse rounded mt-2 overflow-hidden" />
                ) : subtitle ? (
                    <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                ) : null}

                {insightHref && !loading && (
                    <Link href={insightHref} className="text-[#4C3B8A] text-xs font-semibold hover:underline mt-3 flex items-center gap-1 group w-fit">
                        INSIGHT <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>
            
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
        </div>
    )
}
