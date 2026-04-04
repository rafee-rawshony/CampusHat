import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Response interceptor — refresh on 401
let isRefreshing = false
let failedQueue: Array<{
    resolve: (value?: unknown) => void
    reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config
        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        original.headers.Authorization = `Bearer ${token}`
                        return api(original)
                    })
                    .catch((err) => Promise.reject(err))
            }

            original._retry = true
            isRefreshing = true

            try {
                const { data } = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/token/refresh/`,
                    {},
                    { withCredentials: true }
                )
                const newToken = data.data?.access_token || data.access_token || data.access
                useAuthStore.getState().setAccessToken(newToken)
                original.headers.Authorization = `Bearer ${newToken}`
                processQueue(null, newToken)
                return api(original)
            } catch (refreshError) {
                processQueue(refreshError, null)
                useAuthStore.getState().logout()
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('session_expired', '1')
                    window.location.href = '/auth/login'
                }
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
        return Promise.reject(error)
    }
)
