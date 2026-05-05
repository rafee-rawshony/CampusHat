'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Building2, Users, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

import CampusGrid from '@/components/admin/CampusNetwork/CampusGrid'
import AddUniversityDialog from '@/components/admin/CampusNetwork/AddUniversityDialog'
import EditUniversityDrawer from '@/components/admin/CampusNetwork/EditUniversityDrawer'
import { CampusType } from '@/components/admin/CampusNetwork/CampusCard'

type Tab = 'universities' | 'requests'

export default function AdminCampusesPage() {
    const { isAdmin, _hasHydrated } = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()

    useEffect(() => {
        if (_hasHydrated && !isAdmin()) router.replace('/admin/approvals')
    }, [_hasHydrated, isAdmin, router])

    const [activeTab, setActiveTab] = useState<Tab>('universities')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [cityFilter, setCityFilter] = useState('All Cities')
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editCampus, setEditCampus] = useState<CampusType | null>(null)

    // Approve modal state
    const [approvingId, setApprovingId] = useState<string | null>(null)
    const [approveData, setApproveData] = useState({ short_name: '', postal_code: '', email_domain: '' })
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [rejectNote, setRejectNote] = useState('')

    // Universities — backend wraps response in { success, data: [...] } envelope
    const { data, isLoading } = useQuery({
        queryKey: ['admin-universities'],
        queryFn: async () => {
            const res = await api.get('/universities/?include_inactive=true')
            return res.data?.data?.results || res.data?.data || res.data?.results || res.data || []
        },
        staleTime: 60_000,
    })

    // Institution Requests
    const { data: requestsData, isLoading: requestsLoading } = useQuery({
        queryKey: ['institution-requests'],
        queryFn: async () => {
            const res = await api.get('/universities/requests/')
            return res.data?.results || res.data?.data?.results || res.data || []
        },
        staleTime: 30_000,
    })

    const approveMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) =>
            api.post(`/universities/requests/${id}/approve/`, data),
        onSuccess: () => {
            toast.success('Request approved — university created!')
            queryClient.invalidateQueries({ queryKey: ['institution-requests'] })
            queryClient.invalidateQueries({ queryKey: ['admin-universities'] })
            setApprovingId(null)
            setApproveData({ short_name: '', postal_code: '', email_domain: '' })
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.short_name?.[0] || 'Failed to approve request.')
        },
    })

    const rejectMutation = useMutation({
        mutationFn: async ({ id, note }: { id: string; note: string }) =>
            api.post(`/universities/requests/${id}/reject/`, { review_note: note }),
        onSuccess: () => {
            toast.success('Request rejected.')
            queryClient.invalidateQueries({ queryKey: ['institution-requests'] })
            setRejectingId(null)
            setRejectNote('')
        },
        onError: () => toast.error('Failed to reject request.'),
    })

    const campuses: CampusType[] = Array.isArray(data) ? data : []
    const requests: any[] = Array.isArray(requestsData) ? requestsData : []
    const pendingCount = requests.filter(r => r.status === 'pending').length

    const activeCount = campuses.filter(c => c.is_active).length
    const inactiveCount = campuses.filter(c => !c.is_active).length
    const totalStudents = campuses.reduce((sum, c) => sum + (c.student_count || 0), 0)

    const filtered = campuses.filter(c => {
        const q = searchTerm.toLowerCase()
        const matchSearch = !q || c.name.toLowerCase().includes(q) || c.short_name.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'All' ? true : statusFilter === 'Active Only' ? c.is_active : !c.is_active
        const matchCity = cityFilter === 'All Cities' ? true : c.district === cityFilter || (cityFilter === 'Other' && !['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi'].includes(c.district || ''))
        return matchSearch && matchStatus && matchCity
    })

    if (!_hasHydrated) return null

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campus Network</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage universities and student add requests.</p>
                </div>
                {activeTab === 'universities' && (
                    <Button onClick={() => setIsAddOpen(true)} className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add University
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                    <Building2 className="text-green-500 w-4 h-4" />
                    <span className="font-medium">{activeCount}</span>
                    <span className="text-gray-500">Active</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                    <Building2 className="text-gray-400 w-4 h-4" />
                    <span className="font-medium">{inactiveCount}</span>
                    <span className="text-gray-500">Inactive</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                    <Users className="text-[#4C3B8A] w-4 h-4" />
                    <span className="font-medium">{totalStudents}</span>
                    <span className="text-gray-500">Students</span>
                </div>
                {pendingCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                        <Clock className="text-amber-500 w-4 h-4" />
                        <span className="font-semibold text-amber-700">{pendingCount}</span>
                        <span className="text-amber-600">Pending Requests</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('universities')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'universities' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Universities ({campuses.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Add Requests
                    {pendingCount > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {pendingCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ── UNIVERSITIES TAB ── */}
            {activeTab === 'universities' && (
                <>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 flex-wrap shadow-sm">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search universities..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border-gray-200 rounded-lg w-full"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All</SelectItem>
                                <SelectItem value="Active Only">Active Only</SelectItem>
                                <SelectItem value="Inactive Only">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={cityFilter} onValueChange={setCityFilter}>
                            <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
                                <SelectValue placeholder="City" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All Cities">All Cities</SelectItem>
                                <SelectItem value="Dhaka">Dhaka</SelectItem>
                                <SelectItem value="Chittagong">Chittagong</SelectItem>
                                <SelectItem value="Sylhet">Sylhet</SelectItem>
                                <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="text-sm text-gray-400 ml-auto">
                            Showing <strong className="text-gray-700">{filtered.length}</strong> of {campuses.length}
                        </div>
                    </div>

                    <CampusGrid campuses={filtered} isLoading={isLoading} searchTerm={searchTerm} onEdit={setEditCampus} onAdd={() => setIsAddOpen(true)} />
                </>
            )}

            {/* ── REQUESTS TAB ── */}
            {activeTab === 'requests' && (
                <div className="space-y-4">
                    {requestsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                                </div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 flex flex-col items-center text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-300 mb-4" />
                            <p className="font-semibold text-gray-700">No institution requests yet</p>
                            <p className="text-sm text-gray-400 mt-1">When students submit requests, they will appear here.</p>
                        </div>
                    ) : (
                        requests.map((req: any) => {
                            const isApproving = approvingId === req.id
                            const isRejecting = rejectingId === req.id

                            const statusBadge = {
                                pending: 'bg-amber-50 text-amber-700 border-amber-200',
                                approved: 'bg-green-50 text-green-700 border-green-200',
                                rejected: 'bg-red-50 text-red-600 border-red-200',
                            }[req.status as string] || 'bg-gray-50 text-gray-600'

                            return (
                                <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-gray-900 text-base">{req.name}</h3>
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                                                    {req.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {req.district && `${req.district}, `}{req.division}
                                                {req.website && <span> · <a href={req.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{req.website}</a></span>}
                                            </p>
                                            {req.note && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 italic">"{req.note}"</p>}
                                            {req.requester_email && <p className="text-xs text-gray-400 mt-1">From: {req.requester_email}</p>}
                                            {req.review_note && (
                                                <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-1.5 rounded-lg">
                                                    Rejection note: {req.review_note}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 shrink-0">{new Date(req.created_at).toLocaleDateString('en-BD', { dateStyle: 'medium' })}</p>
                                    </div>

                                    {req.status === 'pending' && (
                                        <div className="flex gap-2 pt-2 border-t border-gray-50">
                                            {/* Approve */}
                                            <Button
                                                size="sm"
                                                onClick={() => setApprovingId(isApproving ? null : req.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                Approve
                                                {isApproving ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                                            </Button>
                                            {/* Reject */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setRejectingId(isRejecting ? null : req.id)}
                                                className="border-red-200 text-red-500 hover:bg-red-50 text-xs"
                                            >
                                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}

                                    {/* Approve form */}
                                    {isApproving && (
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                                            <p className="text-sm font-semibold text-green-800">Confirm approval details:</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Short Name *</label>
                                                    <Input
                                                        value={approveData.short_name}
                                                        onChange={e => setApproveData(d => ({ ...d, short_name: e.target.value.toUpperCase() }))}
                                                        placeholder={req.short_name || 'e.g. DIU'}
                                                        className="uppercase text-sm h-8"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Postal Code *</label>
                                                    <Input
                                                        value={approveData.postal_code}
                                                        onChange={e => setApproveData(d => ({ ...d, postal_code: e.target.value }))}
                                                        placeholder="e.g. 1207"
                                                        className="text-sm h-8"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Email Domain</label>
                                                    <Input
                                                        value={approveData.email_domain}
                                                        onChange={e => setApproveData(d => ({ ...d, email_domain: e.target.value }))}
                                                        placeholder="e.g. diu.edu.bd"
                                                        className="text-sm h-8"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-700 hover:bg-green-800 text-white text-xs"
                                                    disabled={!approveData.short_name || !approveData.postal_code || approveMutation.isPending}
                                                    onClick={() => approveMutation.mutate({ id: req.id, data: approveData })}
                                                >
                                                    {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                                                    Confirm Approval
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setApprovingId(null)}>Cancel</Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reject form */}
                                    {isRejecting && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                                            <p className="text-sm font-semibold text-red-700">Provide a reason for rejection:</p>
                                            <textarea
                                                value={rejectNote}
                                                onChange={e => setRejectNote(e.target.value)}
                                                rows={2}
                                                placeholder="e.g. This institution already exists as DUET..."
                                                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none bg-white"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-red-600 hover:bg-red-700 text-white text-xs"
                                                    disabled={!rejectNote.trim() || rejectMutation.isPending}
                                                    onClick={() => rejectMutation.mutate({ id: req.id, note: rejectNote })}
                                                >
                                                    {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                                                    Confirm Rejection
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Dialogs */}
            <AddUniversityDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
            <EditUniversityDrawer university={editCampus} isOpen={!!editCampus} onClose={() => setEditCampus(null)} />
        </div>
    )
}

