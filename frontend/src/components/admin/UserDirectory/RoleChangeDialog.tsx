import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
    Dialog, DialogContent, DialogTitle
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { AlertTriangle, Info, Loader2 } from 'lucide-react'

interface RoleChangeDialogProps {
    isOpen: boolean
    onClose: () => void
    user: any
}

const ROLES = [
    { value: 'normal_user', label: 'Normal User' },
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'seller', label: 'Seller' },
    { value: 'seller_mod', label: 'Seller Mod' },
    { value: 'marketplace_mod', label: 'Market Mod' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Admin' },
]

export function RoleChangeDialog({ isOpen, onClose, user }: RoleChangeDialogProps) {
    const queryClient = useQueryClient()
    const [selectedRole, setSelectedRole] = useState<string>('')

    const { mutate: changeRole, isPending } = useMutation({
        mutationFn: async (role: string) => {
            // First try a PATCH, then fallback in case routing is slightly different
            return api.patch(`/admin/users/${user.id}/role/`, { role })
                .catch(err => {
                    if (err.response?.status === 404 || err.response?.status === 405) {
                        return api.post(`/admin/users/${user.id}/change-role/`, { role })
                    }
                    throw err
                })
        },
        onSuccess: (_, variables) => {
            const roleLabel = ROLES.find(r => r.value === variables)?.label
            toast.success(`Role updated to ${roleLabel}.`)
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            queryClient.invalidateQueries({ queryKey: ['admin-user', user.id] })
            onClose()
            setSelectedRole('') // reset
        },
        onError: () => {
            toast.error('Failed to change role.')
        }
    })

    if (!user) return null

    const currentRoleLabel = ROLES.find(r => r.value === user.role)?.label || user.role

    const handleConfirm = () => {
        if (!selectedRole) return
        changeRole(selectedRole)
    }

    const availableRoles = ROLES.filter(r => r.value !== user.role)

    return (
        <Dialog open={isOpen} onOpenChange={isPending ? undefined : onClose}>
            <DialogContent className="max-w-sm rounded-2xl p-6 shadow-xl border-0">
                <DialogTitle className="font-bold text-gray-900 text-lg">Change User Role</DialogTitle>
                <div className="mt-1">
                    <p className="text-sm text-gray-500">Changing: <span className="font-semibold text-gray-800">{user.full_name}</span></p>
                    <p className="text-sm text-gray-600 mb-4 mt-2">Current role: <span className="font-semibold">{currentRoleLabel}</span></p>
                </div>

                <div className="space-y-4">
                    <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isPending}>
                        <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus-visible:ring-[#4C3B8A]">
                            <SelectValue placeholder="Select new role..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableRoles.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedRole === 'admin' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2 items-start mt-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800 font-medium leading-tight">
                                ⚠ Granting admin role gives full platform access.
                            </p>
                        </div>
                    )}

                    {['moderator', 'seller_mod', 'marketplace_mod'].includes(selectedRole) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 items-start mt-2">
                            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-800 font-medium leading-tight">
                                ℹ This user will gain moderation capabilities.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={isPending} className="border-gray-200 font-semibold rounded-lg w-24">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={!selectedRole || isPending}
                        className="bg-[#4C3B8A] text-white hover:bg-[#3b2d6e] rounded-lg font-semibold min-w-[120px]"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Role'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
