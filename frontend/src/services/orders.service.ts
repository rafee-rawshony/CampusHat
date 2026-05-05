/**
 * Orders service — checkout and buyer-side order API calls.
 */

import { api } from '@/lib/api'

export interface CheckoutPayload {
    address_id: string
    payment_method: 'cod' | 'wallet' | 'card'
    coupon_code?: string
    notes?: string
}

// POST /api/v1/orders/checkout/
export async function checkout(payload: CheckoutPayload) {
    const { data } = await api.post('/orders/checkout/', payload)
    return data
}

// Daraz-style status tabs map to these backend filters.
export type OrderStatusTab =
    | 'all' | 'to_pay' | 'to_ship' | 'to_receive'
    | 'completed' | 'cancelled' | 'refunded'

// GET /api/v1/orders/
export async function listMyOrders(params?: Record<string, string | number>) {
    const { data } = await api.get('/orders/', { params })
    return data
}

// GET /api/v1/orders/<order_id>/
export async function getOrder(orderId: string) {
    const { data } = await api.get(`/orders/${orderId}/`)
    return data
}

// POST /api/v1/orders/<order_id>/cancel/
export async function cancelOrder(orderId: string, reason?: string) {
    const { data } = await api.post(`/orders/${orderId}/cancel/`, { reason })
    return data
}

// GET /api/v1/orders/<order_id>/tracking/
export async function getOrderTracking(orderId: string) {
    const { data } = await api.get(`/orders/${orderId}/tracking/`)
    return data
}
