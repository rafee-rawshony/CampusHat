/**
 * Upload service — wraps the universal /uploads/ backend endpoint.
 *
 * Posts a multipart form with the file + a category, and returns the
 * URL we can save on whichever model needs it.
 */

import { api } from '@/lib/api'

export type UploadCategory =
    | 'avatar' | 'product' | 'store_logo' | 'store_banner'
    | 'banner' | 'review' | 'generic'

export interface UploadResponse {
    url: string
    path: string
    category: UploadCategory
    size: number
    content_type: string
}

interface ApiEnvelope<T> {
    success: boolean
    message?: string
    data: T
}

/**
 * Upload an image file. Returns the public URL.
 *
 * For local dev that URL is /media/... (served by Django when DEBUG=True)
 * — combine with the backend origin if you need an absolute URL on the client.
 */
export async function uploadImage(
    file: File,
    category: UploadCategory = 'generic',
    onProgress?: (percent: number) => void,
): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    const { data } = await api.post<ApiEnvelope<UploadResponse>>(
        '/uploads/',
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (!onProgress || !e.total) return
                onProgress(Math.round((e.loaded / e.total) * 100))
            },
        },
    )
    return data.data
}

/**
 * Build an absolute URL from a path returned by the backend.
 *
 * Local dev: /media/uploads/... → http://localhost:8000/media/uploads/...
 * Prod (S3): the backend already returns an absolute https://... URL —
 * this helper passes it through untouched.
 */
export function absoluteMediaUrl(url: string | null | undefined): string {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
    // Strip trailing /api/v1 to get the bare origin.
    const origin = apiBase.replace(/\/api\/v\d+\/?$/, '')
    return origin + (url.startsWith('/') ? url : '/' + url)
}
