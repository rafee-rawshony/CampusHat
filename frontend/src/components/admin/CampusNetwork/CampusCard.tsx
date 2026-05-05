'use client'

import { Building2, Users } from 'lucide-react'

export interface CampusType {
    id: string
    slug: string
    system_id: string
    name: string
    short_name: string
    division: string
    district: string
    postal_code?: string
    full_address?: string
    email_domain?: string | null
    short_description?: string | null
    logo_url?: string | null
    is_active: boolean
    student_count: number
    created_at: string
}

interface CampusCardProps {
    campus: CampusType
    onEdit: (campus: CampusType) => void
}

export default function CampusCard({ campus, onEdit }: CampusCardProps) {
    const fallbackInitials = (campus.short_name || 'N/A').substring(0, 4)

    return (
        <div
            onClick={() => onEdit(campus)}
            className={`relative bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition cursor-pointer overflow-hidden
                ${!campus.is_active ? 'opacity-70' : ''}
            `}
        >
            {!campus.is_active && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none select-none">
                    <span className="text-gray-200 font-black text-4xl -rotate-12 tracking-widest uppercase opacity-50">
                        Inactive
                    </span>
                </div>
            )}

            <div className="relative z-20">
                <div className="flex items-start justify-between">
                    {/* Logo or initial badge */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                        {campus.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={campus.logo_url} alt={campus.short_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-[#4C3B8A] text-white flex items-center justify-center font-bold text-sm tracking-wide">
                                {fallbackInitials}
                            </div>
                        )}
                    </div>

                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${campus.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}
                    `}>
                        <div className={`w-2 h-2 rounded-full ${campus.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        {campus.is_active ? 'Active' : 'Inactive'}
                    </div>
                </div>

                <div className="mt-3">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-tight min-h-[40px]">
                        {campus.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                        {campus.short_name} · {campus.district}, {campus.division}
                    </p>
                    {campus.short_description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{campus.short_description}</p>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{campus.student_count || 0} students</span>
                    </div>
                    <span className="text-[#4C3B8A] text-sm font-medium hover:underline">Edit &rarr;</span>
                </div>
            </div>
        </div>
    )
}
