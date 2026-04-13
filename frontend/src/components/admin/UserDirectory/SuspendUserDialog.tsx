import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
    Dialog, DialogContent, DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface SuspendUserDialogProps {
    isOpen: boolean
    onClose: () => void
    user: any
}

export function SuspendUserDialog({ isOpen, onClose, user }: SuspendUserDialogProps) {
    const queryClient = useQueryClient()
    const [reason, setReason] = useState('')
    const [duration, setDuration] = useState('Permanent')

    const { mutate: suspendUser, isPending } = useMutation({
        mutationFn: async () => {
            return api.post(`/admin/users/${user.id}/suspend/`, { reason, duration })
        },
        onSuccess: () => {
            toast.success(`${user?.full_name}'s account has been suspended.`)
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            queryClient.invalidateQueries({ queryKey: ['admin-user', user?.id] })
            onClose()
            setReason('')
            setDuration('Permanent')
        },
        onError: () => {
            toast.error('Failed to suspend. Please try again.')
        }
    })

    if (!user) return null

    const handleConfirm = () => {
        if (reason.length < 10) return
        suspendUser()
    }

    return (
        <Dialog open={isOpen} onOpenChange={isPending ? undefined : onClose}>
            <DialogContent className="max-w-sm rounded-2xl p-6 shadow-xl border-0">
                <DialogTitle className="font-bold text-gray-900 text-lg">Suspend User Account</DialogTitle>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Suspending <span className="font-semibold text-gray-700">{user.full_name}</span> will prevent them from logging in and accessing the platform.
                </p>

                <div className="mt-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Reason for suspension</label>
                        <Textarea 
                            rows={3} 
                            className="resize-none bg-gray-50 border-gray-200 focus-visible:ring-red-500 rounded-xl text-sm"
                            placeholder="Explain why this account is being suspended..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isPending}
                        />
                        {reason.length > 0 && reason.length < 10 && (
                            <p className="text-xs text-red-500">Reason must be at least 10 characters.</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Suspension Duration</label>
                        <Select value={duration} onValueChange={setDuration} disabled={isPending}>
                            <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-red-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Permanent">Permanent</SelectItem>
                                <SelectItem value="7 Days">7 Days</SelectItem>
                                <SelectItem value="30 Days">30 Days</SelectItem>
                                <SelectItem value="90 Days">90 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start mt-4">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 font-medium leading-tight">
                            ⚠ The user will be immediately logged out of all sessions.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={isPending} className="border-gray-200 font-semibold rounded-lg w-24">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={reason.length < 10 || isPending}
                        className="bg-red-500 text-white hover:bg-red-600 rounded-lg font-semibold min-w-[130px]"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suspend Account'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
