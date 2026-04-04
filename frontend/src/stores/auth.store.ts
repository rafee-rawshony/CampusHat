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
    full_name: string
    role: UserRole
    university_id: string
    university_name?: string
    profile_picture?: string
    is_email_verified: boolean
    reputation_score?: number
    verification_status: 'not_submitted' | 'pending' | 'approved' | 'rejected' | null
    verification_rejection_reason?: string
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
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: true }),
            setAccessToken: (accessToken) => set({ accessToken }),
            logout: async () => {
                try {
                    await api.post('/auth/logout/')
                } catch {
                    // Even if server call fails, clear local state
                }
                set({ user: null, accessToken: null, isAuthenticated: false })
            },

            isNormalUser: () => get().user?.role === 'normal_user',
            isVerified: () =>
                ['student', 'faculty'].includes(get().user?.role || ''),
            isVerifiedStudent: () =>
                ['student', 'faculty'].includes(get().user?.role || ''),
            isSeller: () => get().user?.role === 'seller',
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
            canAccessMarketplace: () => {
                const role = get().user?.role
                return ['student', 'faculty', 'seller', 'admin', 'moderator', 'seller_mod', 'marketplace_mod'].includes(role || '')
            },
        }),
        {
            name: 'campushat-auth',
            partialize: (state) => ({
                user: state.user ? {
                    id: state.user.id,
                    email: state.user.email,
                    full_name: state.user.full_name,
                    role: state.user.role,
                    university_id: state.user.university_id,
                    university_name: state.user.university_name,
                    profile_picture: state.user.profile_picture,
                    is_email_verified: state.user.is_email_verified,
                    verification_status: state.user.verification_status,
                } : null,
            }),
        }
    )
)
