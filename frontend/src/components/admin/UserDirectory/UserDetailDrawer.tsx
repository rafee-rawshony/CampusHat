import React, { useState } from 'react'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetOverlay
} from '@/components/ui/sheet'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Shield, Ban, CheckCircle, Grid3x3, ShoppingBag, ClipboardCopy } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { timeAgo } from '@/lib/timeAgo'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

import { RoleChangeDialog } from './RoleChangeDialog'
import { SuspendUserDialog } from './SuspendUserDialog'

interface UserDetailDrawerProps {
    userId: string | null
    isOpen: boolean
    onClose: () => void
}

function shortDate(dateStr: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getRolePill(role: string) {
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
    const data = map[role] || map['normal_user']
    return <span className={`px-3 py-1 text-xs font-semibold rounded-full ${data.bg}`}>{data.label}</span>
}

function getStatusPill(user: any) {
    if (user.is_active === false) {
        return <span className="bg-red-100 text-red-600 px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1"><Ban className="w-3 h-3" /> Suspended</span>
    }
    if (user.is_email_verified === false) {
        return <span className="bg-yellow-100 text-yellow-600 px-3 py-1 text-xs font-semibold rounded-full">Unverified</span>
    }
    if (user.verification_status === 'pending') {
        return <span className="bg-blue-100 text-blue-600 px-3 py-1 text-xs font-semibold rounded-full">Pending Review</span>
    }
    if (['student', 'faculty'].includes(user.role)) {
        return <span className="bg-green-100 text-green-600 px-3 py-1 text-xs font-semibold rounded-full">Verified</span>
    }
    return <span className="bg-gray-100 text-gray-600 px-3 py-1 text-xs font-semibold rounded-full">Active</span>
}

function getSellerStatusPill(status: string) {
    const map: Record<string, string> = {
        pending: 'bg-blue-100 text-blue-600',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-600',
        none: 'bg-gray-100 text-gray-500'
    }
    const color = map[status?.toLowerCase()] || map['none']
    return <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${color}`}>{status || 'None'}</span>
}

export function UserDetailDrawer({ userId, isOpen, onClose }: UserDetailDrawerProps) {
    const queryClient = useQueryClient()
    const [roleDialogOpen, setRoleDialogOpen] = useState(false)
    const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)

    // Ensure we trigger closes gracefully
    const handleMainClose = () => {
        onClose()
    }

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['admin-user', userId],
        queryFn: () => api.get(`/admin/users/${userId}/`).then(r => r.data?.data || r.data),
        enabled: !!userId && isOpen,
    })

    const { data: activity, isLoading: activityLoading } = useQuery({
        queryKey: ['admin-user-activity', userId],
        queryFn: () => api.get(`/admin/users/${userId}/activity/`).then(r => r.data?.data || r.data?.results || r.data),
        enabled: !!userId && isOpen,
    })

    const { mutate: activateUser, isPending: activating } = useMutation({
        mutationFn: () => api.post(`/admin/users/${userId}/activate/`),
        onSuccess: () => {
            toast.success("User activated successfully.")
            queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
        onError: () => toast.error('Failed to activate user.')
    })

    const handleActivate = () => {
        if (window.confirm("Activate this user?")) {
            activateUser()
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard!", { icon: '📋', duration: 1500 })
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleMainClose()}>
            {isOpen && <SheetOverlay className="bg-transparent z-[60]" />}
            <SheetContent side="right" className="p-0 border-l-0 w-full sm:w-[480px] z-[70] sm:max-w-[480px] flex flex-col bg-white">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
                    <SheetTitle className="font-semibold text-gray-900 text-lg">User Profile</SheetTitle>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-10">
                    {userLoading ? (
                        <div className="p-5 space-y-6">
                            <div className="flex flex-col items-center">
                                <Skeleton className="w-[72px] h-[72px] rounded-full mb-3" />
                                <Skeleton className="h-6 w-40 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ) : user ? (
                        <>
                            {/* Profile Section */}
                            <div className="p-5 border-b border-gray-100 flex flex-col items-center text-center">
                                <Avatar className="w-[72px] h-[72px] shadow-sm border border-gray-200">
                                    <AvatarImage src={user.profile_picture} />
                                    <AvatarFallback className="bg-brand-primary text-white text-xl">
                                        {getInitials(user.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="font-bold text-xl text-gray-900 mt-3 leading-tight">{user.full_name}</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                                {user.phone && <p className="text-sm text-gray-500 mt-0.5">{user.phone}</p>}

                                <div className="mt-4 flex gap-2 justify-center items-center">
                                    {getRolePill(user.role)}
                                    {getStatusPill(user)}
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
                                    <div className="flex flex-col items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="font-bold text-lg text-gray-900">{user.reputation_score || 0}</span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">Reputation</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="font-bold text-sm text-gray-900 leading-relaxed truncate px-1 max-w-full">
                                            {shortDate(user.date_joined)}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">Joined</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="font-bold text-sm text-gray-900 leading-relaxed truncate px-1 max-w-full">
                                            {user.last_login ? timeAgo(user.last_login) : 'Never'}
                                        </span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">Last Login</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-5 border-b border-gray-100 space-y-3">
                                <h3 className="font-semibold text-gray-800 text-sm mb-4 tracking-tight">Account Details</h3>
                                
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-500">University</span>
                                    <span className="text-gray-900 font-medium text-right max-w-[60%] truncate">
                                        {user.university?.name || 'Not set'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-500">Email Verified</span>
                                    {user.is_email_verified ? (
                                        <span className="text-green-600 font-medium">✓ Yes</span>
                                    ) : (
                                        <span className="text-red-500 font-medium">✗ No</span>
                                    )}
                                </div>
                                
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-500">Verification</span>
                                    <span>
                                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full
                                            ${user.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                                              user.verification_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                              user.verification_status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                              'bg-gray-100 text-gray-600'}`
                                        }>
                                            {user.verification_status || 'unverified'}
                                        </span>
                                    </span>
                                </div>

                                {user.seller_application_status && (
                                    <div className="flex justify-between items-center text-sm py-1">
                                        <span className="text-gray-500">Seller Status</span>
                                        {getSellerStatusPill(user.seller_application_status)}
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm py-1 mt-2">
                                    <span className="text-gray-500">User ID</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{user.id}</span>
                                        <button 
                                            onClick={() => copyToClipboard(user.id)}
                                            className="text-gray-400 hover:text-[#4C3B8A] p-1 rounded transition-colors"
                                        >
                                            <ClipboardCopy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions Sections */}
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-800 text-sm mb-4 tracking-tight">Quick Actions</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setRoleDialogOpen(true)}
                                        className="border border-gray-200 rounded-lg p-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
                                    >
                                        <Shield className="w-4 h-4 text-gray-500" /> Change Role
                                    </button>
                                    
                                    {user.is_active ? (
                                        <button 
                                            onClick={() => setSuspendDialogOpen(true)}
                                            className="border border-red-200 rounded-lg p-3 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 transition bg-white"
                                        >
                                            <Ban className="w-4 h-4" /> Suspend User
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleActivate}
                                            disabled={activating}
                                            className="border border-green-200 rounded-lg p-3 text-sm font-semibold text-green-600 hover:bg-green-50 flex items-center justify-center gap-2 transition bg-white"
                                        >
                                            <CheckCircle className="w-4 h-4" /> 
                                            {activating ? 'Activating...' : 'Activate User'}
                                        </button>
                                    )}

                                    <Link 
                                        href={`/admin/marketplace?user=${user.id}`} target="_blank"
                                        className="border border-gray-200 rounded-lg p-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
                                    >
                                        <Grid3x3 className="w-4 h-4 text-gray-500" /> View Listings
                                    </Link>
                                    
                                    <Link 
                                        href={`/admin/orders?user=${user.id}`} target="_blank"
                                        className="border border-gray-200 rounded-lg p-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
                                    >
                                        <ShoppingBag className="w-4 h-4 text-gray-500" /> View Orders
                                    </Link>
                                </div>
                            </div>

                            {/* Activity Section */}
                            <div className="p-5">
                                <h3 className="font-semibold text-gray-800 text-sm mb-4 tracking-tight">Recent Activity</h3>
                                
                                {activityLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-3">
                                                <Skeleton className="w-3 h-3 rounded-full mt-1.5 shrink-0" />
                                                <div className="space-y-2 flex-1">
                                                    <Skeleton className="h-4 w-3/4" />
                                                    <Skeleton className="h-3 w-1/4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : activity && activity.length > 0 ? (
                                    <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[5px] before:w-[2px] before:bg-gray-100 before:z-0">
                                        {activity.map((act: any, idx: number) => {
                                            const type = act.resource_type || act.action || 'system'
                                            const dotColors: Record<string, string> = {
                                                login: 'bg-blue-500',
                                                post_ad: 'bg-green-500',
                                                purchase: 'bg-purple-500',
                                                verification: 'bg-amber-500'
                                            }
                                            const dtColor = dotColors[type] || 'bg-gray-400'
                                            
                                            return (
                                                <div key={idx} className="flex items-start gap-4 relative z-10 w-full overflow-hidden">
                                                    <div className={`w-3 h-3 rounded-full shrink-0 shadow-sm mt-1.5 ${dtColor} border-2 border-white`} />
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className="text-sm font-medium text-gray-700 leading-snug break-words">
                                                            {act.action_description || act.action || 'Performed action'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                                            {timeAgo(act.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
                                        <p className="text-sm text-gray-500 font-medium">No recent activity found.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-10 text-center text-gray-500">Failed to load user.</div>
                    )}
                </div>

                {/* Sub Dialogs - using portals/controlled state to not close parent Sheet when nested dialog opens */}
                {user && (
                    <>
                        <RoleChangeDialog 
                            isOpen={roleDialogOpen} 
                            onClose={() => setRoleDialogOpen(false)} 
                            user={user} 
                        />
                        <SuspendUserDialog 
                            isOpen={suspendDialogOpen} 
                            onClose={() => setSuspendDialogOpen(false)} 
                            user={user} 
                        />
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
