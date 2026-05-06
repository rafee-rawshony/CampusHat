'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ChevronDown, Check } from 'lucide-react'

interface University {
    id: string
    name: string
    short_code?: string
}

interface Step2Data {
    university_id: string
}

interface VerificationStep2Props {
    data: Step2Data
    onUpdate: (data: Partial<Step2Data>) => void
    onNext: () => void
    onBack: () => void
}

export function VerificationStep2({ data, onUpdate, onNext, onBack }: VerificationStep2Props) {
    const [error, setError] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    const { data: universities, isLoading, isError, refetch } = useQuery<University[]>({
        queryKey: ['verification-universities'],
        queryFn: async () => {
            const res = await api.get('/universities/?page_size=1000')
            const items = res.data?.data?.results || res.data?.results || res.data?.data || res.data || []
            return Array.isArray(items) ? items : []
        },
        retry: 1,
    })

    const filteredUniversities = useMemo(() => {
        if (!universities) return []
        if (!searchQuery.trim()) return universities
        const q = searchQuery.toLowerCase()
        return universities.filter(u => 
            u.name.toLowerCase().includes(q) || 
            (u.short_code && u.short_code.toLowerCase().includes(q))
        )
    }, [universities, searchQuery])

    const handleNext = () => {
        if (!data.university_id) {
            setError('Please select your campus to proceed.')
            return
        }
        setError('')
        onNext()
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="font-semibold text-gray-800 text-lg mb-6">Select Your Campus</h2>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Campus Name <span className="text-red-500">*</span></Label>
                    
                    {isLoading ? (
                        <Skeleton className="h-10 w-full" />
                    ) : isError ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex justify-between items-center">
                            Could not load universities. 
                            <button onClick={() => refetch()} className="font-bold hover:underline">Retry</button>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                className={`flex h-11 w-full items-center justify-between rounded-xl border bg-gray-50/80 px-4 py-2.5 text-sm outline-none transition-all ${error ? 'border-red-500 ring-2 ring-red-500/15' : 'border-gray-200 focus:border-[#4C3B8A] focus:ring-2 focus:ring-[#4C3B8A]/15 focus:bg-white'}`}
                            >
                                <span className="truncate pr-4">
                                    {universities?.find(u => u.id?.toString() === data.university_id)?.name || "Select your university"}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </button>
                            
                            {isOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                                    <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50/30">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Search campus..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#4C3B8A] focus:ring-1 focus:ring-[#4C3B8A] bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[280px] overflow-y-auto p-1.5">
                                            {filteredUniversities.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">No campuses found</div>
                                            ) : (
                                                filteredUniversities.map((uni) => (
                                                    <button
                                                        key={uni.id}
                                                        type="button"
                                                        onClick={() => {
                                                            onUpdate({ university_id: uni.id?.toString() })
                                                            setError('')
                                                            setIsOpen(false)
                                                            setSearchQuery('')
                                                        }}
                                                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg outline-none flex items-center justify-between transition-colors ${data.university_id === uni.id?.toString() ? 'bg-purple-50 text-[#4C3B8A] font-medium' : 'hover:bg-gray-50 focus:bg-gray-50 text-gray-700'}`}
                                                    >
                                                        <span className="truncate pr-4">{uni.name} {uni.short_code ? `(${uni.short_code})` : ''}</span>
                                                        {data.university_id === uni.id?.toString() && <Check className="h-4 w-4 text-[#4C3B8A] shrink-0" />}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
                    <p className="text-sm text-gray-400 mt-1">
                        This helps us show your listings to the right campus community.
                    </p>
                    
                    {error && (
                        <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}
                </div>

                <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-100">
                    <button
                        onClick={onBack}
                        className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        &larr; Back
                    </button>
                    <button
                        onClick={handleNext}
                        className="bg-[#4C3B8A] hover:bg-[#38266e] text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || isError}
                    >
                        Next Step &rarr;
                    </button>
                </div>
            </div>
        </div>
    )
}
