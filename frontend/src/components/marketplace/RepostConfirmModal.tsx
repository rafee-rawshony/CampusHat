import React, { useState } from 'react'
import { RotateCcw, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

interface RepostConfirmModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    adId: string | number | null
    adTitle?: string
    onSuccess: () => void
}

export function RepostConfirmModal({ isOpen, onOpenChange, adId, adTitle, onSuccess }: RepostConfirmModalProps) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [durationDays, setDurationDays] = useState("15")

    const handleRepost = async () => {
        if (!adId) return
        setIsSubmitting(true)
        try {
            // Backend endpoint for repost requires duration_days
            await api.post(`/marketplace/listings/${adId}/repost/`, {
                duration_days: Number(durationDays)
            })

            toast({
                title: 'Ad resubmitted for review!',
                description: 'Your listing will be activated once approved.'
            })
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: 'Failed to repost ad',
                description: error.response?.data?.message || error.response?.data?.detail || 'Please check your connection and try again.',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-gray-500" />
                        Repost this Ad?
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-gray-600">
                        {adTitle && <strong className="block text-gray-900 mb-2 truncate">&quot;{adTitle}&quot;</strong>}
                        Reposting will resubmit your ad for review. A new expiry date will be set based on your chosen duration.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">New Listing Duration</label>
                    <Select value={durationDays} onValueChange={setDurationDays}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="15">15 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => onOpenChange(false)} 
                        disabled={isSubmitting}
                        className="font-semibold text-gray-700 hover:bg-gray-50 border-gray-200"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        onClick={handleRepost} 
                        disabled={isSubmitting}
                        className="bg-[#4C3B8A] hover:bg-[#3D2F6E] flex items-center font-bold text-white shadow-md focus:ring-[#4C3B8A]"
                    >
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Repost Ad'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
