/**
 * Auth service — single source of truth for all auth API calls.
 *
 * Components should call these functions instead of writing api.post('/auth/...')
 * inline. Keeps endpoint URLs in one place and gives TypeScript types to every call.
 */

import { api } from '@/lib/api'
import type { User } from '@/stores/auth.store'

// ── Request payload types ──────────────────────────────────────────────

export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    email: string
    password: string
    full_name: string
    phone?: string
    university_id?: string
}

export interface OTPSendPayload {
    identifier: string // email or phone
}

export interface OTPVerifyPayload {
    identifier: string
    otp: string
}

// ── Response shapes (what the backend actually returns) ────────────────

export interface AuthSuccessData {
    access_token: string
    user: User
}

interface ApiEnvelope<T> {
    success: boolean
    message?: string
    data?: T
}

// Helper — backend wraps payloads in { success, data } but some older
// endpoints return the data at the top level. Handle both.
function unwrap<T>(raw: ApiEnvelope<T> | T): T {
    if (raw && typeof raw === 'object' && 'data' in (raw as ApiEnvelope<T>)) {
        const envelope = raw as ApiEnvelope<T>
        if (envelope.data !== undefined) return envelope.data
    }
    return raw as T
}

// ── API calls ──────────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<AuthSuccessData> {
    const { data } = await api.post('/auth/login/', payload)
    return unwrap<AuthSuccessData>(data)
}

export async function register(payload: RegisterPayload): Promise<void> {
    await api.post('/auth/register/', payload)
}

export async function logout(): Promise<void> {
    await api.post('/auth/logout/')
}

export async function resendVerification(email: string): Promise<void> {
    await api.post('/auth/resend-verification/', { email })
}

export async function sendOtp(payload: OTPSendPayload): Promise<void> {
    await api.post('/auth/otp/send/', payload)
}

export async function verifyOtp(payload: OTPVerifyPayload): Promise<AuthSuccessData> {
    const { data } = await api.post('/auth/otp/verify/', payload)
    return unwrap<AuthSuccessData>(data)
}

export async function getMe(): Promise<User> {
    const { data } = await api.get('/auth/me/')
    return unwrap<User>(data)
}

export async function forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password/', { email })
}

export interface ResetPasswordPayload {
    email: string
    otp: string
    new_password: string
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await api.post('/auth/reset-password/', payload)
}
