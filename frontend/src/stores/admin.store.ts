import { create } from 'zustand'

interface AdminStore {
    permissions: string[]
    pendingCounts: Record<string, number>
    isLoaded: boolean
    setPermissions: (perms: string[]) => void
    setPendingCounts: (counts: Record<string, number>) => void
    hasPermission: (key: string) => boolean
    reset: () => void
}

export const useAdminStore = create<AdminStore>((set, get) => ({
    permissions: [],
    pendingCounts: {},
    isLoaded: false,

    setPermissions: (perms) => set({ permissions: perms, isLoaded: true }),
    setPendingCounts: (counts) => set({ pendingCounts: counts }),

    hasPermission: (key) => {
        const { permissions } = get()
        return permissions.includes('admin') || permissions.includes(key)
    },

    reset: () => set({ permissions: [], pendingCounts: {}, isLoaded: false }),
}))
