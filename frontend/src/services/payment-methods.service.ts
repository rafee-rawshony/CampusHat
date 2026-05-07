/**
 * User Payment Methods service.
 *
 * Wraps /wallet/payment-methods/ — saved bKash / Nagad / card accounts
 * the user can pick from at checkout.
 */

import { api } from '@/lib/api'

export type PaymentMethodType =
    | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'tap' | 'card' | 'bank'

export interface UserPaymentMethod {
    id: string
    method: PaymentMethodType
    method_display: string
    label: string
    account_holder_name: string
    account_number: string
    masked_account: string
    card_last4?: string
    card_brand?: string
    card_expiry?: string
    is_default: boolean
    created_at?: string
    updated_at?: string
}

// Input for create / update — every field optional except method + account_number
export interface PaymentMethodInput {
    method: PaymentMethodType
    label?: string
    account_holder_name?: string
    account_number: string
    card_last4?: string
    card_brand?: string
    card_expiry?: string
    is_default?: boolean
}

interface ListEnvelope { success: boolean; data: UserPaymentMethod[] }
interface SingleEnvelope { success: boolean; data: UserPaymentMethod }

export async function listPaymentMethods(): Promise<UserPaymentMethod[]> {
    const { data } = await api.get<ListEnvelope>('/wallet/payment-methods/')
    return data.data ?? []
}

export async function createPaymentMethod(payload: PaymentMethodInput): Promise<UserPaymentMethod> {
    const { data } = await api.post<SingleEnvelope>('/wallet/payment-methods/', payload)
    return data.data
}

export async function updatePaymentMethod(
    id: string, payload: Partial<PaymentMethodInput>,
): Promise<UserPaymentMethod> {
    const { data } = await api.patch<SingleEnvelope>(`/wallet/payment-methods/${id}/`, payload)
    return data.data
}

export async function deletePaymentMethod(id: string): Promise<void> {
    await api.delete(`/wallet/payment-methods/${id}/`)
}

export async function setDefaultPaymentMethod(id: string): Promise<UserPaymentMethod> {
    const { data } = await api.post<SingleEnvelope>(`/wallet/payment-methods/${id}/set-default/`)
    return data.data
}
