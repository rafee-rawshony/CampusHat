import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'

interface ReportModalProps {
    isOpen: boolean
    onClose: () => void
    entityId: string | number
    entityType: 'listing' | 'user' | 'store'
}

export function ReportModal({ isOpen, onClose, entityId, entityType }: ReportModalProps) {
    const [reason, setReason] = useState('')
    const [details, setDetails] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason) return

        setIsSubmitting(true)
        try {
            // Note: Update endpoint based on real backend routing for reports
            await api.post(`/reports/`, {
                entity_id: entityId,
                entity_type: entityType,
                reason,
                details: details.trim()
            })
            toast({
                title: 'Report Submitted',
                description: 'Thank you. Our moderation team will review this shortly.',
            })
            onClose()
            setReason('')
            setDetails('')
        } catch (error: any) {
            toast({
                title: 'Failed to submit report',
                description: error.response?.data?.detail || 'An unexpected error occurred.',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Report {entityType}</DialogTitle>
                        <DialogDescription>
                            Please provide details about what is wrong with this {entityType}. False reports may lead to account penalties.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label>Reason for reporting</Label>
                            <Select value={reason} onValueChange={setReason} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="spam">Spam or Misleading</SelectItem>
                                    <SelectItem value="scam">Scam or Fraud</SelectItem>
                                    <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                                    <SelectItem value="prohibited">Prohibited Item</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="details">Additional Details (Required)</Label>
                            <Textarea
                                id="details"
                                required
                                placeholder={`Please describe why you are reporting this ${entityType}...`}
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={isSubmitting || !reason || !details}>
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
