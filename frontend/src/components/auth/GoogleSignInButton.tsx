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

        // Clear any previous render before re-rendering the button
        containerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: containerRef.current.offsetWidth || 360,
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

    // ── Loading skeleton — matches the size of the real button ─────────
    return (
        <div className="w-full">
            {!isReady && (
                <div className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 animate-pulse flex items-center justify-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">Loading Google Sign-In…</span>
                </div>
            )}
            <div
                ref={containerRef}
                className="w-full flex justify-center [&>div]:w-full [&_iframe]:!w-full"
                style={{ display: isReady ? 'flex' : 'none' }}
            />
        </div>
    )
}
