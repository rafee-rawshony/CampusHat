'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')
    const email = searchParams.get('email') || ''

    // Token-mode state (when user clicks link from email)
    const [verifyStatus, setVerifyStatus] = useState<'loading' | 'success' | 'error' | null>(
        token ? 'loading' : null
    )
    const [verifyMessage, setVerifyMessage] = useState('')

    // Resend-mode state
    const [cooldown, setCooldown] = useState(0)
    const [isResending, setIsResending] = useState(false)

    // Auto-verify when token is present in URL
    useEffect(() => {
        if (!token) return
        api.get(`/auth/verify-email/?token=${token}`)
            .then(() => {
                setVerifyStatus('success')
                setVerifyMessage('Your email has been verified successfully. You can now log in.')
            })
            .catch((err) => {
                const msg = err?.response?.data?.message || 'Invalid or expired verification link.'
                setVerifyStatus('error')
                setVerifyMessage(msg)
            })
    }, [token])

    // Cooldown countdown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    const handleResend = async () => {
        if (cooldown > 0 || !email) return
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

    // ── Token mode: loading ──────────────────────────────────────────────────
    if (token && verifyStatus === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-base p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="pt-10 pb-10 space-y-4">
                        <RefreshCw className="h-12 w-12 text-brand-primary animate-spin mx-auto" />
                        <p className="text-muted-foreground">Verifying your email...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ── Token mode: success ──────────────────────────────────────────────────
    if (token && verifyStatus === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-base p-4">
                <Card className="w-full max-w-md animate-fade-in text-center">
                    <CardHeader className="pb-2">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-xl font-semibold">Email Verified!</h1>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{verifyMessage}</p>
                        <Button className="w-full" onClick={() => router.push('/auth/login')}>
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ── Token mode: error ────────────────────────────────────────────────────
    if (token && verifyStatus === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-base p-4">
                <Card className="w-full max-w-md animate-fade-in text-center">
                    <CardHeader className="pb-2">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-xl font-semibold">Verification Failed</h1>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{verifyMessage}</p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/auth/login')}
                        >
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ── Email mode: "Check your email" (after registration) ─────────────────
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
