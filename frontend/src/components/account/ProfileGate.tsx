'use client'

/**
 * ProfileGate — blocks access to a feature until the user's
 * profile is complete (first/last name, phone, birthday, gender).
 *
 * For checkout, also requires at least one delivery address.
 * Use `requireAddress` prop to enable address check (e.g. for checkout).
 *
 * Used before: student/faculty verification, seller registration, checkout.
 * Renders a card explaining what's missing instead of the wrapped content.
 */

import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'

interface Props {
    children: React.ReactNode
    /** Feature name shown in the gate message, e.g. "Student Verification" */
    featureName: string
    /** If true, also requires at least one delivery address (used by checkout) */
    requireAddress?: boolean
}

const PROFILE_FIELDS: { label: string; key: keyof ReturnType<typeof useAuthStore.getState>['user'] & string }[] = [
    { label: 'First & Last Name', key: 'first_name' },
    { label: 'Phone Number', key: 'phone' },
    { label: 'Date of Birth', key: 'birthday' },
    { label: 'Gender', key: 'gender' },
]

export function ProfileGate({ children, featureName, requireAddress = false }: Props) {
    const { user } = useAuthStore()

    if (!user) return null

    // Check the right backend property based on the mode.
    // is_profile_complete = basic fields only (name, phone, DOB, gender)
    // is_checkout_ready   = basic fields + at least one address
    const isComplete = requireAddress
        ? (user as any).is_checkout_ready === true
        : user.is_profile_complete === true

    if (isComplete) return <>{children}</>

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 animate-fade-in">
            <div className="max-w-lg mx-auto text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Complete your profile first
                </h2>
                <p className="text-gray-500 mb-6">
                    To access <span className="font-semibold text-gray-700">{featureName}</span>,
                    you need to fill out your basic profile information
                    {requireAddress && ' and add a delivery address'}.
                </p>

                {/* Checklist of required fields */}
                <div className="text-left bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
                    {PROFILE_FIELDS.map(({ label, key }) => {
                        const filled = !!user[key as keyof typeof user]
                        return (
                            <div key={key} className="flex items-center gap-3 text-sm">
                                {filled ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
                                )}
                                <span className={filled ? 'text-gray-400 line-through' : 'text-gray-700'}>
                                    {label}
                                </span>
                            </div>
                        )
                    })}

                    {/* Address check — only shown when requireAddress is true */}
                    {requireAddress && (() => {
                        const hasAddress = (user as any).is_checkout_ready === true &&
                            user.is_profile_complete === true
                        return (
                            <div className="flex items-center gap-3 text-sm">
                                {hasAddress ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
                                )}
                                <span className={hasAddress ? 'text-gray-400 line-through' : 'text-gray-700'}>
                                    At least one delivery address
                                </span>
                            </div>
                        )
                    })()}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/account">
                        <Button className="bg-brand-primary hover:bg-brand-dark gap-2 w-full sm:w-auto">
                            Go to My Profile <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    {requireAddress && (
                        <Link href="/account/addresses">
                            <Button variant="outline" className="gap-2 w-full sm:w-auto">
                                Add Address
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
