import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ModeState {
  mode: 'mall' | 'marketplace'
  setMode: (mode: 'mall' | 'marketplace') => void
  toggleMode: () => void
}

export const useModeStore = create<ModeState>()(persist(
  (set) => ({
    mode: 'mall',
    setMode: (mode) => set({ mode }),
    toggleMode: () => set((state) => ({ mode: state.mode === 'mall' ? 'marketplace' : 'mall' })),
  }),
  { name: 'campushat-mode' }
))
