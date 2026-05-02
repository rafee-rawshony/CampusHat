'use client'

/**
 * My Profile (Daraz-style).
 *
 * View + edit identity fields: first/last name, email, phone, birthday,
 * gender, profile picture. Email stays read-only because it's the login
 * identifier — to change it the user has to re-verify (future feature).
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Camera } from 'lucide-react'

import { useAuthStore } from '@/stores/auth.store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getInitials } from '@/lib/utils'
import { updateMe, fetchMe } from '@/services/profile.service'

// Validation — all fields optional (profile completion is a soft nudge, not a hard gate).
const profileSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    phone: z.string().optional().or(z.literal('')),
    birthday: z.string().optional().or(z.literal('')),
    gender: z.enum(['male', 'female', 'other', '']).optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function MyProfilePage() {
    const { user, setUser } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            phone: user?.phone || '',
            birthday: user?.birthday || '',
            gender: (user?.gender as 'male' | 'female' | 'other') || undefined,
        },
    })

    // Reset form when user data changes (e.g. after fetchMe on mount)
    useEffect(() => {
        if (user) {
            form.reset({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || '',
                birthday: user.birthday || '',
                gender: (user.gender as 'male' | 'female' | 'other') || undefined,
            })
        }
    }, [user, form])

    // Refresh user data on mount so we always show latest from backend.
    useEffect(() => {
        let cancelled = false
        const refresh = async () => {
            try {
                const fresh = await fetchMe()
                if (!cancelled && fresh) setUser(fresh)
            } catch {
                /* ignore — stale data is fine */
            }
        }
        refresh()
        return () => { cancelled = true }
    }, [setUser])

    // Handle avatar file selection — for now we just show a preview.
    // Actual upload would post to a /auth/me/avatar/ endpoint (future).
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be under 2MB.')
            return
        }
        const reader = new FileReader()
        reader.onload = () => setAvatarPreview(reader.result as string)
        reader.readAsDataURL(file)
        toast('Avatar upload endpoint coming soon — preview only.', { icon: 'ℹ️' })
    }

    const onSubmit = async (data: ProfileForm) => {
        if (!user) return
        setIsLoading(true)
        try {
            const updated = await updateMe({
                first_name: data.first_name,
                last_name: data.last_name,
                full_name: `${data.first_name} ${data.last_name}`.trim(),
                phone: data.phone || null,
                birthday: data.birthday || null,
                gender: (data.gender || null) as 'male' | 'female' | 'other' | null,
            })
            setUser({ ...user, ...updated })
            toast.success('Profile updated.')
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(err.response?.data?.message || 'Failed to update profile.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) return null

    const displayName =
        (user.first_name && user.last_name)
            ? `${user.first_name} ${user.last_name}`
            : user.full_name

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-start justify-between mb-6 border-b border-gray-100 pb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage your personal information.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8">
                    {/* Form column */}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    {...form.register('first_name')}
                                    placeholder="First name"
                                    className="bg-gray-50"
                                />
                                {form.formState.errors.first_name && (
                                    <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    {...form.register('last_name')}
                                    placeholder="Last name"
                                    className="bg-gray-50"
                                />
                                {form.formState.errors.last_name && (
                                    <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                value={user.email}
                                disabled
                                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400">
                                Email is your login ID and can't be changed here.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                {...form.register('phone')}
                                placeholder="+8801XXXXXXXXX"
                                className="bg-gray-50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="birthday">Birthday</Label>
                            <Input
                                id="birthday"
                                type="date"
                                {...form.register('birthday')}
                                className="bg-gray-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <RadioGroup
                                value={form.watch('gender') || ''}
                                onValueChange={(v) =>
                                    form.setValue('gender', v as 'male' | 'female' | 'other', { shouldDirty: true })
                                }
                                className="flex gap-6"
                            >
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <RadioGroupItem value="male" />
                                    <span className="text-sm">Male</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <RadioGroupItem value="female" />
                                    <span className="text-sm">Female</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <RadioGroupItem value="other" />
                                    <span className="text-sm">Other</span>
                                </label>
                            </RadioGroup>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                type="submit"
                                disabled={isLoading || !form.formState.isDirty}
                                className="bg-brand-primary hover:bg-brand-dark px-8"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>

                    {/* Avatar column */}
                    <div className="flex flex-col items-center lg:border-l lg:pl-8 lg:border-gray-100">
                        <Avatar className="h-32 w-32 border-2 border-gray-100 shadow-sm">
                            {(avatarPreview || user.profile_picture) ? (
                                <AvatarImage
                                    src={avatarPreview || user.profile_picture}
                                    alt={displayName}
                                    className="object-cover"
                                />
                            ) : (
                                <AvatarFallback className="bg-brand-light text-brand-primary text-3xl font-bold">
                                    {getInitials(displayName)}
                                </AvatarFallback>
                            )}
                        </Avatar>

                        <label className="mt-4 cursor-pointer">
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <span className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <Camera className="h-4 w-4" />
                                Select Image
                            </span>
                        </label>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            JPG, PNG or WEBP — max 2MB.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
