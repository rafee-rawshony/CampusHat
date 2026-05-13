import { timeAgo } from '@/lib/timeAgo'
import { AdminAvatar } from '../shared/AdminAvatar'
import { ResourceBadge } from '../shared/ResourceBadge'
import { ActionIcon } from '../shared/ActionIcon'

export interface ActivityLog {
    id: string
    admin_user: {
        id: string
        full_name: string
        email: string
        role: string
        profile_picture?: string | null
    }
    action: string
    action_type: string
    resource_type: string
    resource_id: string
    resource_name: string
    changes: Record<string, { from: any, to: any }> | null
    ip_address: string | null
    created_at: string
}

interface ActivityLogCardProps {
    log: ActivityLog
    onClick: (log: ActivityLog) => void
}

export function ActivityLogCard({ log, onClick }: ActivityLogCardProps) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3 hover:shadow-sm transition-shadow">
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                    <div className="mt-0.5 shrink-0">
                        <ActionIcon actionType={log.action_type} size={16} />
                    </div>
                    <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                        {log.action}
                    </p>
                </div>
                <div className="shrink-0 text-xs text-gray-400 font-medium pt-0.5">
                    {timeAgo(log.created_at)}
                </div>
            </div>

            {/* Middle row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-gray-50 pr-2 rounded-full border border-gray-100 h-6">
                    <AdminAvatar user={log.admin_user} size="sm" />
                    <span className="text-[11px] text-gray-600 font-medium max-w-[100px] truncate">
                        {log.admin_user?.full_name || 'Deleted Admin'}
                    </span>
                </div>
                <ResourceBadge resourceType={log.resource_type} />
            </div>

            {/* Bottom row */}
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-400 font-mono truncate flex-1">
                    {log.resource_name}
                </p>
                <button 
                    onClick={() => onClick(log)}
                    className="shrink-0 text-[#4C3B8A] text-xs font-semibold hover:underline"
                >
                    Details &rarr;
                </button>
            </div>
        </div>
    )
}
