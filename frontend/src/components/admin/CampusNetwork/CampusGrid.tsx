'use client'

import { Building2 } from 'lucide-react'
import CampusCard, { CampusType } from './CampusCard'
import { Button } from '@/components/ui/button'

interface CampusGridProps {
    campuses: CampusType[]
    isLoading: boolean
    searchTerm: string
    onEdit: (campus: CampusType) => void
    onAdd: () => void
}

export default function CampusGrid({ campuses, isLoading, searchTerm, onEdit, onAdd }: CampusGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="bg-white border border-gray-100 rounded-xl p-5 h-[160px] animate-pulse">
                        <div className="flex justify-between">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                            <div className="w-16 h-6 bg-gray-100 rounded-full" />
                        </div>
                        <div className="mt-4 w-3/4 h-5 bg-gray-200 rounded" />
                        <div className="mt-2 w-1/3 h-3 bg-gray-100 rounded" />
                        <div className="mt-6 flex justify-between">
                            <div className="w-20 h-4 bg-gray-100 rounded" />
                            <div className="w-12 h-4 bg-gray-200 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (campuses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-xl text-center">
                <Building2 className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">
                    {searchTerm ? `No results for "${searchTerm}"` : "No universities added yet."}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">
                    {searchTerm ? "Try adjusting your filters or search term." : "Add the first university to start building your campus network."}
                </p>
                {!searchTerm && (
                    <Button onClick={onAdd} className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white">
                        + Add University
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campuses.map(campus => (
                <CampusCard 
                    key={campus.id} 
                    campus={campus} 
                    onEdit={onEdit} 
                />
            ))}
        </div>
    )
}
