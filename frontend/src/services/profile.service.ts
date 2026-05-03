/**
 * Profile service — wrapper around /auth/me/* endpoints.
 *
 * Used by the user dashboard (My Profile section) to read and update
 * the authenticated user's identity fields.
 */

import { api } from '@/lib/api'
import type { User } from '@/stores/auth.store'

// Update payload — every field is optional; only what the user changed is sent.
export interface ProfileUpdatePayload {
    first_name?: string
    last_name?: string
    full_name?: string
    phone?: string | null
    birthday?: string | null    // YYYY-MM-DD
    gender?: 'male' | 'female' | 'other' | null
    profile_picture?: string | null
    university_email?: string | null
}

interface ApiEnvelope<T> {
    success?: boolean
    message?: string
    data?: T
}

/**
 * Fetch the latest user profile from the backend.
 * MeView returns the serialized user object directly (no envelope).
 */
export async function fetchMe(): Promise<User> {
    const { data } = await api.get<User | ApiEnvelope<User>>('/auth/me/')
    if (data && typeof data === 'object' && 'data' in data && data.data) {
        return data.data as User
    }
    return data as User
}

/**
 * Update the authenticated user's profile.
 * MeUpdateView returns { success, message, data: <user> }.
 */
export async function updateMe(
    payload: ProfileUpdatePayload,
): Promise<User> {
    const { data } = await api.patch<ApiEnvelope<User>>('/auth/me/update/', payload)
    return data.data as User
}

/**
 * Start an email-change flow. Sends a confirmation link to `new_email`.
 * The user must click that link before the change takes effect.
 */
export async function requestEmailChange(payload: {
    new_email: string
    current_password: string
}): Promise<{ message: string }> {
    const { data } = await api.post('/auth/me/email/request-change/', payload)
    return data
}

/**
 * Apply the email change after the user clicks the confirmation link.
 * Used by the /auth/confirm-email-change page.
 */
export async function confirmEmailChange(token: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/me/email/confirm-change/', { token })
    return data
}
