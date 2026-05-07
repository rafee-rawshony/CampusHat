'use client'

/**
 * Email change confirmation landing page.
 *
 * The verification email sends users to /auth/confirm-email-change?token=xxx.
 * This page reads the token, calls the confirm endpoint, and shows a status.
 *
 * Wrapped in <Suspense> because useSearchParams() requires it for static
 * rendering / pre-render output.
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { confirmEmailChange } from '@/services/profile.service'
import { useAuthStore } from '@/stores/auth.store'

type Status = 'pending' | 'success' | 'error'

function ConfirmEmailChangeContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { logout } = useAuthStore()
    const token = searchParams?.get('token') || ''

    const [status, setStatus] = useState<Status>('pending')
    const [message, setMessage] = useState('')

    useEffect(() => {
        // Single fire-and-forget call — strict-mode double-invoke is fine
        // because the backend treats a used token as expired.
        if (!token) {
            setStatus('error')
            setMessage('No confirmation token in the link. Make sure you used the latest email.')
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const res = await confirmEmailChange(token)
                if (cancelled) return
                setStatus('success')
                setMessage(res.message || 'Email changed successfully.')
                // The login email has now changed — kick the user back to login
                // because their existing access token still references the old email.
                try { await logout() } catch { /* best-effort */ }
            } catch (error: unknown) {
                if (cancelled) return
                const err = error as { response?: { data?: { message?: string } } }
                setStatus('error')
                setMessage(err.response?.data?.message || 'This link is invalid or expired.')
            }
        })()
        return () => { cancelled = true }
    }, [token, logout])

    return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                {status === 'pending' && (
                    <>
                        <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-5">
                            <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Confirming your new email...</h1>
                        <p className="text-sm text-gray-500">Hang tight, this only takes a second.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-emerald-100">
                            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Email Changed!</h1>
                        <p className="text-sm text-gray-500 mb-6">{message}</p>
                        <Link href="/auth/login">
                            <Button className="bg-brand-primary hover:bg-brand-dark w-full">
                                Log In With Your New Email
                            </Button>
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-red-100">
                            <XCircle className="h-9 w-9 text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Couldn&apos;t Confirm</h1>
                        <p className="text-sm text-gray-500 mb-6">{message}</p>
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={() => router.push('/account')}
                                className="bg-brand-primary hover:bg-brand-dark"
                            >
                                <Mail className="h-4 w-4 mr-2" /> Try Again From My Profile
                            </Button>
                            <Link href="/auth/login">
                                <Button variant="outline" className="w-full">Back to Login</Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default function ConfirmEmailChangePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface-base flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        }>
            <ConfirmEmailChangeContent />
        </Suspense>
    )
}
