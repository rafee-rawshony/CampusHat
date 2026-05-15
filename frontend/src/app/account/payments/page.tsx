'use client'

/**
 * My Payment Options (Daraz-style).
 *
 * List the user's saved payment methods (bKash, Nagad, Rocket, card, etc.)
 * with add / edit / delete and "set as default" actions.
 */

import { useEffect, useState } from 'react'
import {
    Plus, CreditCard, Loader2, Pencil, Trash2, Star,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { PaymentMethodDialog } from '@/components/account/PaymentMethodDialog'
import {
    listPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod,
    type UserPaymentMethod,
} from '@/services/payment-methods.service'

// Lookup for the colored badge shown on each method card.
const METHOD_STYLE: Record<string, { color: string; emoji: string }> = {
    bkash:  { color: 'bg-pink-50 text-pink-700 border-pink-200',     emoji: '💗' },
    nagad:  { color: 'bg-orange-50 text-orange-700 border-orange-200', emoji: '🟠' },
    rocket: { color: 'bg-purple-50 text-purple-700 border-purple-200', emoji: '🚀' },
    upay:   { color: 'bg-blue-50 text-blue-700 border-blue-200',     emoji: '🔵' },
    tap:    { color: 'bg-cyan-50 text-cyan-700 border-cyan-200',     emoji: '💧' },
    card:   { color: 'bg-gray-50 text-gray-700 border-gray-200',     emoji: '💳' },
    bank:   { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', emoji: '🏦' },
}

export default function PaymentOptionsPage() {
    const [methods, setMethods] = useState<UserPaymentMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<UserPaymentMethod | null>(null)

    const refresh = async () => {
        setLoading(true)
        try {
            setMethods(await listPaymentMethods())
        } catch {
            toast.error('Failed to load payment methods.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { refresh() }, [])

    const handleSaved = () => {
        refresh()
        setEditing(null)
    }

    const handleEdit = (m: UserPaymentMethod) => {
        setEditing(m)
        setDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this payment method?')) return
        try {
            await deletePaymentMethod(id)
            toast.success('Payment method removed.')
            setMethods((prev) => prev.filter((m) => m.id !== id))
        } catch {
            toast.error('Failed to remove payment method.')
        }
    }

    const handleSetDefault = async (id: string) => {
        try {
            await setDefaultPaymentMethod(id)
            toast.success('Default payment method updated.')
            refresh()
        } catch {
            toast.error('Failed to set default.')
        }
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">My Payment Options</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Save payment accounts for faster checkout.
                        </p>
                    </div>
                    <Button
                        onClick={() => { setEditing(null); setDialogOpen(true) }}
                        className="bg-brand-primary hover:bg-brand-dark gap-2 h-10 font-semibold"
                    >
                        <Plus className="h-4 w-4" />
                        Add Payment Method
                    </Button>
                </div>

                <div className="p-4 sm:p-6 md:p-8">
                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && methods.length === 0 && (
                        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="h-8 w-8 text-brand-primary" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                                No payment methods saved
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">
                                Add your bKash, Nagad, or card to checkout faster next time.
                            </p>
                            <Button
                                onClick={() => { setEditing(null); setDialogOpen(true) }}
                                className="bg-brand-primary hover:bg-brand-dark gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Your First Method
                            </Button>
                        </div>
                    )}

                    {/* List */}
                    {!loading && methods.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {methods.map((m) => {
                                const style = METHOD_STYLE[m.method] || METHOD_STYLE.card
                                return (
                                    <div
                                        key={m.id}
                                        className={`relative p-5 rounded-xl border transition-all hover:shadow-md ${
                                            m.is_default
                                                ? 'border-brand-primary bg-brand-light/20 shadow-sm'
                                                : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                        {m.is_default && (
                                            <span className="absolute top-0 right-4 bg-brand-primary text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-b">
                                                Default
                                            </span>
                                        )}

                                        {/* Method badge */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg border ${style.color}`}>
                                                {style.emoji}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {m.method_display}
                                                </p>
                                                {m.label && (
                                                    <p className="text-[11px] text-gray-500">{m.label}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Account info */}
                                        <p className="font-semibold text-gray-900 text-base font-mono tracking-wider">
                                            {m.masked_account}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {m.account_holder_name}
                                        </p>
                                        {m.method === 'card' && m.card_expiry && (
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Expires {m.card_expiry} {m.card_brand && `· ${m.card_brand}`}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => handleEdit(m)}
                                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-primary font-semibold transition-colors"
                                            >
                                                <Pencil className="h-3 w-3" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(m.id)}
                                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 font-semibold transition-colors"
                                            >
                                                <Trash2 className="h-3 w-3" /> Delete
                                            </button>
                                            {!m.is_default && (
                                                <button
                                                    onClick={() => handleSetDefault(m.id)}
                                                    className="ml-auto flex items-center gap-1 text-xs text-brand-primary hover:text-brand-dark font-semibold transition-colors"
                                                >
                                                    <Star className="h-3 w-3" /> Set as default
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Security note */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-xs text-blue-700">
                <span className="font-bold">🔒 Your data is safe.</span>{' '}
                We never store your full card number, CVV, or PIN. Only display info is saved on our side; charging happens through the payment gateway.
            </div>

            <PaymentMethodDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                method={editing}
                onSaved={handleSaved}
            />
        </div>
    )
}
