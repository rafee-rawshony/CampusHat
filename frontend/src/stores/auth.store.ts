import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

export type UserRole =
    | 'normal_user'
    | 'student'
    | 'faculty'
    | 'seller'
    | 'moderator'
    | 'seller_mod'
    | 'marketplace_mod'
    | 'admin'

export interface User {
    id: string
    email: string
    university_email?: string | null
    full_name: string
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    birthday?: string | null
    gender?: 'male' | 'female' | 'other' | null
    role: UserRole
    university_id: string
    university_name?: string
    profile_picture?: string
    is_email_verified: boolean
    is_phone_verified?: boolean
    reputation_score?: number
    verification_status: 'not_submitted' | 'pending' | 'approved' | 'rejected' | null
    verification_rejection_reason?: string
    seller_application_status?: 'pending' | 'approved' | 'rejected' | null
    is_profile_complete?: boolean
    profile_completion_percent?: number
}

interface AuthState {
    user: User | null
    accessToken: string | null
    isAuthenticated: boolean
    setUser: (user: User) => void
    setAccessToken: (token: string) => void
    logout: () => void
    isNormalUser: () => boolean
    isVerified: () => boolean
    isVerifiedStudent: () => boolean
    isSeller: () => boolean
    isModerator: () => boolean
    isSellerModerator: () => boolean
    isMarketplaceModerator: () => boolean
    isAdmin: () => boolean
    canAccessMarketplace: () => boolean
    _hasHydrated: boolean
    setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            
            user: null,
            accessToken: null,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: true }),
            setAccessToken: (accessToken) => {
                // The access token lives in memory (zustand state) only.
                // Route-protection uses the HttpOnly `refresh_token` cookie
                // set by the backend, so we do NOT mirror the access token
                // to a readable cookie here (that would be an XSS target).
                set({ accessToken })
            },
            logout: async () => {
                try {
                    await api.post('/auth/logout/')
                } catch {
                    // Even if server call fails, clear local state
                }
                set({ user: null, accessToken: null, isAuthenticated: false })
                if (typeof window !== 'undefined') {
                    // Clear both new and any legacy cookies
                    document.cookie = 'campushat-access-token=; path=/; max-age=0;'
                    document.cookie = 'campushat-auth=; path=/; max-age=0;'
                }
            },

            isNormalUser: () => get().user?.role === 'normal_user',
            isVerified: () =>
                ['student', 'faculty'].includes(get().user?.role || ''),
            // True if user has an approved student/faculty verification (regardless of current role)
            isVerifiedStudent: () => get().user?.verification_status === 'approved',
            // Backend never changes role to 'seller' on approval — it sets SellerProfile.status.
            // So we check seller_application_status, not role.
            isSeller: () => get().user?.seller_application_status === 'approved',
            isModerator: () => {
                const role = get().user?.role
                return ['moderator', 'seller_mod', 'marketplace_mod'].includes(role || '')
            },
            isSellerModerator: () => {
                const role = get().user?.role
                return role === 'seller_mod' || role === 'moderator'
            },
            isMarketplaceModerator: () => {
                const role = get().user?.role
                return role === 'marketplace_mod' || role === 'moderator'
            },
            isAdmin: () => get().user?.role === 'admin',
            // Marketplace access rule:
            // - Admin / mods: always
            // - Anyone else (student, faculty, seller, normal_user):
            //   only if they have an approved student/faculty verification
            // This means: a student who becomes a mall seller keeps marketplace access
            // because their approved verification record stays in the DB.
            canAccessMarketplace: () => {
                const user = get().user
                const role = user?.role
                if (!role) return false
                if (['admin', 'moderator', 'seller_mod', 'marketplace_mod'].includes(role)) return true
                return user?.verification_status === 'approved'
            },
        }),
        {
            name: 'campushat-auth',
            partialize: (state) => ({
                // accessToken is EXCLUDED — lives in Zustand memory only (XSS safe)
                // Backend uses HttpOnly refresh_token cookie for session persistence
                user: state.user ? {
                    id: state.user.id,
                    email: state.user.email,
                    university_email: state.user.university_email,
                    full_name: state.user.full_name,
                    first_name: state.user.first_name,
                    last_name: state.user.last_name,
                    phone: state.user.phone,
                    birthday: state.user.birthday,
                    gender: state.user.gender,
                    role: state.user.role,
                    university_id: state.user.university_id,
                    university_name: state.user.university_name,
                    profile_picture: state.user.profile_picture,
                    is_email_verified: state.user.is_email_verified,
                    is_phone_verified: state.user.is_phone_verified,
                    verification_status: state.user.verification_status,
                    verification_rejection_reason: state.user.verification_rejection_reason,
                    seller_application_status: state.user.seller_application_status,
                    is_profile_complete: state.user.is_profile_complete,
                    profile_completion_percent: state.user.profile_completion_percent,
                } : null,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // If user is in storage, ensure isAuthenticated is true
                    if (state.user && !state.isAuthenticated) {
                        state.isAuthenticated = true
                    }
                    state.setHasHydrated(true)
                }
            }
        }
    )
)
