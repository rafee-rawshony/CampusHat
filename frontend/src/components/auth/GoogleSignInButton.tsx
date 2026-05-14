'use client'

/**
 * Google Sign-In button.
 *
 * Loads the Google Identity Services script once, renders the official
 * Google button into a container, and forwards the ID token credential
 * to the backend (/api/v1/auth/google/) for verification.
 *
 * Reused by both login and register pages — the only difference is the
 * label ("Continue with Google" vs "Sign up with Google").
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { googleAuth } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'

// Google Identity Services script URL
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

// Pick the same redirect logic used elsewhere — keeps the post-login
// experience consistent across password / OTP / Google flows.
function getRoleRedirect(
    user: { role: string; seller_application_status?: string | null },
    redirectParam: string | null
): string {
    if (redirectParam) return redirectParam
    if (['admin', 'moderator', 'seller_mod', 'marketplace_mod'].includes(user.role)) return '/admin'
    if (user.seller_application_status === 'approved') return '/dashboard/seller'
    return '/'
}

interface GoogleSignInButtonProps {
    /** Visible label inside the button — "signin_with" or "signup_with" */
    mode?: 'signin' | 'signup'
    /** Called after successful authentication */
    onSuccess?: () => void
}

// Tell TypeScript about the global `google` object injected by the GIS script
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string
                        callback: (response: { credential: string }) => void
                        ux_mode?: 'popup' | 'redirect'
                        auto_select?: boolean
                    }) => void
                    renderButton: (
                        parent: HTMLElement,
                        options: {
                            type?: 'standard' | 'icon'
                            theme?: 'outline' | 'filled_blue' | 'filled_black'
                            size?: 'large' | 'medium' | 'small'
                            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
                            shape?: 'rectangular' | 'pill' | 'circle' | 'square'
                            logo_alignment?: 'left' | 'center'
                            width?: number | string
                        }
                    ) => void
                }
            }
        }
    }
}

export default function GoogleSignInButton({ mode = 'signin', onSuccess }: GoogleSignInButtonProps) {
    const router = useRouter()
    const { setUser, setAccessToken } = useAuthStore()
    const containerRef = useRef<HTMLDivElement>(null)
    const initializedRef = useRef(false)
    const [isReady, setIsReady] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    // Load the Google Identity Services script (only once across the page)
    useEffect(() => {
        if (typeof window === 'undefined') return

        // If Google is already loaded, skip
        if (window.google?.accounts?.id) {
            setIsReady(true)
            return
        }

        // If a script tag already exists, just wait for it
        const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)
        if (existing) {
            existing.addEventListener('load', () => setIsReady(true))
            return
        }

        const script = document.createElement('script')
        script.src = GIS_SCRIPT_SRC
        script.async = true
        script.defer = true
        script.onload = () => setIsReady(true)
        script.onerror = () => setError('Failed to load Google Sign-In. Please refresh and try again.')
        document.head.appendChild(script)
    }, [])

    // Initialize Google + render the official button when ready
    useEffect(() => {
        if (!isReady || !containerRef.current || !clientId) return
        if (!window.google?.accounts?.id) return

        const handleCredentialResponse = async (response: { credential: string }) => {
            try {
                const { user, access_token, is_new_user } = await googleAuth(response.credential)
                setAccessToken(access_token)
                setUser(user)
                toast.success(is_new_user ? 'Welcome to CampusHat!' : 'Welcome back!')

                const searchParams = new URLSearchParams(window.location.search)
                const redirect = getRoleRedirect(user, searchParams.get('redirect'))

                if (onSuccess) onSuccess()
                router.push(redirect)
            } catch (err: any) {
                const message =
                    err?.response?.data?.message ||
                    err?.response?.data?.detail ||
                    'Google sign-in failed. Please try again.'
                toast.error(message)
            }
        }

        // Only initialize once to avoid GSI_LOGGER warning
        if (!initializedRef.current) {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                ux_mode: 'popup',
                auto_select: false,
            })
            initializedRef.current = true
        }

        containerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: containerRef.current.parentElement?.offsetWidth || 400,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, clientId, mode])

    // ── Missing env / config ────────────────────────────────────────────
    if (!clientId) {
        return (
            <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Google sign-in is not configured. Set <code className="font-mono font-semibold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in your environment.
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
            </div>
        )
    }

    const buttonLabel = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'

    return (
        <div className="w-full relative">
            {/* Custom visible button */}
            <div className="w-full h-12 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-3 cursor-pointer transition-all shadow-sm hover:shadow-md group">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{buttonLabel}</span>
            </div>

            {/* Real Google button — invisible overlay captures the click */}
            {!isReady && (
                <div className="absolute inset-0 rounded-xl bg-gray-50 animate-pulse flex items-center justify-center">
                    <span className="text-xs text-gray-400 font-medium">Loading Google Sign-In…</span>
                </div>
            )}
            <div
                ref={containerRef}
                className="absolute inset-0 opacity-0 overflow-hidden [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full"
                style={{ display: isReady ? 'block' : 'none' }}
            />
        </div>
    )
}
