'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const COURIERS = [
    'Pathao Courier',
    'Steadfast Courier',
    'RedX Courier',
    'eCourier',
    'Sundarban Courier',
    'DTDC',
    'Other',
]

const schema = z.object({
    courier: z.string().min(1, 'Select a courier'),
    tracking_code: z.string().min(5, 'Min 5 characters'),
    estimated_delivery: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ShipOrderModalProps {
    order: any
    open: boolean
    onClose: () => void
}

export function ShipOrderModal({ order, open, onClose }: ShipOrderModalProps) {
    const queryClient = useQueryClient()
    const today = new Date().toISOString().split('T')[0]

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    })

    const shipMutation = useMutation({
        mutationFn: (data: FormValues) =>
            api.post(`/seller/orders/${order?.id}/ship/`, {
                courier: data.courier,
                tracking_code: data.tracking_code,
                estimated_delivery: data.estimated_delivery || null,
            }),
        onSuccess: () => {
            toast.success('Order marked as shipped!')
            queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
            queryClient.invalidateQueries({ queryKey: ['seller-stats'] })
            reset()
            onClose()
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || 'Failed to ship order')
        },
    })

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Ship This Order</DialogTitle>
                    {order && (
                        <DialogDescription>Order #{order.order_number}</DialogDescription>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit(d => shipMutation.mutate(d))} className="space-y-4 pt-2">
                    {/* Courier */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Delivery Partner *</label>
                        <Select onValueChange={(v) => setValue('courier', v)}>
                            <SelectTrigger className="w-full text-sm border-gray-200">
                                <SelectValue placeholder="Select a courier" />
                            </SelectTrigger>
                            <SelectContent>
                                {COURIERS.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.courier && <p className="text-red-500 text-xs mt-1">{errors.courier.message}</p>}
                    </div>

                    {/* Tracking Code */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tracking Code *</label>
                        <input
                            {...register('tracking_code')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="Enter tracking number"
                        />
                        {errors.tracking_code && <p className="text-red-500 text-xs mt-1">{errors.tracking_code.message}</p>}
                    </div>

                    {/* Estimated Delivery */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Estimated Delivery Date <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            type="date"
                            min={today}
                            {...register('estimated_delivery')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="border-gray-200">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={shipMutation.isPending}
                            className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2"
                        >
                            {shipMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm Shipment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
