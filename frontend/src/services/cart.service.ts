/**
 * Cart service — all cart API calls.
 *
 * The cart store (zustand) uses these functions so URLs and payloads
 * live in exactly one place.
 */

import { api } from '@/lib/api'

export interface CartAddPayload {
    product_id: string
    quantity: number
    variant_id?: string
}

// GET /api/v1/cart/  → raw cart payload from backend
export async function fetchCart() {
    const { data } = await api.get('/cart/')
    return data
}

// POST /api/v1/cart/add/
export async function addCartItem(payload: CartAddPayload) {
    const { data } = await api.post('/cart/add/', payload)
    return data
}

// PATCH /api/v1/cart/update/<item_id>/
export async function updateCartItem(itemId: string, quantity: number) {
    const { data } = await api.patch(`/cart/update/${itemId}/`, { quantity })
    return data
}

// DELETE /api/v1/cart/remove/<item_id>/
export async function removeCartItem(itemId: string) {
    await api.delete(`/cart/remove/${itemId}/`)
}

// POST /api/v1/cart/clear/
export async function clearCart() {
    await api.post('/cart/clear/')
}
