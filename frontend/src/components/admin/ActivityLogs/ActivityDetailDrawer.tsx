'use client'

import { useState } from 'react'
import { X, Copy, ChevronDown, ChevronRight, CheckCircle, XCircle, Ban, RefreshCw, Plus, Pencil, Trash2, LogIn, Activity } from 'lucide-react'
import { ActivityLog } from './ActivityLogCard'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { AdminAvatar } from '../shared/AdminAvatar'
import { ResourceBadge } from '../shared/ResourceBadge'
import { formatDateTime } from '@/lib/formatDate'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ActivityDetailDrawerProps {
    log: ActivityLog | null
    isOpen: boolean
    onClose: () => void
}

export function ActivityDetailDrawer({ log, isOpen, onClose }: ActivityDetailDrawerProps) {
    const [techOpen, setTechOpen] = useState(false)

    if (!log) return null

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied ID')
    }

    const renderBigIcon = () => {
        const type = log.action_type.toLowerCase()
        if (type === 'approve') return <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"><CheckCircle size={20} className="text-green-500" /></div>
        if (type === 'reject') return <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><XCircle size={20} className="text-red-500" /></div>
        if (type === 'suspend') return <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Ban size={20} className="text-red-500" /></div>
        if (type === 'activate') return <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"><RefreshCw size={20} className="text-green-500" /></div>
        if (type === 'create') return <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Plus size={20} className="text-blue-500" /></div>
        if (type === 'update') return <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Pencil size={20} className="text-amber-500" /></div>
        if (type === 'delete') return <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><Trash2 size={20} className="text-red-400" /></div>
        if (type === 'login') return <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0"><LogIn size={20} className="text-gray-500" /></div>
        
        return <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0"><Activity size={20} className="text-gray-500" /></div>
    }

    const getResourceRoute = () => {
        if (!log.resource_id) return null
        switch (log.resource_type.toLowerCase()) {
            case 'user': return `/admin/users/${log.resource_id}`
            case 'listing': return `/marketplace/buy/${log.resource_id}` // Mock implementation based on public route
            case 'university': return '/admin/campuses'
            case 'category': return '/admin/categories'
            default: return null
        }
    }

    const resourceLink = getResourceRoute()

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:w-[440px] p-0 flex flex-col border-0">
                <SheetHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between space-y-0 shrink-0">
                    <SheetTitle className="font-semibold text-gray-900 text-lg">Activity Detail</SheetTitle>
                    <SheetClose className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors">
                        <X className="w-5 h-5" />
                    </SheetClose>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    {/* Action Summary */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-4 items-start">
                        {renderBigIcon()}
                        <div>
                            <h2 className="font-semibold text-gray-900 text-base leading-tight">
                                {log.action}
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {formatDateTime(log.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* Performed By */}
                    <div>
                        <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Performed By</h3>
                        <div className="flex items-center gap-3">
                            <AdminAvatar user={log.admin_user} size="lg" />
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">{log.admin_user.full_name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-400">{log.admin_user.email}</span>
                                    <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                                        {log.admin_user.role.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Affected Resource */}
                    <div>
                        <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Affected Resource</h3>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500 w-12 font-medium">Type</span>
                                <ResourceBadge resourceType={log.resource_type} />
                            </div>
                            <div className="flex items-start gap-4">
                                <span className="text-xs text-gray-500 w-12 font-medium mt-0.5">Name</span>
                                <span className="text-sm text-gray-900 font-medium leading-snug">{log.resource_name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500 w-12 font-medium">ID</span>
                                <div className="flex items-center gap-2 group">
                                    <span className="text-xs font-mono text-gray-500">{log.resource_id}</span>
                                    <button onClick={() => handleCopy(log.resource_id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700">
                                        <Copy size={12} />
                                    </button>
                                </div>
                            </div>
                            {resourceLink && (
                                <div className="pt-2 border-t border-gray-200 mt-2">
                                    <Link href={resourceLink} target="_blank" className="text-sm font-semibold text-[#4C3B8A] hover:underline flex items-center gap-1 w-max">
                                        View Resource <span>&rarr;</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Changes Made */}
                    {log.changes && Object.keys(log.changes).length > 0 && (
                        <div>
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Changes Made</h3>
                            <div className="border border-gray-100 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Field</th>
                                            <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">From</th>
                                            <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">To</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {Object.entries(log.changes).map(([field, delta]) => (
                                            <tr key={field} className="bg-white">
                                                <td className="px-3 py-2 font-medium text-gray-600">{field}</td>
                                                <td className="px-3 py-2 text-gray-400 line-through">
                                                    {delta.from === null || delta.from === '' ? '—' : String(delta.from)}
                                                </td>
                                                <td className="px-3 py-2 font-bold text-gray-900 break-words max-w-[120px]">
                                                    {delta.to === null || delta.to === '' ? '—' : String(delta.to)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Technical Info */}
                    <div>
                        <button 
                            onClick={() => setTechOpen(!techOpen)}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 font-semibold uppercase tracking-wider py-2"
                        >
                            {techOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            Technical Details
                        </button>
                        
                        {techOpen && (
                            <div className="mt-2 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs font-mono text-gray-500">
                                <div className="flex gap-4">
                                    <span className="w-20 text-gray-400">IP Address:</span>
                                    <span>{log.ip_address || 'Not recorded'}</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="w-20 text-gray-400">Log ID:</span>
                                    <span className="break-all">{log.id}</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="w-20 text-gray-400">Timestamp:</span>
                                    <span>{log.created_at}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
