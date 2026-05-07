'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Download, Users as UsersIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { UserFilters } from '@/components/admin/UserDirectory/UserFilters'
import { UserTable } from '@/components/admin/UserDirectory/UserTable'
import { UserCard } from '@/components/admin/UserDirectory/UserCard'
import { UserDetailDrawer } from '@/components/admin/UserDirectory/UserDetailDrawer'
import { RoleChangeDialog } from '@/components/admin/UserDirectory/RoleChangeDialog'
import { SuspendUserDialog } from '@/components/admin/UserDirectory/SuspendUserDialog'

export default function AdminUsersPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!isAdmin()) {
            router.replace('/admin/approvals')
        }
    }, [isAdmin, router])

    const [filters, setFilters] = useState({
        search: '',
        role: 'all',
        university: 'all',
        status: 'all'
    })
    const [page, setPage] = useState(1)

    // Reset page to 1 when filters change
    useEffect(() => {
        setPage(1)
    }, [filters])

    const queryParams = useMemo(() => {
        const params: Record<string, any> = { page, page_size: 20, ordering: '-date_joined' }
        if (filters.search) params.search = filters.search
        if (filters.role !== 'all') params.role = filters.role
        if (filters.university !== 'all') params.university = filters.university
        
        if (filters.status === 'active') params.is_active = true
        if (filters.status === 'suspended') params.is_active = false
        if (filters.status === 'unverified') params.is_email_verified = false
        
        return params
    }, [filters, page])

    const { data: response, isLoading, isFetching } = useQuery({
        queryKey: ['admin-users', queryParams],
        queryFn: () => api.get('/admin/users/', { params: queryParams }).then(r => r.data),
        staleTime: 30_000,
        enabled: isAdmin()
    })

    const users = response?.data?.results || response?.results || []
    const pagination = response?.data?.pagination || response?.pagination || { count: 0, total_pages: 1 }
    const totalUsers = pagination.count || 0
    const totalPages = pagination.total_pages || 1

    const startIndex = totalUsers === 0 ? 0 : (page - 1) * 20 + 1
    const endIndex = Math.min(page * 20, totalUsers)

    // Modal States
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
    const [roleDialogOpen, setRoleDialogOpen] = useState(false)
    const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)

    // Actions
    const handleViewProfile = (u: any) => {
        setSelectedUser(u)
        setDetailDrawerOpen(true)
    }

    const handleChangeRole = (u: any) => {
        setSelectedUser(u)
        setRoleDialogOpen(true)
    }

    const handleSuspend = (u: any) => {
        setSelectedUser(u)
        setSuspendDialogOpen(true)
    }

    const { mutate: activateUser } = useMutation({
        mutationFn: (id: string) => api.post(`/admin/users/${id}/activate/`),
        onSuccess: () => {
            toast.success("User activated successfully.")
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
        onError: () => {
            toast.error("Failed to activate user.")
        }
    })

    const handleActivate = (u: any) => {
        if (window.confirm(`Activate ${u.full_name}'s account?`)) {
            activateUser(u.id)
        }
    }

    const handleExport = () => {
        toast('Export functionality will be initialized shortly.', { icon: '📊' })
        // Could be something like window.open(`${api.defaults.baseURL}/admin/users/export/?format=csv&...`)
    }

    if (!isAdmin()) return null

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="font-bold text-2xl text-gray-900 tracking-tight">User Directory</h1>
                        {totalUsers > 0 && (
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                                {totalUsers} total users
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Manage all registered users across the platform.</p>
                </div>
                
                <button 
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm w-full sm:w-auto"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Filters */}
            <UserFilters 
                filters={filters} 
                setFilters={setFilters} 
                totalUsers={totalUsers} 
                startIndex={startIndex} 
                endIndex={endIndex} 
            />

            {/* Content Area */}
            {isLoading ? (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mt-4">
                    <div className="divide-y divide-gray-50">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="px-4 py-4 flex items-center justify-between animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-gray-200 rounded-full" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-gray-200 rounded" />
                                        <div className="h-3 w-40 bg-gray-200 rounded" />
                                    </div>
                                </div>
                                <div className="h-6 w-20 bg-gray-200 rounded-full hidden md:block" />
                                <div className="h-6 w-16 bg-gray-200 rounded-full hidden md:block" />
                                <div className="h-4 w-24 bg-gray-200 rounded hidden md:block" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl py-20 flex flex-col items-center justify-center text-center mt-4 shadow-sm">
                    <UsersIcon className="w-16 h-16 text-gray-200 mb-4" />
                    <h3 className="font-semibold text-gray-700 text-lg">No users found</h3>
                    <p className="text-sm text-gray-400 mt-1 max-w-sm">
                        {filters.search || filters.role !== 'all' || filters.status !== 'all' || filters.university !== 'all'
                            ? "Try adjusting your filters or search term to find what you're looking for."
                            : "There are currently no users registered on the platform."}
                    </p>
                    {(filters.search || filters.role !== 'all' || filters.status !== 'all' || filters.university !== 'all') && (
                        <button 
                            onClick={() => setFilters({ search: '', role: 'all', university: 'all', status: 'all' })}
                            className="text-[#4C3B8A] font-medium text-sm mt-4 hover:underline"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            ) : (
                <div className={`mt-4 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
                    {/* Desktop Table View */}
                    <UserTable 
                        users={users} 
                        onViewProfile={handleViewProfile}
                        onChangeRole={handleChangeRole}
                        onSuspend={handleSuspend}
                        onActivate={handleActivate}
                    />

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {users.map((user: any) => (
                            <UserCard 
                                key={user.id} 
                                user={user}
                                onViewProfile={handleViewProfile}
                                onChangeRole={handleChangeRole}
                                onSuspend={handleSuspend}
                                onActivate={handleActivate}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination Layer - only show if there are enough users to warrant paging */}
            {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <button 
                        onClick={() => {
                            setPage(p => Math.max(1, p - 1))
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        disabled={page === 1}
                        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition bg-white shadow-sm font-bold"
                    >
                        &larr;
                    </button>
                    
                    <span className="w-9 h-9 rounded-lg bg-[#4C3B8A] text-white flex items-center justify-center font-bold shadow-sm">
                        {page}
                    </span>
                    
                    <button 
                        onClick={() => {
                            setPage(p => Math.min(totalPages, p + 1))
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        disabled={page === totalPages}
                        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition bg-white shadow-sm font-bold"
                    >
                        &rarr;
                    </button>
                </div>
            )}
            {!isLoading && totalPages > 1 && (
                <p className="text-center text-sm text-gray-400 mt-3 font-medium">Page {page} of {totalPages}</p>
            )}

            {/* Global Overlays */}
            <UserDetailDrawer 
                userId={selectedUser?.id || null} 
                isOpen={detailDrawerOpen} 
                onClose={() => setDetailDrawerOpen(false)} 
            />

            <RoleChangeDialog
                user={selectedUser}
                isOpen={roleDialogOpen}
                onClose={() => setRoleDialogOpen(false)}
            />

            <SuspendUserDialog
                user={selectedUser}
                isOpen={suspendDialogOpen}
                onClose={() => setSuspendDialogOpen(false)}
            />
        </div>
    )
}
