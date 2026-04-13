import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

interface ApproveConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    title: string
    body: string
    isLoading: boolean
    extraContent?: React.ReactNode
}

export function ApproveConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    body,
    isLoading,
    extraContent
}: ApproveConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onClose}>
            <DialogContent className="max-w-sm rounded-2xl bg-white p-6 shadow-xl border-0 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                
                <DialogTitle className="font-bold text-gray-900 text-lg text-center">
                    {title}
                </DialogTitle>
                
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {body}
                </p>

                {extraContent && (
                    <div className="mt-4 text-left">
                        {extraContent}
                    </div>
                )}

                <div className="flex justify-center gap-3 mt-6">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        disabled={isLoading}
                        className="rounded-lg w-24"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-[#059669] text-white hover:bg-[#047857] rounded-lg min-w-[100px]"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
