'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const [cooldown, setCooldown] = useState(0)
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    const handleResend = async () => {
        if (cooldown > 0) return
        setIsResending(true)
        try {
            await api.post('/auth/resend-verification/', { email })
            toast.success('Verification email sent!')
            setCooldown(60)
        } catch {
            toast.error('Failed to resend. Please try again.')
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-base p-4">
            <Card className="w-full max-w-md animate-fade-in text-center">
                <CardHeader className="pb-2">
                    <div className="mx-auto w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h1 className="text-xl font-semibold">Check your email</h1>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        We sent a verification link to
                    </p>
                    <p className="font-medium text-brand-primary">{email}</p>
                    <p className="text-xs text-muted-foreground">
                        Click the link in the email to verify your account. If you don&apos;t
                        see it, check your spam folder.
                    </p>
                    <Button
                        onClick={handleResend}
                        variant="outline"
                        className="w-full gap-2"
                        disabled={cooldown > 0 || isResending}
                    >
                        <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                        {cooldown > 0
                            ? `Resend in ${cooldown}s`
                            : isResending
                                ? 'Sending...'
                                : 'Resend Email'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-surface-base">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
