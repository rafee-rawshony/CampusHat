'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Register page — redirects to the unified auth page at /auth/login?tab=register.
 * Both login and register forms live in one component to prevent layout shift
 * when switching between tabs.
 */
export default function RegisterPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/auth/login?tab=register')
    }, [router])

    return null
}
