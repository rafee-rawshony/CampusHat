'use client'

import { timeAgo } from '@/lib/timeAgo'
import { formatDateTime } from '@/lib/formatDate'
import { ActivityLog } from './ActivityLogCard'
import { AdminAvatar } from '../shared/AdminAvatar'
import { ResourceBadge } from '../shared/ResourceBadge'
import { ActionIcon } from '../shared/ActionIcon'

interface ActivityLogTableProps {
    logs: ActivityLog[]
    onClick: (log: ActivityLog) => void
    isLoading: boolean
}

export function ActivityLogTable({ logs, onClick, isLoading }: ActivityLogTableProps) {
    if (isLoading) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hidden md:block">
                <div className="bg-gray-50 border-b border-gray-100 h-10 w-full" />
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="border-b border-gray-50 h-16 flex items-center px-4 gap-4 animate-pulse">
                        <div className="w-[200px] flex gap-2 items-center">
                            <div className="w-7 h-7 rounded-full bg-gray-200" />
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                        </div>
                        <div className="flex-1 flex gap-2 items-center">
                            <div className="w-4 h-4 rounded-full bg-gray-200" />
                            <div className="h-4 w-48 bg-gray-200 rounded" />
                        </div>
                        <div className="w-[180px]">
                            <div className="h-4 w-20 bg-gray-200 rounded-full" />
                        </div>
                        <div className="w-[130px]">
                            <div className="h-3 w-20 bg-gray-200 rounded" />
                        </div>
                        <div className="w-[130px]">
                            <div className="h-3 w-16 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hidden md:block">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="w-[220px] text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Admin</th>
                        <th className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Action</th>
                        <th className="w-[200px] text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Resource</th>
                        <th className="w-[130px] text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">IP Address</th>
                        <th className="w-[140px] text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr 
                            key={log.id} 
                            onClick={() => onClick(log)}
                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        >
                            <td className="px-4 py-3.5 align-middle">
                                <div className="flex items-center gap-2.5">
                                    <AdminAvatar user={log.admin_user} />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                                            {log.admin_user?.full_name || 'Deleted Admin'}
                                        </div>
                                        <div className="text-[10px] text-gray-400 uppercase font-semibold">
                                            {log.admin_user?.role?.replace(/_/g, ' ') || '—'}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                                <div className="flex items-center gap-2.5">
                                    <div className="shrink-0">
                                        <ActionIcon actionType={log.action_type} />
                                    </div>
                                    <div className="text-sm text-gray-700 line-clamp-1" title={log.action}>
                                        {log.action}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                                <div>
                                    <ResourceBadge resourceType={log.resource_type} />
                                    <div className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-[170px]" title={log.resource_name}>
                                        {log.resource_name}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                                <span className={`font-mono text-[11px] ${log.ip_address ? 'text-gray-500' : 'text-gray-300'}`}>
                                    {log.ip_address || '—'}
                                    {log.ip_address && (log.ip_address === '127.0.0.1' || log.ip_address === '::1') && ' (Local)'}
                                </span>
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                                <div className="text-sm text-gray-600 font-medium" title={formatDateTime(log.created_at)}>
                                    {timeAgo(log.created_at)}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
