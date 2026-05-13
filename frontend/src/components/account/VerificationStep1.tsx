'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Step1Data {
    student_id_number: string
    university_email: string
}

interface VerificationStep1Props {
    data: Step1Data
    onUpdate: (data: Partial<Step1Data>) => void
    onNext: () => void
}

export function VerificationStep1({ data, onUpdate, onNext }: VerificationStep1Props) {
    const [errors, setErrors] = useState<{ student_id_number?: string; university_email?: string }>({})

    const handleNext = () => {
        const newErrors: { student_id_number?: string; university_email?: string } = {}

        if (!data.student_id_number.trim()) {
            newErrors.student_id_number = 'Student ID is required.'
        }

        if (data.university_email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(data.university_email.trim())) {
                newErrors.university_email = 'Please enter a valid email address.'
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setErrors({})
        onNext()
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="font-semibold text-gray-800 text-lg mb-6">Academic Details</h2>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="student_id_number" className="font-semibold text-gray-700">
                        Student ID Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="student_id_number"
                        placeholder="e.g. 222-12-1234"
                        value={data.student_id_number}
                        onChange={(e) => onUpdate({ student_id_number: e.target.value })}
                        className={errors.student_id_number ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.student_id_number && (
                        <p className="text-sm text-red-500 mt-1">{errors.student_id_number}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="university_email" className="font-semibold text-gray-700">
                        University Email <span className="text-gray-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                        id="university_email"
                        type="email"
                        placeholder="yourname@university.edu.bd"
                        value={data.university_email}
                        onChange={(e) => onUpdate({ university_email: e.target.value })}
                        className={errors.university_email ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    <p className="text-xs text-gray-400">If your university provided you a .edu.bd email</p>
                    {errors.university_email && (
                        <p className="text-sm text-red-500 mt-1">{errors.university_email}</p>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleNext}
                        className="bg-[#4C3B8A] hover:bg-[#38266e] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        Next Step &rarr;
                    </button>
                </div>
            </div>
        </div>
    )
}
