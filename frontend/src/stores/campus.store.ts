import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CampusState {
  selectedCampus: string
  setCampus: (campus: string) => void
}

export const useCampusStore = create<CampusState>()(persist(
  (set) => ({
    selectedCampus: 'All Campuses',
    setCampus: (campus) => set({ selectedCampus: campus }),
  }),
  { name: 'campushat-campus' }
))
