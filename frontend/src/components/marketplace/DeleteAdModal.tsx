import React, { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

interface DeleteAdModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    adId: string | number | null
    adTitle?: string
    onSuccess: () => void
}

export function DeleteAdModal({ isOpen, onOpenChange, adId, adTitle, onSuccess }: DeleteAdModalProps) {
    const { toast } = useToast()
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!adId) return
        setIsDeleting(true)
        try {
            await api.delete(`/marketplace/listings/${adId}/`)
            toast({
                title: 'Ad deleted successfully.',
                description: 'The listing has been permanently removed.'
            })
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: 'Failed to delete',
                description: error.response?.data?.detail || 'Please try again later.',
                variant: 'destructive',
            })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !isDeleting && onOpenChange(open)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="w-5 h-5" />
                        Delete this Ad?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600">
                        {adTitle && <strong className="block text-gray-900 mb-2 truncate">&quot;{adTitle}&quot;</strong>}
                        This action cannot be undone. Your ad will be permanently removed from the CampusHat marketplace.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} className="border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => { e.preventDefault(); handleDelete() }}
                        disabled={isDeleting}
                        className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 font-bold"
                    >
                        {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
