'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const METHODS = ['bKash', 'Nagad', 'Rocket', 'Bank Transfer']

const schema = z.object({
    method: z.string().min(1, 'Select a payment method'),
    account_number: z.string().min(1, 'Account number is required'),
    amount: z.coerce.number().min(500, 'Minimum payout is ৳500'),
})

type FormValues = z.infer<typeof schema>

interface PayoutModalProps {
    open: boolean
    onClose: () => void
    availableBalance: number
}

export function PayoutModal({ open, onClose, availableBalance }: PayoutModalProps) {
    const queryClient = useQueryClient()
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
    })

    const amount = watch('amount')

    const payoutMutation = useMutation({
        mutationFn: (data: FormValues) =>
            api.post('/sellers/payouts/request/', {
                amount: data.amount,
                method: data.method,
                account_number: data.account_number,
            }),
        onSuccess: () => {
            toast.success('Payout request submitted! Processing in 2-3 days.')
            queryClient.invalidateQueries({ queryKey: ['seller-wallet'] })
            onClose()
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || 'Payout request failed')
        },
    })

    const amountError =
        amount && amount < 500
            ? 'Minimum payout is ৳500'
            : amount && amount > availableBalance
            ? 'Insufficient balance'
            : null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">Available: ৳{Number(availableBalance).toLocaleString()}</p>
                </DialogHeader>

                <form onSubmit={handleSubmit(d => payoutMutation.mutate(d))} className="space-y-4 pt-2">
                    {/* Payment Method */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Method *</label>
                        <Select onValueChange={(v) => setValue('method', v)}>
                            <SelectTrigger className="w-full text-sm border-gray-200">
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                {METHODS.map(m => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.method && <p className="text-red-500 text-xs mt-1">{errors.method.message}</p>}
                    </div>

                    {/* Account Number */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account Number *</label>
                        <input
                            {...register('account_number')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="01XXXXXXXXX"
                        />
                        {errors.account_number && <p className="text-red-500 text-xs mt-1">{errors.account_number.message}</p>}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amount (৳) *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">৳</span>
                            <input
                                type="number"
                                min="500"
                                max={availableBalance}
                                {...register('amount')}
                                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                                placeholder="Minimum ৳500"
                            />
                        </div>
                        {amountError && <p className="text-red-500 text-xs mt-1">{amountError}</p>}
                        {errors.amount && !amountError && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
                        <p className="text-gray-400 text-xs mt-1">Min ৳500 · Max ৳{Number(availableBalance).toLocaleString()}</p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex gap-2 items-start">
                        <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Payouts are processed within 2-3 business days.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="border-gray-200">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={payoutMutation.isPending || !!amountError}
                            className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2"
                        >
                            {payoutMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Request Payout
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
