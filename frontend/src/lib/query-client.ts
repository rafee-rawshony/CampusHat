import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is fresh for 60s — no refetch on remount within that window.
            staleTime: 60 * 1000,
            // Keep cache in memory for 10 min after unmount so back/forward feels instant.
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
})
