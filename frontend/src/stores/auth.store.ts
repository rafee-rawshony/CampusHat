import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole =
    | 'normal_user'
    | 'student'
    | 'faculty'
    | 'seller'
    | 'moderator'
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
    isSeller: () => boolean
    isModerator: () => boolean
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
            logout: () =>
                set({ user: null, accessToken: null, isAuthenticated: false }),

            isNormalUser: () => get().user?.role === 'normal_user',
            isVerified: () =>
                ['student', 'faculty'].includes(get().user?.role || ''),
            isSeller: () => get().user?.role === 'seller',
            isModerator: () => get().user?.role === 'moderator',
            isAdmin: () => get().user?.role === 'admin',
            canAccessMarketplace: () => {
                const role = get().user?.role
                return ['student', 'faculty', 'seller', 'admin'].includes(role || '')
            },
        }),
        {
            name: 'campushat-auth',
            partialize: (s) => ({ accessToken: s.accessToken }),
        }
    )
)
