/**
 * Reviews service — for the dashboard "My Reviews" section.
 *
 * Wraps /mall/reviews/my/ — list, edit, delete the user's own reviews.
 */

import { api } from '@/lib/api'

export interface MyReview {
    id: string
    product_id: string
    product_slug: string
    product_name: string
    product_image_url: string | null
    store_name: string
    rating: number
    comment: string
    seller_response: string | null
    is_visible: boolean
    created_at: string
    updated_at: string
}

interface ListEnvelope { success: boolean; data: MyReview[] }

export async function listMyReviews(): Promise<MyReview[]> {
    const { data } = await api.get<ListEnvelope>('/mall/reviews/my/')
    return data.data ?? []
}

export async function updateMyReview(
    id: string,
    payload: { rating?: number; comment?: string },
): Promise<void> {
    await api.patch(`/mall/reviews/my/${id}/`, payload)
}

export async function deleteMyReview(id: string): Promise<void> {
    await api.delete(`/mall/reviews/my/${id}/`)
}
