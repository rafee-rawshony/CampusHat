'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationStepperProps {
    currentStep: number // 1, 2, or 3
}

export function VerificationStepper({ currentStep }: VerificationStepperProps) {
    const steps = [
        { id: 1, label: 'Academic Details' },
        { id: 2, label: 'Select Campus' },
        { id: 3, label: 'Verify Identity' },
    ]

    return (
        <div className="mb-8 w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between relative">
                {/* Background Connecting Line */}
                <div className="absolute left-[15%] right-[15%] top-5 h-0.5 bg-gray-200 z-0" />

                {/* Active Connecting Line */}
                <div 
                    className="absolute left-[15%] top-5 h-0.5 bg-[#4C3B8A] z-0 transition-all duration-300 ease-in-out" 
                    style={{ 
                        width: currentStep === 1 ? '0%' : currentStep === 2 ? '35%' : '70%' 
                    }} 
                />

                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id
                    const isActive = currentStep === step.id
                    const isUpcoming = currentStep < step.id

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center w-32">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors duration-300",
                                    isCompleted ? "bg-[#4C3B8A] text-white" : "",
                                    isActive ? "bg-[#4C3B8A] text-white ring-4 ring-[#4C3B8A]/20" : "",
                                    isUpcoming ? "bg-white border-2 border-gray-300 text-gray-400" : ""
                                )}
                            >
                                {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                            </div>
                            <span 
                                className={cn(
                                    "text-xs mt-2 text-center transition-colors duration-300",
                                    isActive ? "text-[#4C3B8A] font-semibold" : "text-gray-500 font-medium"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
