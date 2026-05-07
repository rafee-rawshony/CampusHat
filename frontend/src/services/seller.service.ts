/**
 * Seller service — registration / onboarding + dashboard data.
 */

import { api } from '@/lib/api'

// ── Onboarding payload ──────────────────────────────────────────────────

export interface SellerOnboardPayload {
    // Personal (synced back to User)
    full_name: string
    phone: string
    email: string
    gender: 'male' | 'female' | 'other'
    birthday: string  // YYYY-MM-DD
    profile_picture?: string

    // Student verification (optional)
    is_student_seller: boolean
    student_id_card_url?: string

    // Store
    store_name: string
    store_type: 'online' | 'physical' | 'both'
    store_address?: string
    store_phone: string
    store_email: string
    store_description?: string
    store_category?: string
    facebook_page?: string
    logo_url?: string
    banner_url?: string

    // Identity
    identity_doc_type: 'nid' | 'passport'
    document_number: string
    document_image_url: string
    document_back_image_url?: string

    // Payment (optional, at least one recommended)
    mobile_banking_method?: 'bkash' | 'nagad' | 'rocket'
    mobile_banking_number?: string
    bank_account_name?: string
    bank_account_number?: string
    bank_name?: string

    // Agreement
    accepted_terms: boolean
}

export async function onboardSeller(payload: SellerOnboardPayload) {
    const { data } = await api.post('/sellers/onboard/', payload)
    return data
}

// ── My Profile / Dashboard ──────────────────────────────────────────────

export interface SellerProfile {
    id: string
    business_name: string
    business_type: string
    is_student_seller: boolean
    status: 'pending' | 'approved' | 'suspended' | 'rejected'
    commission_rate: string
    business_phone: string
    business_email: string
    created_at: string
}

export async function getMySellerProfile(): Promise<SellerProfile | null> {
    try {
        const { data } = await api.get('/sellers/my-profile/')
        return data?.data ?? null
    } catch {
        return null
    }
}

export interface SellerDashboardStats {
    // Daraz-style KPI numbers — see SellerDashboardSerializer on backend.
    total_products?: number
    active_products?: number
    out_of_stock_products?: number
    low_stock_products?: number
    pending_orders?: number
    completed_orders?: number
    cancelled_orders?: number
    today_orders?: number
    today_revenue?: number
    total_revenue?: number
    average_rating?: number
    review_count?: number
}

export async function getMyDashboard(): Promise<SellerDashboardStats> {
    try {
        const { data } = await api.get('/sellers/my-dashboard/')
        return data?.data ?? {}
    } catch {
        return {}
    }
}
