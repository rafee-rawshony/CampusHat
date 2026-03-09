'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export function VerificationRequiredCard({
    isOpen,
    onClose,
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const handleDismiss = () => {
        sessionStorage.setItem('dismissedVerification', 'true')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
            <DialogContent className="sm:max-w-sm p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center">
                        <GraduationCap className="h-8 w-8 text-brand-primary" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Required</h2>

                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    If you are a student, please verify your{' '}
                    <Link href="/account/verify" className="text-brand-primary underline font-medium hover:text-brand-dark transition-colors">
                        student status
                    </Link>{' '}
                    to unlock student-only features.
                </p>

                <div className="space-y-3">
                    <Link href="/account/verify" className="block w-full">
                        <Button className="w-full">
                            Verify as Student
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        className="w-full text-muted-foreground"
                        onClick={handleDismiss}
                    >
                        Continue as Regular User
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function VerificationBanner() {
    const { user, isAuthenticated, isVerifiedStudent, isSeller } = useAuthStore()
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Only show if authenticated, not verified implicitly or explicitly, and not dismissed
        const isDismissed = sessionStorage.getItem('dismissedVerification') === 'true'

        if (isAuthenticated && !isVerifiedStudent() && !isSeller() && !isDismissed) {
            setIsVisible(true)
        }
    }, [isAuthenticated, isVerifiedStudent, isSeller])

    if (!isVisible) return null

    return (
        <div className="bg-brand-light border-b border-brand-light/20 py-3 relative">
            <div className="container mx-auto px-4 pr-10 flex flex-col sm:flex-row items-center justify-center gap-2 text-center sm:text-left text-brand-dark text-sm">
                <span>
                    <GraduationCap className="inline-block h-4 w-4 mr-1 text-brand-primary" />
                    <strong>Student?</strong> Verify your university ID to unlock exclusive campus prices and features.
                </span>
                <Link href="/account/verify" className="font-bold underline text-brand-primary hover:text-brand-dark">
                    Verify Now
                </Link>
            </div>
            <button
                onClick={() => {
                    sessionStorage.setItem('dismissedVerification', 'true')
                    setIsVisible(false)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary/60 hover:text-brand-primary"
                aria-label="Dismiss banner"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
