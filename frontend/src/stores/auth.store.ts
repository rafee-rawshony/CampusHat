import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

export type UserRole = 'normal_user'|'student'|'faculty'|'seller'|'seller_mod'|'marketplace_mod'|'moderator'|'admin'

export interface User {
  id: string; 
  email: string; 
  full_name: string; 
  role: UserRole;
  university_id: string; 
  university_name?: string;
  profile_picture?: string; 
  is_email_verified: boolean;
  verification_status: 'not_submitted'|'pending'|'approved'|'rejected'|null;
  seller_application_status?: 'pending'|'approved'|'rejected'|null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => Promise<void>;
  isNormalUser: () => boolean;
  isVerified: () => boolean;
  isSeller: () => boolean;
  isModerator: () => boolean;
  isSellerModerator: () => boolean;
  isMarketplaceModerator: () => boolean;
  isAdmin: () => boolean;
  canAccessMarketplace: () => boolean;
}

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null, 
    accessToken: null, 
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: true }),
    setAccessToken: (accessToken) => set({ accessToken }),
    logout: async () => {
      try { await api.post('/auth/logout/') } catch {}
      set({ user: null, accessToken: null, isAuthenticated: false })
    },
    isNormalUser: () => get().user?.role === 'normal_user',
    isVerified: () => ['student','faculty'].includes(get().user?.role||''),
    isSeller: () => get().user?.role === 'seller',
    isModerator: () => ['moderator','seller_mod','marketplace_mod'].includes(get().user?.role||''),
    isSellerModerator: () => ['seller_mod','moderator'].includes(get().user?.role||''),
    isMarketplaceModerator: () => ['marketplace_mod','moderator'].includes(get().user?.role||''),
    isAdmin: () => get().user?.role === 'admin',
    canAccessMarketplace: () => {
      const r = get().user?.role
      return ['student','faculty','seller','admin','moderator','seller_mod','marketplace_mod'].includes(r||'')
    },
  }),
  {
    name: 'campushat-auth',
    partialize: (s) => ({
      user: s.user ? { 
        id: s.user.id, 
        email: s.user.email, 
        full_name: s.user.full_name,
        role: s.user.role, 
        university_id: s.user.university_id,
        verification_status: s.user.verification_status,
        seller_application_status: s.user.seller_application_status 
      } : null
    })
  }
))
