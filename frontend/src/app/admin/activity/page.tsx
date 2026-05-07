'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, RefreshCw, Activity, Shield } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/timeAgo'

import { ActivityStatsBanner } from '@/components/admin/ActivityLogs/ActivityStatsBanner'
import { ActivityLogFilters } from '@/components/admin/ActivityLogs/ActivityLogFilters'
import { ActivityLogTable } from '@/components/admin/ActivityLogs/ActivityLogTable'
import { ActivityLogCard, ActivityLog } from '@/components/admin/ActivityLogs/ActivityLogCard'
import { ActivityDetailDrawer } from '@/components/admin/ActivityLogs/ActivityDetailDrawer'

export default function AdminActivityPage() {
    const { isAdmin, _hasHydrated } = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()

    const [page, setPage] = useState(1)
    const [jumpPage, setJumpPage] = useState('')
    const [filters, setFilters] = useState({
        search: '',
        action_type: '',
        resource_type: '',
        admin_user: '',
        date_from: '',
        date_to: '',
    })

    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
    const [isExporting, setIsExporting] = useState(false)
    const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date())

    useEffect(() => {
        if (_hasHydrated && !isAdmin()) {
            router.replace('/admin/approvals')
        }
    }, [_hasHydrated, isAdmin, router])

    const { data: logsData, isLoading, isFetching } = useQuery({
        queryKey: ['admin-activity', filters, page],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.append('page', page.toString())
            params.append('page_size', '25')
            if (filters.search) params.append('search', filters.search)
            if (filters.action_type) params.append('action_type', filters.action_type)
            if (filters.resource_type) params.append('resource_type', filters.resource_type)
            if (filters.admin_user) params.append('admin_user', filters.admin_user)
            if (filters.date_from) params.append('date_from', filters.date_from)
            if (filters.date_to) params.append('date_to', filters.date_to)

            const res = await api.get(`/admin/action-logs/?${params.toString()}`)
            setLastFetchTime(new Date())
            return res.data?.data || res.data || { results: [], pagination: { count: 0, total_pages: 1, current_page: 1 } }
        },
        staleTime: 30_000,
        refetchInterval: 30_000, // 30s auto-refresh
    })

    const logs: ActivityLog[] = logsData?.results || []
    const totalCount = logsData?.pagination?.count || logsData?.count || logs.length
    const totalPages = logsData?.pagination?.total_pages || Math.ceil(totalCount / 25)

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters)
        setPage(1)
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const params = new URLSearchParams()
            params.append('format', 'csv')
            if (filters.search) params.append('search', filters.search)
            if (filters.action_type) params.append('action_type', filters.action_type)
            if (filters.resource_type) params.append('resource_type', filters.resource_type)
            if (filters.admin_user) params.append('admin_user', filters.admin_user)
            if (filters.date_from) params.append('date_from', filters.date_from)
            if (filters.date_to) params.append('date_to', filters.date_to)

            const res = await api.get(`/admin/action-logs/?${params.toString()}`, { responseType: 'blob' })
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `campushat_activity_logs_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            link.parentNode?.removeChild(link)
        } catch {
            toast('Export feature is coming soon.')
        } finally {
            setIsExporting(false)
        }
    }

    // Timer logic to force a re-render so "timeAgo(lastFetchTime)" updates continuously
    const [, setTick] = useState(0)
    useEffect(() => {
        const i = setInterval(() => setTick(t => t + 1), 5000)
        return () => clearInterval(i)
    }, [])

    if (!_hasHydrated) return null

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Activity Logs</h1>
                    <p className="text-gray-500 text-sm mt-1">Track all admin and moderator actions across the platform.</p>
                </div>
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors bg-white font-medium disabled:opacity-50"
                >
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            <ActivityStatsBanner />

            <ActivityLogFilters 
                filters={filters} 
                onChange={handleFilterChange} 
                totalResults={totalCount} 
            />

            {/* List & Controls Header */}
            <div className="flex items-center justify-end gap-3 text-xs text-gray-400 mb-2">
                <span className="flex items-center gap-1.5">
                    {isFetching && <RefreshCw className="w-3 h-3 animate-spin" />}
                    Last updated: {isFetching ? 'Refreshing...' : timeAgo(lastFetchTime.toISOString())}
                </span>
                <button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-activity'] })}
                    className="p-1.5 rounded bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
                    title="Manual Refresh"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <>
                    <ActivityLogTable logs={[]} onClick={() => {}} isLoading={true} />
                    <div className="md:hidden space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-100 rounded-xl text-center">
                    {(filters.search || filters.action_type || filters.resource_type || filters.admin_user || filters.date_from) ? (
                        <>
                            <Activity className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">No activity found</h3>
                            <p className="text-sm text-gray-500 mt-1 mb-4">No logs match your current filter selection.</p>
                            <button onClick={() => handleFilterChange({search: '', action_type: '', resource_type: '', admin_user: '', date_from: '', date_to: ''})} className="text-[#4C3B8A] font-semibold text-sm hover:underline">
                                Clear all filters
                            </button>
                        </>
                    ) : (
                        <>
                            <Shield className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">No activity recorded yet</h3>
                            <p className="text-sm text-gray-500 mt-1">Admin actions will appear here as they happen.</p>
                        </>
                    )}
                </div>
            ) : (
                <>
                    {/* Desktop */}
                    <ActivityLogTable logs={logs} onClick={setSelectedLog} isLoading={false} />
                    
                    {/* Mobile */}
                    <div className="md:hidden space-y-3">
                        {logs.map(log => (
                            <ActivityLogCard key={log.id} log={log} onClick={setSelectedLog} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white border border-gray-100 rounded-xl p-4">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-semibold text-gray-900">{(page - 1) * 25 + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * 25, totalCount)}</span> of <span className="font-semibold text-gray-900">{totalCount}</span> logs
                            </div>

                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                                >
                                    &larr; Prev
                                </button>
                                
                                {/* Simple paginator logic for max 5 buttons */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pNum = page - 2 + i
                                    if (page < 3) pNum = i + 1
                                    else if (page > totalPages - 2) pNum = totalPages - 4 + i

                                    if (pNum >= 1 && pNum <= totalPages) {
                                        return (
                                            <button
                                                key={pNum}
                                                onClick={() => setPage(pNum)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium border
                                                    ${page === pNum ? 'bg-[#4C3B8A] text-white border-[#4C3B8A]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}
                                                `}
                                            >
                                                {pNum}
                                            </button>
                                        )
                                    }
                                    return null
                                })}

                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Next &rarr;
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Jump:</span>
                                <input 
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={jumpPage}
                                    onChange={(e) => setJumpPage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const p = parseInt(jumpPage)
                                            if (p >= 1 && p <= totalPages) setPage(p)
                                            setJumpPage('')
                                        }
                                    }}
                                    className="w-16 h-8 px-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-[#4C3B8A]/20 text-center text-sm"
                                    placeholder={page.toString()}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Detail Drawer */}
            <ActivityDetailDrawer 
                log={selectedLog} 
                isOpen={!!selectedLog} 
                onClose={() => setSelectedLog(null)} 
            />
        </div>
    )
}
