import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import { useAuthStore } from './auth.store'

interface WishlistState {
    wishlistIds: string[]
    isLoading: boolean
    toggleWishlist: (productId: string) => Promise<void>
    fetchWishlist: () => Promise<void>
    isWishlisted: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            wishlistIds: [],
            isLoading: false,

            isWishlisted: (productId: string) => {
                return get().wishlistIds.includes(productId)
            },

            toggleWishlist: async (productId: string) => {
                const { isAuthenticated } = useAuthStore.getState()
                if (!isAuthenticated) return

                const current = get().wishlistIds
                const isCurrentlyWishlisted = current.includes(productId)

                // Optimistic update
                if (isCurrentlyWishlisted) {
                    set({ wishlistIds: current.filter(id => id !== productId) })
                } else {
                    set({ wishlistIds: [...current, productId] })
                }

                try {
                    await api.post(`/mall/products/${productId}/wishlist/`)
                } catch {
                    // Revert on error
                    if (isCurrentlyWishlisted) {
                        set({ wishlistIds: [...get().wishlistIds, productId] })
                    } else {
                        set({ wishlistIds: get().wishlistIds.filter(id => id !== productId) })
                    }
                }
            },

            fetchWishlist: async () => {
                const { isAuthenticated } = useAuthStore.getState()
                if (!isAuthenticated) return

                try {
                    set({ isLoading: true })
                    const { data } = await api.get('/wishlist/')
                    const ids = (data?.data?.results || data?.results || data || [])
                        .map((item: any) => item.product_id || item.product?.id || item.id)
                        .filter(Boolean)
                    set({ wishlistIds: ids })
                } catch {
                    // silently fail
                } finally {
                    set({ isLoading: false })
                }
            },
        }),
        {
            name: 'campushat-wishlist',
            partialize: (state) => ({ wishlistIds: state.wishlistIds }),
        }
    )
)
