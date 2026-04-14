'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const storeSchema = z.object({
    name: z.string().min(2, 'Store name is required'),
    description: z.string().optional(),
    logo: z.string().url().optional().or(z.literal('')),
    banner: z.string().url().optional().or(z.literal('')),
    banner_color: z.string().optional(),
})

const payoutSchema = z.object({
    mobile_banking_method: z.string().min(1),
    mobile_banking_number: z.string().min(1),
})

export default function SellerSettingsPage() {
    const queryClient = useQueryClient()

    const { data: store } = useQuery({
        queryKey: ['my-store'],
        queryFn: () => api.get('/sellers/my_store/').then(r => r.data).catch(() => null),
        staleTime: 300_000,
    })

    const storeForm = useForm<z.infer<typeof storeSchema>>({
        resolver: zodResolver(storeSchema),
        values: {
            name: store?.name || '',
            description: store?.description || '',
            logo: store?.logo || '',
            banner: store?.banner || '',
            banner_color: store?.banner_color || '#4C3B8A',
        },
    })

    const payoutForm = useForm<z.infer<typeof payoutSchema>>({
        resolver: zodResolver(payoutSchema),
        values: {
            mobile_banking_method: store?.mobile_banking_method || '',
            mobile_banking_number: store?.mobile_banking_number || '',
        },
    })

    const storeMutation = useMutation({
        mutationFn: (data: z.infer<typeof storeSchema>) =>
            api.patch(`/sellers/stores/${store?.slug}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-store'] })
            toast.success('Store settings updated!')
        },
        onError: () => toast.error('Failed to update store settings'),
    })

    const payoutMutation = useMutation({
        mutationFn: (data: z.infer<typeof payoutSchema>) =>
            api.patch(`/sellers/stores/${store?.slug}/`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-store'] })
            toast.success('Payout settings updated!')
        },
        onError: () => toast.error('Failed to update payout settings'),
    })

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="font-bold text-xl text-gray-900">Store Settings</h1>

            {/* Section 1: Store Settings */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h2 className="font-semibold text-gray-800 mb-5">Store Information</h2>
                <form onSubmit={storeForm.handleSubmit(d => storeMutation.mutate(d))} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Store Name *</label>
                        <input
                            {...storeForm.register('name')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                        />
                        {storeForm.formState.errors.name && (
                            <p className="text-red-500 text-xs mt-1">{storeForm.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Store Description</label>
                        <textarea
                            rows={3}
                            {...storeForm.register('description')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Store Logo URL</label>
                        <input
                            type="url"
                            {...storeForm.register('logo')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Store Banner URL</label>
                        <input
                            type="url"
                            {...storeForm.register('banner')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Banner Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                {...storeForm.register('banner_color')}
                                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-gray-50"
                            />
                            <span className="text-sm text-gray-500 font-mono">
                                {storeForm.watch('banner_color') || '#4C3B8A'}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={storeMutation.isPending}
                            className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2"
                        >
                            {storeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Store Settings
                        </Button>
                    </div>
                </form>
            </div>

            {/* Section 2: Payout Settings */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h2 className="font-semibold text-gray-800 mb-5">Payout Settings</h2>
                <form onSubmit={payoutForm.handleSubmit(d => payoutMutation.mutate(d))} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mobile Banking Method</label>
                        <Select
                            onValueChange={(v) => payoutForm.setValue('mobile_banking_method', v)}
                            defaultValue={store?.mobile_banking_method || ''}
                        >
                            <SelectTrigger className="w-full text-sm border-gray-200 bg-gray-50">
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                {['bKash', 'Nagad', 'Rocket', 'Bank Transfer'].map(m => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account Number</label>
                        <input
                            {...payoutForm.register('mobile_banking_number')}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                            placeholder="01XXXXXXXXX"
                        />
                    </div>

                    {/* Commission Info (Read Only) */}
                    {store?.commission_rate !== undefined && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-sm text-gray-600 font-medium">
                                Commission Rate: <strong>{store.commission_rate}%</strong>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                This is set by CampusHat and cannot be changed.
                            </p>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={payoutMutation.isPending}
                            className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2"
                        >
                            {payoutMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Payout Settings
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
