'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ProfileGate } from '@/components/account/ProfileGate'
import { api } from '@/lib/api'

const sellerSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    store_name: z.string().min(3, 'Store name must be at least 3 characters'),
    store_description: z.string().min(10, 'Please provide a short description'),
    store_logo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    store_banner: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type SellerForm = z.infer<typeof sellerSchema>

export default function SellerRegisterPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuthStore()
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Using useForm instead since it's cleaner for validation
    const form = useForm<SellerForm>({
        resolver: zodResolver(sellerSchema),
        defaultValues: {
            password: '',
            store_name: '',
            store_description: '',
            store_logo: '',
            store_banner: '',
        },
    })

    const onSubmit = async (data: SellerForm) => {
        setIsLoading(true)
        try {
            await api.post('/sellers/register/', {
                ...data,
                email: user?.email || '', // In a real app we might pass this if not logged in
            })
            setIsSubmitted(true)
            toast.success('Application submitted successfully!')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit application')
        } finally {
            setIsLoading(false)
        }
    }

    // Success State
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 animate-fade-in">
                    <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Your application is being reviewed. Our team will verify your information and get back to you within 24-48 hours.
                    </p>
                    <Link href="/marketplace">
                        <Button className="w-full">
                            Back to Marketplace
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <ProfileGate featureName="Seller Registration">
        <div className="min-h-screen bg-surface-base py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary mb-6 shadow-lg">
                        <Store className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Become a Seller</h1>
                    <p className="mt-3 text-lg text-gray-500">
                        Join CampusHat as a verified seller and reach thousands of students.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    {!isAuthenticated && (
                        <div className="bg-amber-50 border-b border-amber-100 p-4">
                            <p className="text-sm text-amber-800 text-center">
                                Have an account?{' '}
                                <Link href="/auth/login?redirect=/seller/register" className="font-bold underline hover:text-amber-900">
                                    Log in first
                                </Link>{' '}
                                to pre-fill your details.
                            </p>
                        </div>
                    )}

                    <div className="p-6 sm:p-8">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* SECTION 1: Account Details */}
                            <div className="relative pl-4 border-l-4 border-emerald-500">
                                <h3 className="text-lg font-bold text-gray-900">Account Details</h3>
                                <p className="text-sm text-gray-500 mb-4">This will be used for logging into your seller dashboard.</p>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input
                                            value={user?.email || ''}
                                            readOnly
                                            disabled={!isAuthenticated}
                                            placeholder={isAuthenticated ? '' : 'Please log in first'}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Confirm Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            {...form.register('password')}
                                        />
                                        {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Store Information */}
                            <div className="relative pl-4 border-l-4 border-emerald-500">
                                <h3 className="text-lg font-bold text-gray-900">Store Information</h3>
                                <p className="text-sm text-gray-500 mb-4">This is what customers will see.</p>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="store_name">Store Name</Label>
                                        <Input
                                            id="store_name"
                                            placeholder="e.g., Campus Creations"
                                            {...form.register('store_name')}
                                        />
                                        {form.formState.errors.store_name && <p className="text-xs text-destructive">{form.formState.errors.store_name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="store_description">Store Description</Label>
                                        <Textarea
                                            id="store_description"
                                            placeholder="Tell us about what you sell..."
                                            className="resize-none h-24 bg-gray-50"
                                            {...form.register('store_description')}
                                        />
                                        {form.formState.errors.store_description && <p className="text-xs text-destructive">{form.formState.errors.store_description.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="store_logo">Store Logo URL (Optional)</Label>
                                        <Input
                                            id="store_logo"
                                            placeholder="https://example.com/logo.png"
                                            {...form.register('store_logo')}
                                        />
                                        {form.formState.errors.store_logo && <p className="text-xs text-destructive">{form.formState.errors.store_logo.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="store_banner">Store Banner URL (Optional)</Label>
                                        <Input
                                            id="store_banner"
                                            placeholder="https://example.com/banner.png"
                                            {...form.register('store_banner')}
                                        />
                                        {form.formState.errors.store_banner && <p className="text-xs text-destructive">{form.formState.errors.store_banner.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full text-lg h-12 rounded-xl mt-4"
                                disabled={isLoading || (!isAuthenticated && !form.formState.isDirty)}
                            >
                                {isLoading ? 'Submitting...' : 'Create My Store'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        </ProfileGate>
    )
}
