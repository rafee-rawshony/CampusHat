'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'
import { Info, AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/stores/auth.store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'

const profileSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    university_id: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

interface University {
    id: string
    name: string
    short_code?: string
}

export default function AccountPage() {
    const { user, setUser } = useAuthStore()

    const [universities, setUniversities] = useState<University[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: user?.full_name || '',
            university_id: user?.university_id || '',
        },
    })

    useEffect(() => {
        if (user) {
            form.reset({
                full_name: user.full_name,
                university_id: user.university_id || '',
            })
        }
    }, [user, form])

    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const { data } = await api.get('/universities/')
                setUniversities(data.data || data.results || data || [])
            } catch {
                setUniversities([
                    { id: '1', name: 'American International University-Bangladesh', short_code: 'AIUB' },
                    { id: '2', name: 'University of Dhaka', short_code: 'DU' },
                    { id: '3', name: 'North South University', short_code: 'NSU' },
                    { id: '4', name: 'BRAC University', short_code: 'BRACU' },
                ])
            }
        }
        fetchUniversities()
    }, [])

    const onSubmit = async (data: ProfileForm) => {
        if (!user) return
        setIsLoading(true)
        try {
            const { data: response } = await api.patch('/auth/profile/', data)
            // Update local store with returned user object
            setUser({ ...user, ...response.user })
            toast.success('Profile updated successfully')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Full Name</Label>
                        <Input
                            id="full_name"
                            {...form.register('full_name')}
                            className="bg-gray-50"
                        />
                        {form.formState.errors.full_name && (
                            <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Email Address</Label>
                        <Input
                            id="email"
                            value={user.email}
                            disabled
                            className="bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <div className="space-y-2">
                            <Label htmlFor="university_id" className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                Your University / Campus
                                <Info className="h-4 w-4 text-gray-400" />
                            </Label>

                            <Select
                                value={form.watch('university_id')}
                                onValueChange={(val) => form.setValue('university_id', val, { shouldDirty: true })}
                            >
                                <SelectTrigger className="bg-gray-50">
                                    <SelectValue placeholder="Select your university map" />
                                </SelectTrigger>
                                <SelectContent>
                                    {universities.map((uni) => (
                                        <SelectItem key={uni.id} value={uni.id}>
                                            {uni.name} {uni.short_code ? `(${uni.short_code})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 italic">This sets your local feed for the campus marketplace.</p>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !form.formState.isDirty}
                        className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto px-8"
                    >
                        {isLoading ? 'Saving...' : 'Save Settings'}
                    </Button>
                </form>
            </div>

            {user.role === 'normal_user' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-3 rounded-full shrink-0">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900">Your account is not verified.</h3>
                            <p className="text-sm text-amber-700">Verify to unlock exclusive marketplace features and connect with peers.</p>
                        </div>
                    </div>
                    <Link href="/account/verify" className="shrink-0 w-full sm:w-auto">
                        <Button variant="outline" className="w-full border-amber-300 text-amber-800 hover:bg-amber-100 font-bold shadow-sm">
                            Verify Now &rarr;
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}
