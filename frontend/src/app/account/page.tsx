'use client'

/**
 * My Profile (Daraz-style).
 *
 * View + edit identity fields: first/last name, email, phone, birthday,
 * gender, profile picture. Email stays read-only because it's the login
 * identifier — to change it the user has to re-verify (future feature).
 */

import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Mail, Phone as PhoneIcon, ShieldCheck, AlertCircle, GraduationCap, Edit2 } from 'lucide-react'

import { useAuthStore } from '@/stores/auth.store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getInitials } from '@/lib/utils'
import { updateMe, fetchMe, requestEmailChange } from '@/services/profile.service'
import { ImageUpload } from '@/components/common/ImageUpload'

// Validation — first/last required (it's a "complete profile" feature),
// other fields optional individually but together gate Mall checkout.
const profileSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    phone: z.string().optional().or(z.literal('')),
    birth_day: z.string().optional().or(z.literal('')),
    birth_month: z.string().optional().or(z.literal('')),
    birth_year: z.string().optional().or(z.literal('')),
    gender: z.enum(['male', 'female', 'other', '']).optional(),
    university_email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
})

// Email change dialog uses a separate schema — needs current password.
const emailChangeSchema = z.object({
    new_email: z.string().email('Enter a valid email'),
    current_password: z.string().min(1, 'Password is required'),
})
type EmailChangeForm = z.infer<typeof emailChangeSchema>

type ProfileForm = z.infer<typeof profileSchema>

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

// Build day list (1-31), month list, year list (current year - 100 to current year - 5)
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1))
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 95 }, (_, i) => String(CURRENT_YEAR - 5 - i))

// Split YYYY-MM-DD into [day, month, year]
function splitBirthday(birthday: string | null | undefined): [string, string, string] {
    if (!birthday) return ['', '', '']
    const [y, m, d] = birthday.split('-')
    return [String(parseInt(d || '0', 10) || ''), String(parseInt(m || '0', 10) || ''), y || '']
}

