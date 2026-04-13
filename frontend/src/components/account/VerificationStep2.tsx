'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

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

    const { data: universities, isLoading, isError, refetch } = useQuery<University[]>({
        queryKey: ['verification-universities'],
        queryFn: async () => {
            const res = await api.get('/universities/')
            const items = res.data?.data?.results || res.data?.results || res.data?.data || res.data || []
            return Array.isArray(items) ? items : []
        },
        retry: 1,
    })

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
                        <Select
                            value={data.university_id}
                            onValueChange={(val) => {
                                onUpdate({ university_id: val })
                                setError('')
                            }}
                        >
                            <SelectTrigger className={error ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select your university" />
                            </SelectTrigger>
                            <SelectContent>
                                {universities?.map((uni) => (
                                    <SelectItem key={uni.id} value={uni.id?.toString()}>
                                        {uni.name} {uni.short_code ? `(${uni.short_code})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
