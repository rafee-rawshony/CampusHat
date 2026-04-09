'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'


import {
    Search, Filter, MoreHorizontal, X,
    ChevronRight, ShieldAlert, Mail
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { getInitials } from '@/lib/utils'

const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    seller: 'bg-blue-100 text-blue-700 border-blue-200',
    student: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    normal_user: 'bg-gray-100 text-gray-600 border-gray-200',
    moderator: 'bg-orange-100 text-orange-700 border-orange-200',
}

export default function AdminUsersPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!isAdmin()) {
            router.replace('/admin/approvals')
        }
    }, [isAdmin, router])

    const [users, setUsers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false)
    const [suspendReason, setSuspendReason] = useState('')

    useEffect(() => {
        // API: GET /api/v1/admin/users/
        setTimeout(() => {
            setUsers([
                { id: 'u1', name: 'Rahim Uddin', email: 'rahim@du.ac.bd', university: 'University of Dhaka', role: 'student', status: 'active', joined: '2024-01-15', avatar: null },
                { id: 'u2', name: 'TechHub Store', email: 'techhub@gmail.com', university: 'BUET', role: 'seller', status: 'active', joined: '2024-02-20', avatar: null },
                { id: 'u3', name: 'Sadia Rahman', email: 'sadia@diu.edu.bd', university: 'DIU', role: 'normal_user', status: 'active', joined: '2024-03-10', avatar: null },
                { id: 'u4', name: 'Karim Hasan', email: 'karim@nsu.edu.bd', university: 'NSU', role: 'student', status: 'suspended', joined: '2024-01-05', avatar: null },
                { id: 'u5', name: 'Mod Sarah', email: 'sarah@campushat.com', university: '—', role: 'moderator', status: 'active', joined: '2023-12-01', avatar: null },
            ])
            setIsLoading(false)
        }, 600)
    }, [])

    const filteredUsers = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchRole = roleFilter === 'all' || u.role === roleFilter
        const matchStatus = statusFilter === 'all' || u.status === statusFilter
        return matchSearch && matchRole && matchStatus
    })

    const openDrawer = (user: any) => {
        setSelectedUser(user)
        setIsDrawerOpen(true)
    }

    const handleRoleChange = (userId: string, newRole: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
        setSelectedUser((prev: any) => prev ? { ...prev, role: newRole } : null)
        toast.success(`Role updated to ${newRole}`)
    }

    const handleSuspend = () => {
        if (!suspendReason.trim()) { toast.error('Please provide a reason'); return }
        const isCurrentlySuspended = selectedUser?.status === 'suspended'
        const newStatus = isCurrentlySuspended ? 'active' : 'suspended'
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: newStatus } : u))
        setSelectedUser((prev: any) => prev ? { ...prev, status: newStatus } : null)
        toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'reactivated'} successfully`)
        setIsSuspendModalOpen(false)
        setSuspendReason('')
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">User Directory</h1>
                <p className="text-gray-500 text-sm mt-1">Manage platform users, roles, and account status.</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-gray-50 border-gray-200" />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                        <Filter className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="normal_user">Normal User</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                                <th className="py-3.5 px-5">User</th>
                                <th className="py-3.5 px-5">University</th>
                                <th className="py-3.5 px-5">Role</th>
                                <th className="py-3.5 px-5">Status</th>
                                <th className="py-3.5 px-5">Joined</th>
                                <th className="py-3.5 px-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => openDrawer(u)}>
                                    <td className="py-3.5 px-5">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-9 h-9 border border-gray-200">
                                                {u.avatar ? <AvatarImage src={u.avatar} /> : <AvatarFallback className="text-xs font-bold bg-gray-100">{getInitials(u.name)}</AvatarFallback>}
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{u.name}</p>
                                                <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-5 text-sm text-gray-600">{u.university}</td>
                                    <td className="py-3.5 px-5">
                                        <Badge variant="outline" className={`text-[10px] px-2 py-0 capitalize ${roleColors[u.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                            {u.role.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="py-3.5 px-5">
                                        <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            {u.status}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-5 text-sm text-gray-500">{u.joined}</td>
                                    <td className="py-3.5 px-5 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); openDrawer(u) }}>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="py-16 text-center">
                            <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No users match your filters.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Detail Drawer */}
            {isDrawerOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/40" onClick={() => setIsDrawerOpen(false)} />
                    <div className="w-[420px] bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-lg font-black text-gray-900">User Details</h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-16 h-16 border-2 border-gray-200">
                                    <AvatarFallback className="text-xl font-black bg-gradient-to-br from-brand-primary to-purple-600 text-white">
                                        {getInitials(selectedUser.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-lg font-black text-gray-900">{selectedUser.name}</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selectedUser.email}</p>
                                    <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${selectedUser.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                        {selectedUser.status}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                {[
                                    ['University', selectedUser.university],
                                    ['Joined', selectedUser.joined],
                                    ['User ID', selectedUser.id],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-400 font-medium">{label}</span>
                                        <span className="text-gray-900 font-bold">{value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Change Role</label>
                                <Select value={selectedUser.role} onValueChange={(v) => handleRoleChange(selectedUser.id, v)}>
                                    <SelectTrigger className="bg-gray-50 border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal_user">Normal User</SelectItem>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="seller">Seller</SelectItem>
                                        <SelectItem value="moderator">Moderator</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2 border-gray-200 text-gray-700"
                                    onClick={() => window.open(`/admin/users/${selectedUser.id}/orders`)}
                                >
                                    View Orders
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2 border-gray-200 text-gray-700"
                                    onClick={() => window.open(`/admin/users/${selectedUser.id}/ads`)}
                                >
                                    View Ads
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100">
                            <Button
                                onClick={() => { setSuspendReason(''); setIsSuspendModalOpen(true) }}
                                className={`w-full font-bold ${selectedUser.status === 'active' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                            >
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                {selectedUser.status === 'active' ? 'Suspend User' : 'Reactivate User'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend Modal */}
            <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogTitle className="text-lg font-black text-gray-900">
                        {selectedUser?.status === 'active' ? 'Suspend User' : 'Reactivate User'}
                    </DialogTitle>
                    <p className="text-sm text-gray-500">
                        {selectedUser?.status === 'active'
                            ? `Suspending ${selectedUser?.name} will prevent them from accessing the platform.`
                            : `Reactivating ${selectedUser?.name} will restore their access.`}
                    </p>
                    <textarea
                        value={suspendReason}
                        onChange={e => setSuspendReason(e.target.value)}
                        placeholder="Provide a reason for this action..."
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-50 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsSuspendModalOpen(false)} className="border-gray-200">Cancel</Button>
                        <Button
                            onClick={handleSuspend}
                            className={selectedUser?.status === 'active' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
                        >
                            Confirm
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
