'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth.store'

import { VerificationStepper } from '@/components/account/VerificationStepper'
import { VerificationStep1 } from '@/components/account/VerificationStep1'
import { VerificationStep2 } from '@/components/account/VerificationStep2'
import { VerificationStep3 } from '@/components/account/VerificationStep3'
import { VerificationPendingCard } from '@/components/account/VerificationPendingCard'
import { VerificationApprovedCard } from '@/components/account/VerificationApprovedCard'
import { VerificationRejectedBanner } from '@/components/account/VerificationRejectedBanner'
import { ProfileGate } from '@/components/account/ProfileGate'

export default function VerifyAccountPage() {
    const { user, isAuthenticated } = useAuthStore()
    const router = useRouter()
    
    // Auth Guard
    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/auth/login?redirect=/account/verify')
        }
    }, [isAuthenticated, router])

    const [currentStep, setCurrentStep] = useState(1)
    
    // Form State
    const [step1Data, setStep1Data] = useState({ student_id_number: '', university_email: '' })
    const [step2Data, setStep2Data] = useState({ university_id: '' })

    // No need to auto-redirect. The user can stay and see the approved state.
    // Removed the redirect logic below.

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-4 border-[#4C3B8A] border-t-transparent animate-spin" />
            </div>
        )
    }

    if (user.verification_status === 'approved') {
        return (
            <div className="py-8 px-4 sm:px-0">
                <VerificationApprovedCard />
            </div>
        )
    }

    if (user.verification_status === 'pending') {
        return (
            <div className="py-8">
                <VerificationPendingCard />
            </div>
        )
    }

    return (
        <ProfileGate featureName="Student / Faculty Verification">
        <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in pl-0 sm:pl-4">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="font-bold text-2xl text-gray-900">Verify Your Student Status</h1>
                <p className="text-sm text-gray-500 mt-1">Get access to campus marketplace and student-only features.</p>
            </div>

            {/* Rejection Banner */}
            {user.verification_status === 'rejected' && <VerificationRejectedBanner />}

            {/* Stepper */}
            <VerificationStepper currentStep={currentStep} />

            {/* Step Components */}
            {currentStep === 1 && (
                <VerificationStep1 
                    data={step1Data} 
                    onUpdate={(d) => setStep1Data({ ...step1Data, ...d })} 
                    onNext={() => setCurrentStep(2)} 
                />
            )}
            
            {currentStep === 2 && (
                <VerificationStep2 
                    data={step2Data} 
                    onUpdate={(d) => setStep2Data({ ...step2Data, ...d })} 
                    onNext={() => setCurrentStep(3)} 
                    onBack={() => setCurrentStep(1)} 
                />
            )}
            
            {currentStep === 3 && (
                <VerificationStep3 
                    step1Data={step1Data} 
                    step2Data={step2Data} 
                    onBack={() => setCurrentStep(2)}
                    onSuccess={() => {
                        // After successful submit, the component sets user status to 'pending'
                        // The render loop will catch it and return the VerificationPendingCard automatically
                    }}
                />
            )}
        </div>
        </ProfileGate>
    )
}
