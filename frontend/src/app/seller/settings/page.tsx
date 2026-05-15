'use client'

/**
 * Seller Settings — Daraz-style, three sections:
 *
 *  1. Basic Seller Information (synced with general profile)
 *     - Profile picture, full name, phone, email
 *     - Auto-filled from the user's general profile
 *     - Edits here also update the general profile
 *
 *  2. Store / Business Information
 *     - Store name, logo, banner, description, type, address, contact,
 *       category, Facebook page, banner colour
 *
 *  3. Payout Settings
 *     - Mobile banking (bKash / Nagad / Rocket)
 *     - Bank account details
 *     - Commission rate (read-only)
 */

import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { normalizeSingleResponse } from '@/lib/response'
import { useAuthStore } from '@/stores/auth.store'
import { updateMe } from '@/services/profile.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/common/ImageUpload'
import {
    Loader2, User as UserIcon, Store as StoreIcon, Wallet,
    CheckCircle2, Info,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Schemas ──────────────────────────────────────────────────────────

const profileSchema = z.object({
    profile_picture: z.string().optional().or(z.literal('')),
    full_name: z.string().min(2, 'Full name is required'),
    phone: z.string().min(10, 'Valid phone is required'),
    email: z.string().email('Valid email is required'),
})

const storeSchema = z.object({
    name: z.string().min(2, 'Store name is required'),
    description: z.string().optional().or(z.literal('')),
    logo_url: z.string().optional().or(z.literal('')),
    banner_url: z.string().optional().or(z.literal('')),
    banner_color: z.string().optional().or(z.literal('')),
    store_type: z.enum(['online', 'physical', 'both']),
    store_category: z.string().optional().or(z.literal('')),
    store_address: z.string().optional().or(z.literal('')),
    business_phone: z.string().min(10, 'Store phone is required'),
    business_email: z.string().email('Valid email').optional().or(z.literal('')),
    facebook_page: z.string().optional().or(z.literal('')),
})

const payoutSchema = z.object({
    mobile_banking_method: z.string().optional().or(z.literal('')),
    mobile_banking_number: z.string().optional().or(z.literal('')),
    bank_account_name: z.string().optional().or(z.literal('')),
    bank_account_number: z.string().optional().or(z.literal('')),
    bank_name: z.string().optional().or(z.literal('')),
})

type ProfileForm = z.infer<typeof profileSchema>
type StoreForm = z.infer<typeof storeSchema>
type PayoutForm = z.infer<typeof payoutSchema>

// ─── Section Header ───────────────────────────────────────────────────

function SectionHeader({
    icon: Icon, title, subtitle,
}: { icon: React.ElementType; title: string; subtitle?: string }) {
    return (
        <div className="flex items-start gap-3 pb-4 border-b border-gray-100 mb-5">
            <div className="w-10 h-10 bg-[#4C3B8A]/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-[#4C3B8A]" />
            </div>
            <div>
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    )
}

// ─── Save Success Badge ──────────────────────────────────────────────

function SavedBadge({ show }: { show: boolean }) {
    if (!show) return null
    return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
        </span>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function SellerSettingsPage() {
    const queryClient = useQueryClient()
    const { user, setUser } = useAuthStore()
    const [savedProfile, setSavedProfile] = React.useState(false)
    const [savedStore, setSavedStore] = React.useState(false)
    const [savedPayout, setSavedPayout] = React.useState(false)

    // Fetch store data — backend returns { success, data: {...store} } so we unwrap it
    const { data: store } = useQuery({
        queryKey: ['my-store'],
        queryFn: () => api.get('/stores/my-store/')
            .then(r => normalizeSingleResponse(r.data))
            .catch(() => null),
        staleTime: 300_000,
    })

    // ─── SECTION 1: Basic Seller Information (synced with profile) ────

    const profileForm = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema) as any,
        defaultValues: {
            profile_picture: '',
            full_name: '',
            phone: '',
            email: '',
        },
    })

    // Auto-fill from user (general profile)
    useEffect(() => {
        if (user) {
            profileForm.reset({
                profile_picture: user.profile_picture || '',
                full_name: user.full_name || '',
                phone: user.phone || '',
                email: user.email || '',
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const profileMutation = useMutation({
        mutationFn: async (data: ProfileForm) => {
            // Update general profile — syncs back to seller info
            const updated = await updateMe({
                full_name: data.full_name,
                phone: data.phone,
                profile_picture: data.profile_picture || null,
            })
            return updated
        },
        onSuccess: (updated) => {
            if (updated) setUser(updated)
            toast.success('Profile updated!')
            setSavedProfile(true)
            setTimeout(() => setSavedProfile(false), 3000)
        },
        onError: () => toast.error('Failed to update profile'),
    })

    // ─── SECTION 2: Store / Business Information ─────────────────────

    const storeForm = useForm<StoreForm>({
        resolver: zodResolver(storeSchema) as any,
        defaultValues: {
            name: '',
            description: '',
            logo_url: '',
            banner_url: '',
            banner_color: '#4C3B8A',
            store_type: 'online',
            store_category: '',
            store_address: '',
            business_phone: '',
            business_email: '',
            facebook_page: '',
        },
    })

    useEffect(() => {
        if (store) {
            storeForm.reset({
                name: store.name || '',
                description: store.description || '',
                logo_url: store.logo_url || store.logo || '',
                banner_url: store.banner_url || store.banner || '',
                banner_color: store.banner_color || '#4C3B8A',
                store_type: store.store_type || 'online',
                store_category: store.store_category || '',
                store_address: store.store_address || '',
                business_phone: store.business_phone || '',
                business_email: store.business_email || '',
                facebook_page: store.facebook_page || '',
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store])

    const storeMutation = useMutation({
        mutationFn: (data: StoreForm) => {
            // Map logo_url / banner_url to the backend field names if needed
            const payload: Record<string, unknown> = { ...data }
            // Backend may accept 'logo' or 'logo_url'
            if (!store?.logo_url && store?.logo !== undefined) {
                payload.logo = data.logo_url
                payload.banner = data.banner_url
            }
            return api.patch('/stores/my-store/update/', payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-store'] })
            toast.success('Store settings updated!')
            setSavedStore(true)
            setTimeout(() => setSavedStore(false), 3000)
        },
        onError: () => toast.error('Failed to update store settings'),
    })

    // ─── SECTION 3: Payout Settings ──────────────────────────────────

    const payoutForm = useForm<PayoutForm>({
        resolver: zodResolver(payoutSchema) as any,
        defaultValues: {
            mobile_banking_method: '',
            mobile_banking_number: '',
            bank_account_name: '',
            bank_account_number: '',
            bank_name: '',
        },
    })

    useEffect(() => {
        if (store) {
            payoutForm.reset({
                mobile_banking_method: store.mobile_banking_method || '',
                mobile_banking_number: store.mobile_banking_number || '',
                bank_account_name: store.bank_account_name || '',
                bank_account_number: store.bank_account_number || '',
                bank_name: store.bank_name || '',
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store])

    const payoutMutation = useMutation({
        mutationFn: (data: PayoutForm) =>
            api.patch('/stores/my-store/update/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-store'] })
            toast.success('Payout settings updated!')
            setSavedPayout(true)
            setTimeout(() => setSavedPayout(false), 3000)
        },
        onError: () => toast.error('Failed to update payout settings'),
    })

    // ─── Input helper class ──────────────────────────────────────────

    const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] bg-gray-50'

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="mb-2">
                <h1 className="font-bold text-2xl text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your seller profile, store details, and payout information.</p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 1 — Basic Seller Information
               ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
                <SectionHeader
                    icon={UserIcon}
                    title="Basic Seller Information"
                    subtitle="Auto-filled from your account. Edits sync to your general profile."
                />

                <form
                    onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))}
                    className="space-y-5"
                >
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Picture */}
                        <div className="md:w-[150px] shrink-0">
                            <Controller
                                control={profileForm.control}
                                name="profile_picture"
                                render={({ field }) => (
                                    <ImageUpload
                                        value={field.value || ''}
                                        onChange={(url) => field.onChange(url || '')}
                                        category="avatar"
                                        variant="avatar"
                                        size={120}
                                        fallbackText={
                                            (profileForm.watch('full_name') || user?.full_name || 'U')
                                                .slice(0, 2).toUpperCase()
                                        }
                                        label="Profile photo"
                                    />
                                )}
                            />
                        </div>

                        {/* Fields */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="pf_full_name">Full Name (per NID/Passport)</Label>
                                <input
                                    id="pf_full_name"
                                    {...profileForm.register('full_name')}
                                    className={inputCls}
                                />
                                {profileForm.formState.errors.full_name && (
                                    <p className="text-xs text-red-500">{profileForm.formState.errors.full_name.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="pf_phone">Phone Number</Label>
                                <input
                                    id="pf_phone"
                                    type="tel"
                                    {...profileForm.register('phone')}
                                    className={inputCls}
                                />
                                {profileForm.formState.errors.phone && (
                                    <p className="text-xs text-red-500">{profileForm.formState.errors.phone.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="pf_email">Email Address</Label>
                                <input
                                    id="pf_email"
                                    type="email"
                                    {...profileForm.register('email')}
                                    className={inputCls}
                                    disabled
                                />
                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Email can only be changed from your Account Settings.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={profileMutation.isPending}
                            className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2"
                        >
                            {profileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Profile
                        </Button>
                        <SavedBadge show={savedProfile} />
                    </div>
                </form>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 2 — Store / Business Information
               ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
                <SectionHeader
                    icon={StoreIcon}
                    title="Store / Business Information"
                    subtitle="This is what customers see on your store page."
                />

                <form
                    onSubmit={storeForm.handleSubmit(d => storeMutation.mutate(d))}
                    className="space-y-5"
                >
                    {/* Store Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="st_name">Store Name *</Label>
                        <input
                            id="st_name"
                            {...storeForm.register('name')}
                            className={inputCls}
                            placeholder="Your store's display name"
                        />
                        {storeForm.formState.errors.name && (
                            <p className="text-xs text-red-500">{storeForm.formState.errors.name.message}</p>
                        )}
                    </div>

                    {/* Logo + Banner — side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Controller
                            control={storeForm.control}
                            name="logo_url"
                            render={({ field }) => (
                                <ImageUpload
                                    value={field.value || ''}
                                    onChange={(url) => field.onChange(url || '')}
                                    category="store_logo"
                                    variant="rectangle"
                                    label="Store Logo"
                                />
                            )}
                        />
                        <Controller
                            control={storeForm.control}
                            name="banner_url"
                            render={({ field }) => (
                                <ImageUpload
                                    value={field.value || ''}
                                    onChange={(url) => field.onChange(url || '')}
                                    category="store_banner"
                                    variant="rectangle"
                                    label="Store Banner"
                                />
                            )}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="st_desc">Store Description</Label>
                        <textarea
                            id="st_desc"
                            rows={3}
                            {...storeForm.register('description')}
                            className={`${inputCls} resize-none`}
                            placeholder="Tell customers what your store is about..."
                        />
                    </div>

                    {/* Row: Store Type + Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Store Type</Label>
                            <Controller
                                control={storeForm.control}
                                name="store_type"
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="text-sm border-gray-200 bg-gray-50 focus:ring-[#4C3B8A]">
                                            <SelectValue />
                                        </SelectTrigger>
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
                            <Label htmlFor="st_cat">Category</Label>
                            <input
                                id="st_cat"
                                {...storeForm.register('store_category')}
                                className={inputCls}
                                placeholder="e.g. Fashion, Electronics, Food"
                            />
                        </div>
                    </div>

                    {/* Store Address (highlighted when physical/both) */}
                    <div className="space-y-1.5">
                        <Label htmlFor="st_address">
                            Store Address
                            {(storeForm.watch('store_type') !== 'online') && (
                                <span className="text-red-500 ml-1">*</span>
                            )}
                        </Label>
                        <textarea
                            id="st_address"
                            rows={2}
                            {...storeForm.register('store_address')}
                            className={`${inputCls} resize-none`}
                            placeholder="Required for physical / both-mode stores"
                        />
                    </div>

                    {/* Row: Store Phone + Store Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="st_phone">Store Contact Number *</Label>
                            <input
                                id="st_phone"
                                type="tel"
                                {...storeForm.register('business_phone')}
                                className={inputCls}
                            />
                            {storeForm.formState.errors.business_phone && (
                                <p className="text-xs text-red-500">{storeForm.formState.errors.business_phone.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="st_email">Store Email</Label>
                            <input
                                id="st_email"
                                type="email"
                                {...storeForm.register('business_email')}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Facebook Page */}
                    <div className="space-y-1.5">
                        <Label htmlFor="st_fb">Facebook Page</Label>
                        <input
                            id="st_fb"
                            {...storeForm.register('facebook_page')}
                            className={inputCls}
                            placeholder="https://facebook.com/yourpage"
                        />
                    </div>

                    {/* Banner Color */}
                    <div className="space-y-1.5">
                        <Label>Banner Color</Label>
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

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={storeMutation.isPending}
                            className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2"
                        >
                            {storeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Store Settings
                        </Button>
                        <SavedBadge show={savedStore} />
                    </div>
                </form>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION 3 — Payout Settings
               ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
                <SectionHeader
                    icon={Wallet}
                    title="Payout Settings"
                    subtitle="How you receive your earnings from CampusHat."
                />

                <form
                    onSubmit={payoutForm.handleSubmit(d => payoutMutation.mutate(d))}
                    className="space-y-5"
                >
                    {/* Mobile Banking */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Mobile Banking</Label>
                            <Controller
                                control={payoutForm.control}
                                name="mobile_banking_method"
                                render={({ field }) => (
                                    <Select value={field.value || ''} onValueChange={field.onChange}>
                                        <SelectTrigger className="text-sm border-gray-200 bg-gray-50 focus:ring-[#4C3B8A]">
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
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
                            <Label htmlFor="po_mb_num">Mobile Banking Number</Label>
                            <input
                                id="po_mb_num"
                                type="tel"
                                {...payoutForm.register('mobile_banking_number')}
                                className={inputCls}
                                placeholder="+8801XXXXXXXXX"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Bank Account */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="po_bank_name">Bank Name</Label>
                            <input
                                id="po_bank_name"
                                {...payoutForm.register('bank_name')}
                                className={inputCls}
                                placeholder="e.g. Dutch Bangla Bank"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="po_bank_holder">Account Holder Name</Label>
                            <input
                                id="po_bank_holder"
                                {...payoutForm.register('bank_account_name')}
                                className={inputCls}
                            />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="po_bank_acc">Bank Account Number</Label>
                            <input
                                id="po_bank_acc"
                                {...payoutForm.register('bank_account_number')}
                                className={inputCls}
                                placeholder="Account number"
                            />
                        </div>
                    </div>

                    {/* Commission Info (Read Only) */}
                    {store?.commission_rate !== undefined && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
                            <div className="w-9 h-9 bg-[#4C3B8A]/10 rounded-lg flex items-center justify-center shrink-0">
                                <Info className="h-4 w-4 text-[#4C3B8A]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    Commission Rate: <span className="text-[#4C3B8A]">{store.commission_rate}%</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Set by CampusHat admin. Student sellers enjoy a reduced rate of 7%.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={payoutMutation.isPending}
                            className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2"
                        >
                            {payoutMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Payout Settings
                        </Button>
                        <SavedBadge show={savedPayout} />
                    </div>
                </form>
            </div>
        </div>
    )
}
