import React from 'react'
import {
    MoreVertical, CheckCircle, Ban
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export function getRolePillData(role: string) {
    const map: Record<string, { bg: string, label: string }> = {
        admin: { bg: 'bg-red-100 text-red-700', label: 'Admin' },
        moderator: { bg: 'bg-orange-100 text-orange-700', label: 'Moderator' },
        seller_mod: { bg: 'bg-amber-100 text-amber-700', label: 'Seller Mod' },
        marketplace_mod: { bg: 'bg-yellow-100 text-yellow-700', label: 'Market Mod' },
        seller: { bg: 'bg-blue-100 text-blue-700', label: 'Seller' },
        student: { bg: 'bg-green-100 text-green-700', label: 'Student' },
        faculty: { bg: 'bg-teal-100 text-teal-700', label: 'Faculty' },
        normal_user: { bg: 'bg-gray-100 text-gray-600', label: 'Normal User' }
    }
    return map[role] || map['normal_user']
}

export function getStatusPillJSX(user: any) {
    if (user.is_active === false) {
        return <span className="bg-red-100 text-red-600 px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1"><Ban className="w-3 h-3" /> Suspended</span>
    }
    if (user.is_email_verified === false) {
        return <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 text-xs font-semibold rounded-full">Unverified</span>
    }
    if (user.verification_status === 'pending') {
        return <span className="bg-blue-100 text-blue-600 px-2 py-0.5 text-xs font-semibold rounded-full">Pending Review</span>
    }
    if (['student', 'faculty'].includes(user.role)) {
        return <span className="bg-green-100 text-green-600 px-2 py-0.5 text-xs font-semibold rounded-full">Verified</span>
    }
    return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-semibold rounded-full">Active</span>
}

export function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface UserCardProps {
    user: any
    onViewProfile: (u: any) => void
    onChangeRole: (u: any) => void
    onSuspend: (u: any) => void
    onActivate: (u: any) => void
}

export function UserCard({ user, onViewProfile, onChangeRole, onSuspend, onActivate }: UserCardProps) {
    const roleData = getRolePillData(user.role)

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3 shadow-sm md:hidden">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 w-full pr-2">
                    <Avatar className="w-10 h-10 rounded-full border border-gray-100 shrink-0">
                        <AvatarImage src={user.profile_picture} />
                        <AvatarFallback className="bg-brand-primary text-white text-xs">{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{user.full_name}</h3>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-gray-400 hover:text-gray-600 shrink-0">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => onViewProfile(user)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeRole(user)}>Change Role</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.is_active ? (
                            <DropdownMenuItem onClick={() => onSuspend(user)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                Suspend User
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => onActivate(user)} className="text-green-600 focus:text-green-700 focus:bg-green-50">
                                Activate User
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${roleData.bg}`}>
                    {roleData.label}
                </span>
                {getStatusPillJSX(user)}
                {user.university && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider border border-gray-200">
                        {user.university.short_code || 'UNI'}
                    </span>
                )}
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between border-t border-gray-50">
                <span className="text-xs text-gray-400 font-medium tracking-wide">
                    Joined {formatDate(user.date_joined)}
                </span>
                <button 
                    onClick={() => onViewProfile(user)}
                    className="text-[#4C3B8A] text-xs font-semibold hover:underline"
                >
                    View Profile &rarr;
                </button>
            </div>
        </div>
    )
}
