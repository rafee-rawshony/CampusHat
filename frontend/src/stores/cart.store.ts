import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    addCartItem,
    fetchCart,
    removeCartItem,
    updateCartItem,
} from '@/services/cart.service'

export interface CartItem {
    id: string
    product_id?: string
    product?: string // backend product ID
    product_name?: string // from backend
    name?: string // fallback fallback
    slug?: string
    product_slug?: string // from backend
    price?: string
    unit_price_snapshot?: string // from backend
    image_url?: string
    primary_image_url?: string // from backend
    quantity: number
    variant_id?: string
    variant?: string // backend variant ID
    variant_name?: string
    variant_info?: Record<string, string>
}

interface CartState {
    items: CartItem[]
    isOpen: boolean
    isLoading: boolean

    // UI Actions
    setIsOpen: (isOpen: boolean) => void

    // Core Actions
    addItem: (item: CartItem) => Promise<void>
    removeItem: (id: string) => Promise<void>
    updateQuantity: (id: string, quantity: number) => Promise<void>
    clearCart: () => void

    // Computed (zustand state getter pattern)
    getCartTotal: () => number
    getItemCount: () => number
    syncCart: () => Promise<void>
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            isLoading: false,

            setIsOpen: (isOpen: boolean) => set({ isOpen }),

            addItem: async (item: CartItem) => {
                const previousItems = get().items
                set({ items: [...previousItems, item], isOpen: true })

                try {
                    const productId = item.product_id || item.product
                    if (!productId) {
                        throw new Error('Missing product id')
                    }

                    set({ isLoading: true })
                    await addCartItem({
                        product_id: productId,
                        quantity: item.quantity,
                        variant_id: item.variant_id,
                    })
                    // Sync to get real CartItem UUIDs from backend so removeItem works correctly
                    await get().syncCart()
                } catch (error) {
                    set({ items: previousItems })
                    console.error('Failed to sync cart add', error)
                } finally {
                    set({ isLoading: false })
                }
            },

            removeItem: async (id: string) => {
                const previousItems = get().items
                set({ items: previousItems.filter((i) => i.id !== id) })

                try {
                    set({ isLoading: true })
                    await removeCartItem(id)
                } catch (error: any) {
                    // Don't rollback for unauthenticated users (401) — their cart is local-only
                    // and the removal should persist. Only rollback on real server errors.
                    if (error?.response?.status !== 401) {
                        set({ items: previousItems })
                    }
                    console.error('Failed to sync cart remove', error)
                } finally {
                    set({ isLoading: false })
                }
            },

            updateQuantity: async (id: string, quantity: number) => {
                if (quantity <= 0) {
                    get().removeItem(id)
                    return
                }

                const previousItems = get().items
                set({
                    items: previousItems.map((i) =>
                        i.id === id ? { ...i, quantity } : i
                    ),
                })

                try {
                    set({ isLoading: true })
                    await updateCartItem(id, quantity)
                } catch (error) {
                    set({ items: previousItems })
                    console.error('Failed to sync cart update', error)
                } finally {
                    set({ isLoading: false })
                }
            },

            clearCart: () => set({ items: [] }),

            getCartTotal: () => {
                return get().items.reduce((total, item) => {
                    const price = Number(item.unit_price_snapshot || item.price || 0)
                    return total + (price * item.quantity)
                }, 0)
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0)
            },

            syncCart: async () => {
                // CRITICAL: Always fetch fresh cart data from backend.
                // Frontend localStorage has product data (prices, names) that users could tamper with.
                // Backend is the source of truth for all sensitive data (prices, stock, availability).
                try {
                    set({ isLoading: true })
                    const data = await fetchCart()
                    // Map API response to our local state shape
                    // Backend returns { items: [...] } or sometimes { data: { items: [...] } }
                    const items = data?.items || data?.data?.items
                    if (items && Array.isArray(items)) {
                        set({ items })
                    }
                } catch (error) {
                    console.error('Failed to fetch cart from backend', error)
                } finally {
                    set({ isLoading: false })
                }
            }
        }),
        {
            name: 'campushat-cart-storage',
            partialize: (state: CartState) => ({ items: state.items }),
        }
    )
)
