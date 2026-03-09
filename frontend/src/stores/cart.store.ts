import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

export interface CartItem {
    id: string
    product_id: string
    name: string
    slug: string
    price: string
    image_url: string | null
    quantity: number
    variant_id?: string
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
                const { items } = get()
                const existingItem = items.find(
                    (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
                )

                // Optimistic Local State Update
                if (existingItem) {
                    set({
                        items: items.map((i) =>
                            i.id === existingItem.id
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        ),
                        isOpen: true // open drawer on add
                    })
                } else {
                    set({ items: [...items, item], isOpen: true })
                }

                // API Sync (fail softly if guest or error for now)
                try {
                    set({ isLoading: true })
                    await api.post('/cart/add/', {
                        product_id: item.product_id,
                        quantity: item.quantity,
                        variant_id: item.variant_id
                    })
                } catch (error) {
                    console.error('Failed to sync cart add', error)
                    // Could revert optimistic update here in robust prod
                } finally {
                    set({ isLoading: false })
                }
            },

            removeItem: async (id: string) => {
                // Optimistic Local State Update
                set({ items: get().items.filter((i) => i.id !== id) })

                // API Sync
                try {
                    set({ isLoading: true })
                    await api.delete(`/cart/items/${id}/`)
                } catch (error) {
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

                // Optimistic Local Update
                set({
                    items: get().items.map((i) =>
                        i.id === id ? { ...i, quantity } : i
                    ),
                })

                // API Sync
                try {
                    set({ isLoading: true })
                    await api.patch(`/cart/items/${id}/`, { quantity })
                } catch (error) {
                    console.error('Failed to sync cart update', error)
                } finally {
                    set({ isLoading: false })
                }
            },

            clearCart: () => set({ items: [] }),

            getCartTotal: () => {
                return get().items.reduce((total, item) => {
                    const price = parseFloat(item.price)
                    return total + (price * item.quantity)
                }, 0)
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0)
            },

            syncCart: async () => {
                try {
                    set({ isLoading: true })
                    const { data } = await api.get('/cart/')
                    // Map API response to our local state shape
                    // This assumes API returns { items: [...] }
                    if (data && data.items) {
                        set({ items: data.items })
                    }
                } catch (error) {
                    console.error('Failed to fetch cart', error)
                } finally {
                    set({ isLoading: false })
                }
            }
        }),
        {
            name: 'campushat-cart-storage',
            partialize: (state) => ({ items: state.items }), // Only persist items
        }
    )
)
