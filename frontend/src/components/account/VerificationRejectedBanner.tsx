'use client'

import { XCircle, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'

interface VerificationRecord {
    id: string
    status: string
    verification_type: string
    rejection_reason?: string | null
    attempt_number?: number
    created_at?: string
}

export function VerificationRejectedBanner() {
    const { user } = useAuthStore()

    // Pull the full history so we can show attempt count + last reason.
    const { data: verifications } = useQuery<VerificationRecord[]>({
        queryKey: ['my-verifications'],
        queryFn: async () => {
            const res = await api.get('/auth/verification/my-status/')
            return res.data?.data || []
        },
        enabled: !!user && user.verification_status === 'rejected',
        staleTime: 60_000,
    })

    if (!user || user.verification_status !== 'rejected') return null

    const rejectedRecords = (verifications || []).filter(
        v => v.status === 'rejected' && v.verification_type === 'student_id'
    )
    // Total submissions of this type so far (rejected + any active).
    const totalAttempts = (verifications || [])
        .filter(v => v.verification_type === 'student_id')
        .length
    const latest = rejectedRecords.sort((a, b) => {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0
        return bt - at
    })[0]

    const reason = latest?.rejection_reason || user.verification_rejection_reason
    const showRateLimitWarning = totalAttempts >= 3

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-red-700">Verification Rejected</h3>
                    {totalAttempts > 1 && (
                        <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            Attempt #{totalAttempts}
                        </span>
                    )}
                </div>

                {reason && (
                    <p className="text-sm text-red-600 mt-1">
                        Reason: {reason}
                    </p>
                )}

                {/* Rate-limit warning when the user is near / at the 3-per-24h cap. */}
                {showRateLimitWarning && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                            You have submitted {totalAttempts} verification requests recently.
                            For security, only 3 submissions are allowed per 24 hours. Please
                            wait before retrying.
                        </p>
                    </div>
                )}

                {!showRateLimitWarning && (
                    <p className="text-sm text-red-500 mt-1">
                        Please resubmit your application below with the correct document.
                    </p>
                )}

                {/* Past rejection history — collapsed list */}
                {rejectedRecords.length > 1 && (
                    <details className="mt-3">
                        <summary className="text-xs font-semibold text-red-700 cursor-pointer hover:underline">
                            Past rejection history ({rejectedRecords.length})
                        </summary>
                        <ul className="mt-2 space-y-1.5 pl-2 border-l-2 border-red-200">
                            {rejectedRecords.map((r) => (
                                <li key={r.id} className="text-xs text-red-700">
                                    <span className="font-semibold">
                                        Attempt #{r.attempt_number}:
                                    </span>{' '}
                                    {r.rejection_reason || 'No reason provided.'}
                                    {r.created_at && (
                                        <span className="text-red-400 ml-1">
                                            ({new Date(r.created_at).toLocaleDateString()})
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
            </div>
        </div>
    )
}
