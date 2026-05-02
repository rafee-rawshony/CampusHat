/**
 * Address service — wrapper around /auth/addresses/ endpoints.
 *
 * Used by the user dashboard (Address Book section) and the checkout
 * flow to read, create, update, and delete delivery addresses.
 */

import { api } from '@/lib/api'

export type AddressLabel = 'home' | 'hostel' | 'office' | 'campus' | 'other'

export interface UserAddress {
    id: string
    label: AddressLabel
    recipient_name?: string | null
    recipient_phone?: string | null
    address_line1: string
    address_line2?: string | null
    landmark?: string | null
    campus_building?: string | null
    room_number?: string | null
    division?: string | null
    district: string
    city: string
    area?: string | null
    postal_code: string
    additional_notes?: string | null
    is_default: boolean
    created_at?: string
    updated_at?: string
}

export type AddressInput = Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>

interface ListEnvelope {
    success: boolean
    message?: string
    data: UserAddress[]
}

interface SingleEnvelope {
    success: boolean
    message?: string
    data: UserAddress
}

/** Fetch all addresses for the authenticated user. */
export async function listAddresses(): Promise<UserAddress[]> {
    const { data } = await api.get<ListEnvelope>('/auth/addresses/')
    return data?.data ?? []
}

/** Create a new address. */
export async function createAddress(payload: Partial<AddressInput>): Promise<UserAddress> {
    const { data } = await api.post<SingleEnvelope>('/auth/addresses/', payload)
    return data.data
}

/** Update an existing address. */
export async function updateAddress(
    id: string,
    payload: Partial<AddressInput>,
): Promise<UserAddress> {
    const { data } = await api.patch<SingleEnvelope>(`/auth/addresses/${id}/`, payload)
    return data.data
}

/** Soft-delete an address. */
export async function deleteAddress(id: string): Promise<void> {
    await api.delete(`/auth/addresses/${id}/`)
}

/** Mark an address as the user's default. */
export async function setDefaultAddress(id: string): Promise<UserAddress> {
    const { data } = await api.post<SingleEnvelope>(`/auth/addresses/${id}/set-default/`)
    return data.data
}
