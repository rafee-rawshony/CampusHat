'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
}

export function UpgradePrompt({
    isOpen,
    onClose,
    title = 'Verification Required',
    description = 'You need to verify your university identity to interact with sellers, make offers, or post your own ads on CampusHat Marketplace.',
}: UpgradePromptProps) {
    const router = useRouter()

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md text-center bg-white rounded-2xl">
                <DialogHeader className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="w-8 h-8 text-brand-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-purple-600">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-6">
                    <Button
                        onClick={() => {
                            onClose()
                            router.push('/auth/verify')
                        }}
                        className="w-full h-12 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-md shadow-md gap-2"
                    >
                        Get Verified Now
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full text-gray-500 hover:text-gray-800"
                    >
                        Maybe Later
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
