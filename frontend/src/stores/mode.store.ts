import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppMode = 'mall' | 'marketplace'

interface ModeState {
    mode: AppMode
    setMode: (mode: AppMode) => void
}

export const useModeStore = create<ModeState>()(
    persist(
        (set) => ({
            mode: 'mall', // Default to mall
            setMode: (mode) => set({ mode }),
        }),
        {
            name: 'campushat-mode-store',
        }
    )
)
