import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CampusState {
    selectedCampusId: string | null
    selectedCampusName: string | null
    setCampus: (id: string | null, name: string | null) => void
    clearCampus: () => void
}

export const useCampusStore = create<CampusState>()(
    persist(
        (set) => ({
            selectedCampusId: null,
            selectedCampusName: null,
            setCampus: (id, name) => set({ selectedCampusId: id, selectedCampusName: name }),
            clearCampus: () => set({ selectedCampusId: null, selectedCampusName: null }),
        }),
        {
            name: 'campushat-campus-storage',
        }
    )
)
