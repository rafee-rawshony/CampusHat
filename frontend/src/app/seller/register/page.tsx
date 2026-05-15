'use client'

/**
 * Daraz-style seller onboarding — single page, multiple grouped sections.
 *
 * Matches the spec the user provided:
 *   1. Profile / Basic Info (name, phone, email, gender, DOB, picture)
 *   2. Student Verification (toggle + ID card)
 *   3. Store / Business Information (name, type, address, contact, FB page, logo, banner)
 *   4. Identity Verification (NID / Passport + photo)
 *   5. Authorization & Agreement (T&C)
 *
 * Personal fields come pre-filled from the logged-in user. Editing them
 * here also updates the general profile (the backend syncs).
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Store as StoreIcon, Clock, CheckCircle2, GraduationCap, ShieldCheck,
    User as UserIcon, Building2, MapPin, ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ProfileGate } from '@/components/account/ProfileGate'
import { ImageUpload } from '@/components/common/ImageUpload'
import { onboardSeller, type SellerOnboardPayload } from '@/services/seller.service'
import { fetchMe } from '@/services/profile.service'

// Zod schema mirrors the backend SellerOnboardingSerializer.
const onboardSchema = z.object({
    // Personal
    full_name: z.string().min(2, 'Full name (per NID/Passport) is required'),
    phone: z.string().min(10, 'Valid phone number required'),
    email: z.string().email('Valid email required'),
    gender: z.enum(['male', 'female', 'other']),
    birthday: z.string().min(1, 'Date of birth is required'),
    profile_picture: z.string().optional().or(z.literal('')),

    // Student
    is_student_seller: z.boolean(),
    student_id_card_url: z.string().optional().or(z.literal('')),

    // Store
    store_name: z.string().min(3, 'Store name is required'),
    store_type: z.enum(['online', 'physical', 'both']),
    store_address: z.string().optional().or(z.literal('')),
    store_phone: z.string().min(10, 'Store phone is required'),
    store_email: z.string().email('Valid store email required'),
    store_description: z.string().optional().or(z.literal('')),
    store_category: z.string().optional().or(z.literal('')),
    facebook_page: z.string().optional().or(z.literal('')),
    logo_url: z.string().optional().or(z.literal('')),
    banner_url: z.string().optional().or(z.literal('')),

    // Identity
    identity_doc_type: z.enum(['nid', 'passport']),
    document_number: z.string().min(4, 'Document number is required'),
    document_image_url: z.string().min(1, 'Document photo is required'),
    document_back_image_url: z.string().optional().or(z.literal('')),

    // Payment
    mobile_banking_method: z.enum(['bkash', 'nagad', 'rocket']).optional().or(z.literal('')),
    mobile_banking_number: z.string().optional().or(z.literal('')),
    bank_account_name: z.string().optional().or(z.literal('')),
    bank_account_number: z.string().optional().or(z.literal('')),
    bank_name: z.string().optional().or(z.literal('')),

    accepted_terms: z.literal(true, { message: 'You must accept the Terms & Conditions.' }),
}).refine((data) => !(data.is_student_seller && !data.student_id_card_url), {
    message: 'Student ID card photo is required for student sellers.',
    path: ['student_id_card_url'],
}).refine((data) => !((data.store_type === 'physical' || data.store_type === 'both') && !data.store_address), {
    message: 'Store address is required for physical stores.',
    path: ['store_address'],
})

type OnboardForm = z.infer<typeof onboardSchema>

// Reusable section heading with a numbered badge — keeps the long page scannable.
function SectionHeader({
    n, title, subtitle, icon: Icon,
}: { n: number; title: string; subtitle?: string; icon: React.ElementType }) {
    return (
        <div className="flex items-start gap-4 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
                <h2 className="text-base font-bold text-gray-900">
                    <span className="text-brand-primary mr-1.5">{n}.</span>
                    {title}
                </h2>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    )
}

export default function SellerRegisterPage() {
    const router = useRouter()
    const { user, setUser } = useAuthStore()
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Pre-fill from the authenticated user. Spec says these "auto chole asbe".
    const initialBirthday = user?.birthday || ''
    const defaultValues: Partial<OnboardForm> = useMemo(() => ({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        gender: (user?.gender as 'male' | 'female' | 'other') || undefined,
        birthday: initialBirthday,
        profile_picture: user?.profile_picture || '',

        is_student_seller: user?.verification_status === 'approved',
        student_id_card_url: '',

        store_name: '',
        store_type: 'online',
        store_address: '',
        store_phone: user?.phone || '',
        store_email: user?.email || '',
        store_description: '',
        store_category: '',
        facebook_page: '',
        logo_url: '',
        banner_url: '',

        identity_doc_type: 'nid',
        document_number: '',
        document_image_url: '',
        document_back_image_url: '',

        mobile_banking_method: '',
        mobile_banking_number: '',
        bank_account_name: '',
        bank_account_number: '',
        bank_name: '',

        accepted_terms: false as unknown as true,
    }), [user, initialBirthday])

    const form = useForm<OnboardForm>({
        resolver: zodResolver(onboardSchema),
        defaultValues: defaultValues as OnboardForm,
    })

    // Refresh user once on mount so prefill is current.
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const fresh = await fetchMe()
                if (!cancelled && fresh) setUser(fresh)
            } catch { /* stale data ok */ }
        })()
        return () => { cancelled = true }
    }, [setUser])

    // Reset form when user data lands.
    useEffect(() => {
        if (user) {
            form.reset({ ...defaultValues, accepted_terms: form.getValues('accepted_terms') } as OnboardForm)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const onSubmit = async (data: OnboardForm) => {
        setSubmitting(true)
        try {
            const payload: SellerOnboardPayload = {
                full_name: data.full_name,
                phone: data.phone,
                email: data.email,
                gender: data.gender,
                birthday: data.birthday,
                profile_picture: data.profile_picture || undefined,
                is_student_seller: data.is_student_seller,
                student_id_card_url: data.student_id_card_url || undefined,
                store_name: data.store_name,
                store_type: data.store_type,
                store_address: data.store_address || undefined,
                store_phone: data.store_phone,
                store_email: data.store_email,
                store_description: data.store_description || undefined,
                store_category: data.store_category || undefined,
                facebook_page: data.facebook_page || undefined,
                logo_url: data.logo_url || undefined,
                banner_url: data.banner_url || undefined,
                identity_doc_type: data.identity_doc_type,
                document_number: data.document_number,
                document_image_url: data.document_image_url,
                document_back_image_url: data.document_back_image_url || undefined,
                mobile_banking_method: (data.mobile_banking_method as 'bkash' | 'nagad' | 'rocket') || undefined,
                mobile_banking_number: data.mobile_banking_number || undefined,
                bank_account_name: data.bank_account_name || undefined,
                bank_account_number: data.bank_account_number || undefined,
                bank_name: data.bank_name || undefined,
                accepted_terms: true,
            }
            await onboardSeller(payload)
            // Refresh user (so seller_application_status flips to 'pending' and Mall navbar updates).
            try { const fresh = await fetchMe(); if (fresh) setUser(fresh) } catch { /* ignore */ }
            setSubmitted(true)
        } catch (error: unknown) {
            const err = error as {
                response?: { data?: { message?: string; errors?: Record<string, string[]> } }
            }
            const errs = err.response?.data?.errors || {}
            const firstFieldError = Object.values(errs)[0]?.[0]
            toast.error(firstFieldError || err.response?.data?.message || 'Failed to submit. Please review the form and try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Submitted screen ────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center border border-gray-100">
                    <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                        Your seller application has been submitted. Our team typically responds within 24-48 hours.
                        You&apos;ll get an email when it&apos;s approved.
                    </p>
                    <div className="space-y-2">
                        <Button onClick={() => router.push('/seller')} className="w-full bg-brand-primary hover:bg-brand-dark">
                            Go to Seller Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Link href="/" className="block">
                            <Button variant="outline" className="w-full">Back to Home</Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ProfileGate featureName="Seller Registration">
            <div className="min-h-screen bg-surface-base pt-5 pb-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-dark mb-5 shadow-lg shadow-brand-primary/30">
                            <StoreIcon className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Become a Seller</h1>
                        <p className="mt-2 text-base text-gray-500">
                            Join CampusHat as a verified seller and reach thousands of students.
                        </p>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* SECTION 1 — Personal */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 space-y-6">
                            <SectionHeader n={1} title="Basic Information" subtitle="Pre-filled from your account. Edits sync back to your profile." icon={UserIcon} />

                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="md:w-[170px] shrink-0">
                                    <Controller
                                        control={form.control}
                                        name="profile_picture"
                                        render={({ field }) => (
                                            <ImageUpload
                                                value={field.value || ''}
                                                onChange={(url) => field.onChange(url || '')}
                                                category="avatar"
                                                variant="avatar"
                                                size={140}
                                                fallbackText={(form.watch('full_name') || user?.full_name || 'U').slice(0, 2).toUpperCase()}
                                                label="Your profile photo"
                                            />
                                        )}
                                    />
                                </div>

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label htmlFor="full_name">Full Name (per NID/Passport)</Label>
                                        <Input id="full_name" {...form.register('full_name')} />
                                        {form.formState.errors.full_name && (
                                            <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" type="tel" {...form.register('phone')} />
                                        {form.formState.errors.phone && (
                                            <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" {...form.register('email')} />
                                        {form.formState.errors.email && (
                                            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Gender</Label>
                                        <Controller
                                            control={form.control}
                                            name="gender"
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {form.formState.errors.gender && (
                                            <p className="text-xs text-destructive">{form.formState.errors.gender.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="birthday">Date of Birth (per NID)</Label>
                                        <Input id="birthday" type="date" {...form.register('birthday')} />
                                        {form.formState.errors.birthday && (
                                            <p className="text-xs text-destructive">{form.formState.errors.birthday.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2 — Student Verification */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 space-y-6">
                            <SectionHeader n={2} title="Student Verification" subtitle="Get extra banifit, if you're an active student." icon={GraduationCap} />

                            <Controller
                                control={form.control}
                                name="is_student_seller"
                                render={({ field }) => (
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="is_student_seller"
                                            checked={!!field.value}
                                            onCheckedChange={(v) => field.onChange(v === true)}
                                        />
                                        <Label htmlFor="is_student_seller" className="text-sm cursor-pointer">
                                            I am currently a student / faculty member
                                        </Label>
                                    </div>
                                )}
                            />

                            {form.watch('is_student_seller') && (
                                <div className="space-y-2 pl-7 border-l-2 border-brand-light">
                                    <Label>Upload Student / Faculty ID Card</Label>
                                    <Controller
                                        control={form.control}
                                        name="student_id_card_url"
                                        render={({ field }) => (
                                            <ImageUpload
                                                value={field.value || ''}
                                                onChange={(url) => field.onChange(url || '')}
                                                category="generic"
                                                variant="rectangle"
                                                label="A clear photo / scan of both sides if applicable."
                                            />
                                        )}
                                    />
                                    {form.formState.errors.student_id_card_url && (
                                        <p className="text-xs text-destructive">{form.formState.errors.student_id_card_url.message}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SECTION 3 — Store / Business */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 space-y-6">
                            <SectionHeader n={3} title="Store / Business Information" subtitle="This is what your customers will see on the Mall." icon={Building2} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="store_name">Store / Business Name</Label>
                                    <Input id="store_name" {...form.register('store_name')} placeholder="Your shop's display name" />
                                    {form.formState.errors.store_name && (
                                        <p className="text-xs text-destructive">{form.formState.errors.store_name.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Store Type</Label>
                                    <Controller
                                        control={form.control}
                                        name="store_type"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="online">Online only</SelectItem>
                                                    <SelectItem value="physical">Physical store</SelectItem>
                                                    <SelectItem value="both">Both online and physical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="store_category">Category (optional)</Label>
                                    <Input id="store_category" {...form.register('store_category')} placeholder="e.g. Fashion, Electronics, Food" />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="store_phone">Store Contact Number</Label>
                                    <Input id="store_phone" type="tel" {...form.register('store_phone')} />
                                    {form.formState.errors.store_phone && (
                                        <p className="text-xs text-destructive">{form.formState.errors.store_phone.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="store_email">Store Email Address</Label>
                                    <Input id="store_email" type="email" {...form.register('store_email')} />
                                    {form.formState.errors.store_email && (
                                        <p className="text-xs text-destructive">{form.formState.errors.store_email.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="store_address">
                                        Store Address {(form.watch('store_type') !== 'online') && <span className="text-destructive">*</span>}
                                    </Label>
                                    <Textarea id="store_address" {...form.register('store_address')} rows={2} placeholder="Required for physical / both-mode stores." />
                                    {form.formState.errors.store_address && (
                                        <p className="text-xs text-destructive">{form.formState.errors.store_address.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="facebook_page">Facebook Page (optional)</Label>
                                    <Input id="facebook_page" {...form.register('facebook_page')} placeholder="https://facebook.com/yourpage" />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="store_description">Short Description (optional)</Label>
                                    <Textarea id="store_description" {...form.register('store_description')} rows={3} placeholder="Tell shoppers what you sell and what makes your store special." />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <Controller
                                    control={form.control}
                                    name="logo_url"
                                    render={({ field }) => (
                                        <ImageUpload
                                            value={field.value || ''}
                                            onChange={(url) => field.onChange(url || '')}
                                            category="store_logo"
                                            variant="rectangle"
                                            label="Store Logo (optional)"
                                        />
                                    )}
                                />
                                <Controller
                                    control={form.control}
                                    name="banner_url"
                                    render={({ field }) => (
                                        <ImageUpload
                                            value={field.value || ''}
                                            onChange={(url) => field.onChange(url || '')}
                                            category="store_banner"
                                            variant="rectangle"
                                            label="Store Banner (optional)"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* SECTION 4 — Identity */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 space-y-6">
                            <SectionHeader n={4} title="Identity Verification" subtitle="Required by law. Used only for fraud prevention — never shown publicly." icon={ShieldCheck} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Document Type</Label>
                                    <Controller
                                        control={form.control}
                                        name="identity_doc_type"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="nid">National ID (NID)</SelectItem>
                                                    <SelectItem value="passport">Passport</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="document_number">Document Number</Label>
                                    <Input id="document_number" {...form.register('document_number')} />
                                    {form.formState.errors.document_number && (
                                        <p className="text-xs text-destructive">{form.formState.errors.document_number.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Controller
                                    control={form.control}
                                    name="document_image_url"
                                    render={({ field }) => (
                                        <div>
                                            <ImageUpload
                                                value={field.value || ''}
                                                onChange={(url) => field.onChange(url || '')}
                                                category="generic"
                                                variant="rectangle"
                                                label="Document — front side"
                                            />
                                            {form.formState.errors.document_image_url && (
                                                <p className="text-xs text-destructive mt-1">{form.formState.errors.document_image_url.message}</p>
                                            )}
                                        </div>
                                    )}
                                />
                                <Controller
                                    control={form.control}
                                    name="document_back_image_url"
                                    render={({ field }) => (
                                        <ImageUpload
                                            value={field.value || ''}
                                            onChange={(url) => field.onChange(url || '')}
                                            category="generic"
                                            variant="rectangle"
                                            label="Document — back side (NID only)"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* SECTION 5 — Payment (optional) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 space-y-6">
                            <SectionHeader n={5} title="Payout Method (Optional)" subtitle="How you want to receive money. You can also set this later from Settings." icon={MapPin} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Mobile Banking</Label>
                                    <Controller
                                        control={form.control}
                                        name="mobile_banking_method"
                                        render={({ field }) => (
                                            <Select value={field.value || ''} onValueChange={field.onChange}>
                                                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bkash">bKash</SelectItem>
                                                    <SelectItem value="nagad">Nagad</SelectItem>
                                                    <SelectItem value="rocket">Rocket</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="mobile_banking_number">Mobile Banking Number</Label>
                                    <Input id="mobile_banking_number" type="tel" {...form.register('mobile_banking_number')} placeholder="+8801XXXXXXXXX" />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-gray-100" />

                                <div className="space-y-1.5">
                                    <Label htmlFor="bank_account_name">Bank Account Holder</Label>
                                    <Input id="bank_account_name" {...form.register('bank_account_name')} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="bank_account_number">Bank Account Number</Label>
                                    <Input id="bank_account_number" {...form.register('bank_account_number')} />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="bank_name">Bank Name</Label>
                                    <Input id="bank_name" {...form.register('bank_name')} />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 6 — T&C */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8 space-y-4">
                            <SectionHeader n={6} title="Authorization & Agreement" icon={CheckCircle2} />

                            <Controller
                                control={form.control}
                                name="accepted_terms"
                                render={({ field }) => (
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="accepted_terms"
                                            checked={!!field.value}
                                            onCheckedChange={(v) => field.onChange(v === true)}
                                        />
                                        <Label htmlFor="accepted_terms" className="text-sm cursor-pointer leading-relaxed">
                                            I confirm that all the information provided is accurate and I agree to CampusHat&apos;s{' '}
                                            <Link href="/terms" target="_blank" className="text-brand-primary hover:underline">Terms &amp; Conditions</Link>{' '}
                                            and{' '}
                                            <Link href="/privacy" target="_blank" className="text-brand-primary hover:underline">Privacy Policy</Link>.
                                        </Label>
                                    </div>
                                )}
                            />
                            {form.formState.errors.accepted_terms && (
                                <p className="text-xs text-destructive">{form.formState.errors.accepted_terms.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full h-14 text-base font-bold bg-brand-primary hover:bg-brand-dark"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting Application...' : 'Submit Seller Application'}
                        </Button>

                        <p className="text-center text-xs text-gray-400 pb-8">
                            Admin approval typically takes 24-48 hours. You&apos;ll receive an email when it&apos;s done.
                        </p>
                    </form>
                </div>
            </div>
        </ProfileGate>
    )
}
