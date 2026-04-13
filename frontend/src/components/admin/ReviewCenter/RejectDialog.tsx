import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface RejectDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string, notes: string) => Promise<void>
    title: string
    subjectName: string
    reasons: string[]
    isLoading: boolean
}

export function RejectDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    subjectName,
    reasons,
    isLoading
}: RejectDialogProps) {
    const [reason, setReason] = useState('')
    const [notes, setNotes] = useState('')
    const [error, setError] = useState('')

    const handleConfirm = async () => {
        if (!reason) {
            setError('Please select a reason.')
            return
        }
        setError('')
        await onConfirm(reason, notes)
        // Reset state after successful submission handled by parent usually, but we can clear here too
        if (!isLoading) { // weak check but parent unmounts to handle it
            setReason('')
            setNotes('')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onClose}>
            <DialogContent className="max-w-md rounded-2xl bg-white p-6 shadow-xl border-0">
                <DialogTitle className="font-bold text-gray-900 text-lg">
                    {title}
                </DialogTitle>
                <div className="text-sm text-gray-500 mb-4 mt-1">
                    Item: <span className="font-semibold text-gray-700">{subjectName}</span>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Reason</label>
                        <Select 
                            value={reason} 
                            onValueChange={(v) => { setReason(v); setError('') }}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
                                <SelectValue placeholder="Select a reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                {reasons.map((r, i) => (
                                    <SelectItem key={i} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700">Additional notes for the student (optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => {
                                if (e.target.value.length <= 500) setNotes(e.target.value)
                            }}
                            disabled={isLoading}
                            rows={3}
                            placeholder="Provide specific feedback to help them resubmit..."
                            className="w-full resize-none border border-gray-200 rounded-lg p-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]"
                        />
                        <div className="text-right text-xs text-gray-400">
                            {notes.length}/500
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        disabled={isLoading}
                        className="rounded-lg w-24"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={!reason || isLoading}
                        className="bg-red-500 text-white hover:bg-red-600 rounded-lg disabled:opacity-50 min-w-[120px]"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Rejection'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
