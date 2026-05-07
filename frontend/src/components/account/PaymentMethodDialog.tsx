'use client'

/**
 * Add / edit a saved payment method (Daraz-style).
 *
 * For mobile wallets (bKash/Nagad/etc.) we only ask for the phone
 * number + holder name. For cards we collect last-4, brand, and expiry
 * — the actual card number/CVV is never sent to or stored on our backend.
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
    createPaymentMethod, updatePaymentMethod,
    type UserPaymentMethod, type PaymentMethodType,
} from '@/services/payment-methods.service'

// Visual definition of each method — controls the picker grid.
const METHODS: Array<{ key: PaymentMethodType; label: string; color: string; emoji: string }> = [
    { key: 'bkash',  label: 'bKash',  color: 'border-pink-300 bg-pink-50 text-pink-700',   emoji: '💗' },
    { key: 'nagad',  label: 'Nagad',  color: 'border-orange-300 bg-orange-50 text-orange-700', emoji: '🟠' },
    { key: 'rocket', label: 'Rocket', color: 'border-purple-300 bg-purple-50 text-purple-700', emoji: '🚀' },
    { key: 'upay',   label: 'Upay',   color: 'border-blue-300 bg-blue-50 text-blue-700',     emoji: '🔵' },
    { key: 'tap',    label: 'Tap',    color: 'border-cyan-300 bg-cyan-50 text-cyan-700',     emoji: '💧' },
    { key: 'card',   label: 'Card',   color: 'border-gray-300 bg-gray-50 text-gray-700',     emoji: '💳' },
    { key: 'bank',   label: 'Bank',   color: 'border-emerald-300 bg-emerald-50 text-emerald-700', emoji: '🏦' },
]

const schema = z.object({
    method: z.enum(['bkash', 'nagad', 'rocket', 'upay', 'tap', 'card', 'bank']),
    label: z.string().optional(),
    account_holder_name: z.string().min(2, 'Account holder name is required'),
    account_number: z.string().min(4, 'Account number is required'),
    card_last4: z.string().optional(),
    card_brand: z.string().optional(),
    card_expiry: z.string().optional(),
    is_default: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    method?: UserPaymentMethod | null
    onSaved: () => void
}

export function PaymentMethodDialog({ open, onOpenChange, method, onSaved }: Props) {
    const isEdit = !!method
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            method: 'bkash',
            label: '',
            account_holder_name: '',
            account_number: '',
            card_last4: '',
            card_brand: '',
            card_expiry: '',
            is_default: false,
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                method: method?.method || 'bkash',
                label: method?.label || '',
                account_holder_name: method?.account_holder_name || '',
                account_number: method?.account_number || '',
                card_last4: method?.card_last4 || '',
                card_brand: method?.card_brand || '',
                card_expiry: method?.card_expiry || '',
                is_default: method?.is_default || false,
            })
        }
    }, [open, method, form])

    const selectedMethod = form.watch('method')
    const isCard = selectedMethod === 'card'

    const onSubmit = async (data: FormValues) => {
        setSubmitting(true)
        try {
            if (isEdit) {
                await updatePaymentMethod(method!.id, data)
                toast.success('Payment method updated.')
            } else {
                await createPaymentMethod(data)
                toast.success('Payment method added.')
            }
            onSaved()
            onOpenChange(false)
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; account_number?: string[] } } }
            const accountErr = err.response?.data?.account_number?.[0]
            toast.error(accountErr || err.response?.data?.message || 'Failed to save payment method.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
                    {/* Method picker — visual grid */}
                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {METHODS.map((m) => {
                                const isSelected = selectedMethod === m.key
                                return (
                                    <button
                                        type="button"
                                        key={m.key}
                                        onClick={() => form.setValue('method', m.key, { shouldDirty: true })}
                                        className={cn(
                                            'h-16 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all',
                                            isSelected
                                                ? 'border-brand-primary bg-brand-light/30 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-gray-300',
                                        )}
                                    >
                                        <span className="text-lg leading-none">{m.emoji}</span>
                                        <span className="text-[11px] font-bold uppercase tracking-wide">{m.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Holder name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="account_holder_name">Account Holder Name</Label>
                        <Input
                            id="account_holder_name"
                            {...form.register('account_holder_name')}
                            placeholder="Name on the account"
                        />
                        {form.formState.errors.account_holder_name && (
                            <p className="text-xs text-destructive">{form.formState.errors.account_holder_name.message}</p>
                        )}
                    </div>

                    {/* Account / card number */}
                    <div className="space-y-1.5">
                        <Label htmlFor="account_number">
                            {isCard ? 'Card Last 4 Digits' : 'Phone Number / Account Number'}
                        </Label>
                        <Input
                            id="account_number"
                            type="tel"
                            inputMode="numeric"
                            maxLength={isCard ? 4 : 20}
                            {...form.register('account_number')}
                            placeholder={isCard ? '1234' : '+8801XXXXXXXXX'}
                        />
                        {form.formState.errors.account_number && (
                            <p className="text-xs text-destructive">{form.formState.errors.account_number.message}</p>
                        )}
                        <p className="text-xs text-gray-400">
                            {isCard
                                ? 'We only store the last 4 digits — your full card number stays with the gateway.'
                                : 'For mobile wallets, this is the phone number registered with the wallet.'}
                        </p>
                    </div>

                    {/* Card-specific fields */}
                    {isCard && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="card_brand">Card Brand</Label>
                                <Input
                                    id="card_brand"
                                    {...form.register('card_brand')}
                                    placeholder="Visa / Mastercard"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="card_expiry">Expiry (MM/YYYY)</Label>
                                <Input
                                    id="card_expiry"
                                    {...form.register('card_expiry')}
                                    placeholder="12/2027"
                                />
                            </div>
                        </div>
                    )}

                    {/* Optional label */}
                    <div className="space-y-1.5">
                        <Label htmlFor="label">Label (optional)</Label>
                        <Input
                            id="label"
                            {...form.register('label')}
                            placeholder="e.g. My personal bKash"
                        />
                    </div>

                    {/* Default checkbox */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="pm_default"
                            checked={!!form.watch('is_default')}
                            onCheckedChange={(checked) =>
                                form.setValue('is_default', checked === true, { shouldDirty: true })
                            }
                        />
                        <Label htmlFor="pm_default" className="text-sm cursor-pointer">
                            Set as default payment method
                        </Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-brand-primary hover:bg-brand-dark" disabled={submitting}>
                            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Method'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