// Combine into YYYY-MM-DD; returns '' if any part missing
function joinBirthday(day: string, month: string, year: string): string {
    if (!day || !month || !year) return ''
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export default function MyProfilePage() {
    const { user, setUser } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)

    const initialBirthday = useMemo(() => splitBirthday(user?.birthday), [user?.birthday])

    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            phone: user?.phone || '',
            birth_day: initialBirthday[0],
            birth_month: initialBirthday[1],
            birth_year: initialBirthday[2],
            gender: (user?.gender as 'male' | 'female' | 'other') || undefined,
            university_email: user?.university_email || '',
        },
    })

    // Reset form when user data refreshes (e.g. after fetchMe on mount)
    useEffect(() => {
        if (user) {
            const [d, m, y] = splitBirthday(user.birthday)
            form.reset({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || '',
                birth_day: d,
                birth_month: m,
                birth_year: y,
                gender: (user.gender as 'male' | 'female' | 'other') || undefined,
                university_email: user.university_email || '',
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
                /* stale data is fine */
            }
        }
        refresh()
        return () => { cancelled = true }
    }, [setUser])

    // Avatar upload — runs through the universal /uploads/ endpoint and
    // immediately persists the returned URL on the user via /auth/me/update/.
    const handleAvatarChange = async (url: string | null) => {
        if (!user) return
        try {
            const updated = await updateMe({ profile_picture: url })
            setUser({ ...user, ...updated })
        } catch {
            toast.error('Avatar saved on storage but failed to update profile.')
        }
    }

    const onSubmit = async (data: ProfileForm) => {
        if (!user) return
        setIsLoading(true)
        try {
            const birthday = joinBirthday(data.birth_day || '', data.birth_month || '', data.birth_year || '')
            const updated = await updateMe({
                first_name: data.first_name,
                last_name: data.last_name,
                full_name: `${data.first_name} ${data.last_name}`.trim(),
                phone: data.phone || null,
                birthday: birthday || null,
                gender: (data.gender || null) as 'male' | 'female' | 'other' | null,
                university_email: data.university_email || null,
            })
            setUser({ ...user, ...updated })
            toast.success('Profile updated successfully.')
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: {
                    message?: string
                    errors?: Record<string, string[]>
                } }
            }
            const errs = err.response?.data?.errors || {}
            const firstFieldError = Object.values(errs)[0]?.[0]
            toast.error(firstFieldError || err.response?.data?.message || 'Failed to update profile.')
        } finally {
            setIsLoading(false)
        }
    }

    // ── Email change dialog ─────────────────────────────────────────────
    const [emailDialogOpen, setEmailDialogOpen] = useState(false)
    const [emailChangeLoading, setEmailChangeLoading] = useState(false)

    const emailForm = useForm<EmailChangeForm>({
        resolver: zodResolver(emailChangeSchema),
        defaultValues: { new_email: '', current_password: '' },
    })

    const handleEmailChange = async (data: EmailChangeForm) => {
        setEmailChangeLoading(true)
        try {
            await requestEmailChange({
                new_email: data.new_email,
                current_password: data.current_password,
            })
            toast.success(
                `Confirmation link sent to ${data.new_email}. Click it to finish changing your email.`,
                { duration: 7000 },
            )
            emailForm.reset()
            setEmailDialogOpen(false)
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { message?: string; errors?: Record<string, string[]> } }
            }
            const errs = err.response?.data?.errors || {}
            const firstFieldError = Object.values(errs)[0]?.[0]
            toast.error(firstFieldError || err.response?.data?.message || 'Failed to request email change.')
        } finally {
            setEmailChangeLoading(false)
        }
    }

    if (!user) return null

    const displayName =
        (user.first_name && user.last_name)
            ? `${user.first_name} ${user.last_name}`
            : user.full_name

    const isComplete = user.is_profile_complete === true

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-6 md:px-8 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Manage and protect your account.
                        </p>
                    </div>
                    {isComplete ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Profile Complete
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {user.profile_completion_percent ?? 0}% Complete
                        </span>
                    )}
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10">
                    {/* Form column */}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
                        {/* Name row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="first_name" className="text-xs text-gray-500 font-medium">
                                    First Name
                                </Label>
                                <Input
                                    id="first_name"
                                    {...form.register('first_name')}
                                    placeholder="First name"
                                    className="h-11"
                                />
                                {form.formState.errors.first_name && (
                                    <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="last_name" className="text-xs text-gray-500 font-medium">
                                    Last Name
                                </Label>
                                <Input
                                    id="last_name"
                                    {...form.register('last_name')}
                                    placeholder="Last name"
                                    className="h-11"
                                />
                                {form.formState.errors.last_name && (
                                    <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Login email — change requires verification */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="email" className="text-xs text-gray-500 font-medium">
                                    Login Email
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => setEmailDialogOpen(true)}
                                    className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
                                >
                                    <Edit2 className="h-3 w-3" /> Change
                                </button>
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    value={user.email}
                                    disabled
                                    className="h-11 pl-10 pr-28 bg-gray-50 text-gray-600 cursor-not-allowed"
                                />
                                {user.is_email_verified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                        <ShieldCheck className="h-3 w-3" />
                                        Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400">
                                Changing your email requires confirming the new address.
                            </p>
                        </div>

                        {/* University / Student / Faculty email — used for verification */}
                        <div className="space-y-1.5">
                            <Label htmlFor="university_email" className="text-xs text-gray-500 font-medium">
                                Student / Faculty Email <span className="text-gray-400 font-normal">(optional)</span>
                            </Label>
                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="university_email"
                                    type="email"
                                    {...form.register('university_email')}
                                    placeholder="you@university.edu.bd"
                                    className="h-11 pl-10"
                                />
                            </div>
                            <p className="text-[11px] text-gray-400">
                                Add your university-issued email so admins can verify your student / faculty status faster.
                            </p>
                            {form.formState.errors.university_email && (
                                <p className="text-xs text-destructive">{form.formState.errors.university_email.message}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs text-gray-500 font-medium">
                                Phone Number
                            </Label>
                            <div className="relative">
                                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    {...form.register('phone')}
                                    placeholder="+8801XXXXXXXXX"
                                    className="h-11 pl-10"
                                />
                            </div>
                        </div>

                        {/* Birthday — three dropdowns Daraz-style */}
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 font-medium">Birthday</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <Select
                                    value={form.watch('birth_day') || ''}
                                    onValueChange={(v) => form.setValue('birth_day', v, { shouldDirty: true })}
                                >
                                    <SelectTrigger className="h-11"><SelectValue placeholder="Day" /></SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={form.watch('birth_month') || ''}
                                    onValueChange={(v) => form.setValue('birth_month', v, { shouldDirty: true })}
                                >
                                    <SelectTrigger className="h-11"><SelectValue placeholder="Month" /></SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map((m, i) => (
                                            <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={form.watch('birth_year') || ''}
                                    onValueChange={(v) => form.setValue('birth_year', v, { shouldDirty: true })}
                                >
                                    <SelectTrigger className="h-11"><SelectValue placeholder="Year" /></SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Gender — 3 selectable cards */}
                        <div className="space-y-2">
                            <Label className="text-xs text-gray-500 font-medium">Gender</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['male', 'female', 'other'] as const).map((g) => {
                                    const isSelected = form.watch('gender') === g
                                    return (
                                        <button
                                            type="button"
                                            key={g}
                                            onClick={() => form.setValue('gender', g, { shouldDirty: true })}
                                            className={`h-11 rounded-md border-2 text-sm font-semibold capitalize transition-colors ${
                                                isSelected
                                                    ? 'border-brand-primary bg-brand-light/40 text-brand-primary'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-brand-primary/50'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-3">
                            <Button
                                type="submit"
                                disabled={isLoading || !form.formState.isDirty}
                                className="bg-brand-primary hover:bg-brand-dark px-10 h-11 font-semibold"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>

                    {/* Avatar column — uploads via the universal /uploads/ endpoint
                        and persists the returned URL onto the user. */}
                    <div className="lg:border-l lg:pl-10 lg:border-gray-100">
                        <ImageUpload
                            value={user.profile_picture}
                            onChange={handleAvatarChange}
                            category="avatar"
                            variant="avatar"
                            size={128}
                            fallbackText={getInitials(displayName)}
                            label="JPG, PNG or WebP — max 5MB."
                        />
                    </div>
                </div>
            </div>

            {/* Email Change Dialog — verification-based flow */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle>Change Login Email</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={emailForm.handleSubmit(handleEmailChange)} className="space-y-4 mt-2">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                            We&apos;ll send a confirmation link to your new email. Your login email
                            won&apos;t change until you click the link.
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="current_email">Current Email</Label>
                            <Input
                                id="current_email"
                                value={user.email}
                                disabled
                                className="bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="new_email">New Email</Label>
                            <Input
                                id="new_email"
                                type="email"
                                {...emailForm.register('new_email')}
                                placeholder="new@email.com"
                            />
                            {emailForm.formState.errors.new_email && (
                                <p className="text-xs text-destructive">{emailForm.formState.errors.new_email.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="current_password">Current Password</Label>
                            <Input
                                id="current_password"
                                type="password"
                                {...emailForm.register('current_password')}
                                placeholder="Enter your current password"
                            />
                            {emailForm.formState.errors.current_password && (
                                <p className="text-xs text-destructive">{emailForm.formState.errors.current_password.message}</p>
                            )}
                            <p className="text-[11px] text-gray-400">
                                We ask for your password to make sure it&apos;s really you.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEmailDialogOpen(false)}
                                disabled={emailChangeLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-brand-primary hover:bg-brand-dark"
                                disabled={emailChangeLoading}
                            >
                                {emailChangeLoading ? 'Sending...' : 'Send Confirmation Link'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
