import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import { AppRouter } from '@/router'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import '@/index.css'

function AppInit({ children }: { children: React.ReactNode }) {
  const { user, accessToken, setAccessToken, logout } = useAuthStore()
  React.useEffect(() => {
    // Silently refresh token on app load if user persisted but no token in memory
    if (user && !accessToken) {
      api.post('/auth/token/refresh/')
        .then(r => setAccessToken(r.data.data.access_token))
        .catch(() => logout())
    }
    // Session expired toast
    if (sessionStorage.getItem('session_expired')) {
      sessionStorage.removeItem('session_expired')
      import('react-hot-toast').then(t => t.default.error('Session expired. Please sign in again.'))
    }
  }, [])
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AppInit><AppRouter /></AppInit>
        <Toaster position="top-center" toastOptions={{
          style: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' },
        }} />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
)
