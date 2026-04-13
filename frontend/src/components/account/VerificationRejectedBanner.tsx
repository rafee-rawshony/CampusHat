'use client'

import { XCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

export function VerificationRejectedBanner() {
    const { user } = useAuthStore()

    if (!user || user.verification_status !== 'rejected') return null

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
                <h3 className="font-semibold text-red-700">Verification Rejected</h3>
                {user.verification_rejection_reason && (
                    <p className="text-sm text-red-600 mt-1">
                        Reason: {user.verification_rejection_reason}
                    </p>
                )}
                <p className="text-sm text-red-500 mt-1">
                    Please resubmit your application below with the correct document.
                </p>
            </div>
        </div>
    )
}
