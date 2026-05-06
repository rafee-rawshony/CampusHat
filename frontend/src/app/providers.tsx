'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/query-client'
import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const store = useAuthStore.getState()
        // If we have user info but no access token (page reload),
        // silently refresh to get a new access token
        if (store.user && !store.accessToken) {
            api.post('/auth/token/refresh/')
                .then(res => {
                    store.setAccessToken(res.data.data?.access_token || res.data.access_token)
                    // Fetch latest user data to sync role and verification status
                    api.get('/auth/me/').then(userRes => {
                        store.setUser(userRes.data.data || userRes.data)
                    }).catch(() => {})
                })
                .catch(() => {
                    // Refresh failed - user needs to login again
                    store.logout()
                })
        }
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            borderRadius: '8px',
                            background: '#1A1A2E',
                            color: '#fff',
                            fontSize: '14px',
                        },
                    }}
                />
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
