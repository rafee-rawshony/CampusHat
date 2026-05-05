/**
 * Stores service — buyer-side actions for following / unfollowing stores
 * and fetching the dashboard "Followed Stores" list.
 */

import { api } from '@/lib/api'

export interface FollowedStore {
    id: string
    slug: string
    store_name: string
    logo_url: string | null
    banner_url: string | null
    description: string
    follower_count: number
    product_count: number
    rating_avg: number
    followed_at: string
}

interface ListEnvelope { success: boolean; data: FollowedStore[] }

/** GET /api/v1/sellers/my/followed-stores/ */
export async function listFollowedStores(): Promise<FollowedStore[]> {
    const { data } = await api.get<ListEnvelope>('/sellers/my/followed-stores/')
    return data.data ?? []
}

/** POST /api/v1/stores/<slug>/follow/ — toggles follow ↔ unfollow. */
export async function toggleStoreFollow(slug: string): Promise<{ is_following: boolean }> {
    const { data } = await api.post<{ success: boolean; data: { is_following: boolean } }>(
        `/stores/${slug}/follow/`,
    )
    return data.data
}
