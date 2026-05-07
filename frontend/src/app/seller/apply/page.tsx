'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'
import { Store, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ImageUpload } from '@/components/common/ImageUpload'

const schema = z.object({
    store_name: z.string().min(2, 'Store name is required'),
    description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function SellerApplyPage() {
    const { user, setUser } = useAuthStore()
    const router = useRouter()
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [bannerUrl, setBannerUrl] = useState<string | null>(null)

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    })

    const applyMutation = useMutation({
        mutationFn: (data: FormValues) => api.post('/sellers/register/', {
            ...data,
            logo: logoUrl || undefined,
            banner: bannerUrl || undefined,
        }),
        onSuccess: () => {
            // Update auth store with pending status
            if (user) {
                setUser({ ...user, seller_application_status: 'pending' })
            }
            toast.success('Application submitted! Our team will review it shortly.')
            router.push('/seller')
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.detail || 'Failed to submit application')
        },
    })

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-lg w-full shadow-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-[#4C3B8A]/10 rounded-2xl mb-4">
                        <Store className="w-7 h-7 text-[#4C3B8A]" />
                    </div>
                    <h1 className="font-bold text-2xl text-gray-900">Become a Seller</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Start selling on CampusHat and reach thousands of students.
                    </p>
                </div>

                <form onSubmit={handleSubmit(d => applyMutation.mutate(d))} className="space-y-5">
                    {/* Account Details */}
                    <div>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account Details</h2>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            {user ? (
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{user.email}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Using your existing account</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Please log in first</p>
                            )}
                        </div>
                    </div>

                    {/* Store Information */}
                    <div>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Store Information</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Store Name *</label>
                                <input
                                    {...register('store_name')}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50"
                                    placeholder="e.g. TechZone BD"
                                />
                                {errors.store_name && <p className="text-red-500 text-xs mt-1">{errors.store_name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Store Description</label>
                                <textarea
                                    rows={3}
                                    {...register('description')}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50 resize-none"
                                    placeholder="Tell students what you sell..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Store Logo <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <ImageUpload
                                    value={logoUrl}
                                    onChange={setLogoUrl}
                                    category="store_logo"
                                    variant="avatar"
                                    fallbackText="S"
                                    size={80}
                                    label="JPG, PNG or WebP — max 5MB"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Store Banner <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <ImageUpload
                                    value={bannerUrl}
                                    onChange={setBannerUrl}
                                    category="store_banner"
                                    variant="rectangle"
                                    label="Recommended: 1200×300px — JPG, PNG or WebP — max 5MB"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={applyMutation.isPending || !user}
                        className="w-full bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold py-3.5 rounded-xl mt-6 gap-2"
                    >
                        {applyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create My Store
                    </Button>
                </form>
            </div>
        </div>
    )
}
