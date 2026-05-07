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
    const { user } = useAuthStore()

    const handleDismiss = () => {
        sessionStorage.setItem('dismissedVerification', 'true')
        onClose()
    }

    const role = user?.role
    const isStudentOrFaculty = role === 'student' || role === 'faculty'

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
            <DialogContent className="sm:max-w-sm p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center">
                        <GraduationCap className="h-8 w-8 text-brand-primary" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isStudentOrFaculty ? 'Verify Your Student ID' : 'Students & Faculty Only'}
                </h2>

                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    {isStudentOrFaculty
                        ? 'Verify your university ID to post ads, chat with sellers, and view contact information.'
                        : 'CampusHat Marketplace is a student-to-student platform. Only verified university students and faculty can post ads or view contact info.'}
                </p>

                <div className="space-y-3">
                    {isStudentOrFaculty && (
                        <Link href="/account/verify" className="block w-full" onClick={onClose}>
                            <Button className="w-full">Verify Student ID</Button>
                        </Link>
                    )}

                    <Button
                        variant="outline"
                        className="w-full text-muted-foreground"
                        onClick={handleDismiss}
                    >
                        Maybe Later
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function VerificationBanner() {
    const { isAuthenticated, canAccessMarketplace } = useAuthStore()
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const isDismissed = sessionStorage.getItem('dismissedVerification') === 'true'
        // Show banner only to logged-in users who don't have marketplace access yet
        if (isAuthenticated && !canAccessMarketplace() && !isDismissed) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }, [isAuthenticated, canAccessMarketplace])

    if (!isVisible) return null

    return (
        <div className="bg-brand-light border-b border-brand-light/20 py-3 relative">
            <div className="container mx-auto px-4 pr-10 flex flex-col sm:flex-row items-center justify-center gap-2 text-center sm:text-left text-brand-dark text-sm">
                <span>
                    <GraduationCap className="inline-block h-4 w-4 mr-1 text-brand-primary" />
                    <strong>Student or Faculty?</strong> Verify your university ID to unlock posting, chat, and contact info.
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
