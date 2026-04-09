import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface PaginatedEnvelope<T> {
    results?: T[]
    count?: number
    total_pages?: number
    current_page?: number
}

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

export const unwrapApiData = <T>(payload: unknown, fallback: T): T => {
    if (isObject(payload) && 'data' in payload) {
        const maybeData = payload.data as T | undefined
        return maybeData ?? fallback
    }

    if (payload === undefined || payload === null) return fallback
    return payload as T
}

export const extractArray = <T>(payload: unknown): T[] => {
    const unwrapped = unwrapApiData<unknown>(payload, null)

    if (Array.isArray(unwrapped)) {
        return unwrapped as T[]
    }

    if (isObject(unwrapped)) {
        const paginated = unwrapped as PaginatedEnvelope<T>
        if (Array.isArray(paginated.results)) return paginated.results

        const nestedData = unwrapped.data
        if (Array.isArray(nestedData)) return nestedData as T[]
    }

    return []
}

export interface PaginatedResult<T> {
    items: T[]
    count: number
    totalPages: number
    currentPage: number
}

export const extractPaginatedArray = <T>(payload: unknown): PaginatedResult<T> => {
    const unwrapped = unwrapApiData<unknown>(payload, null)

    if (Array.isArray(unwrapped)) {
        return {
            items: unwrapped as T[],
            count: unwrapped.length,
            totalPages: 1,
            currentPage: 1,
        }
    }

    if (isObject(unwrapped)) {
        const paginated = unwrapped as PaginatedEnvelope<T>
        const items = Array.isArray(paginated.results) ? paginated.results : []
        return {
            items,
            count: Number(paginated.count ?? items.length),
            totalPages: Number(paginated.total_pages ?? 1),
            currentPage: Number(paginated.current_page ?? 1),
        }
    }

    return {
        items: [],
        count: 0,
        totalPages: 1,
        currentPage: 1,
    }
}

export const api = axios.create({
    baseURL: API_BASE_URL,
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
interface FailedQueueItem {
    // eslint-disable-next-line no-unused-vars
    resolve(value?: unknown): void
    // eslint-disable-next-line no-unused-vars
    reject(reason?: unknown): void
}

let failedQueue: FailedQueueItem[] = []

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
                    `${API_BASE_URL}/auth/token/refresh/`,
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
