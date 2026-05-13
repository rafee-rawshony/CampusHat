'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Info, Loader2, ShoppingBag, Key, Briefcase, UtensilsCrossed } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { AdTypeSelector, AdType } from './AdTypeSelector'
import { PhotoUploadSection } from './PhotoUploadSection'
import { MarketplaceCategorySelector } from './MarketplaceCategorySelector'
import { SellItemFields } from './forms/SellItemFields'
import { RentalFields } from './forms/RentalFields'
import { ServiceFields } from './forms/ServiceFields'
import { FoodFields } from './forms/FoodFields'

const postAdSchema = z.object({
    post_type: z.enum(['buy', 'rental', 'service', 'food']),
    title: z.string()
        .min(5, 'Title must be at least 5 characters')
        .max(300, 'Title too long'),
    description: z.string()
        .min(20, 'Description must be at least 20 characters')
        .max(1000, 'Description too long'),
    category: z.string().min(1, 'Please select a category'),
    subcategory: z.string().optional(),
    condition: z.string().optional(),
    price: z.coerce.number().positive('Price must be greater than 0'),
    duration_days: z.coerce.number().refine(v => [7, 15, 30, 90, 180].includes(v), 'Invalid duration'),
    is_negotiable: z.boolean().default(false),
    images: z.array(z.object({
        url: z.string().url('Must be a valid URL').or(z.literal(''))
    })).optional(),
    // Sell fields
    brand: z.string().optional(),
    model_name: z.string().optional(),
    usage_duration: z.string().optional(),
    delivery_option: z.string().optional(),
    // Rent fields
    location: z.string().optional(),
    availability_date: z.string().optional(),
    rental_duration: z.string().optional(),
    deposit_amount: z.coerce.number().optional(),
    facilities: z.string().optional(),
    room_details: z.string().optional(),
    rules_conditions: z.string().optional(),
    contact_preference: z.string().optional(),
    // Service fields
    skills: z.string().optional(),
    experience: z.string().optional(),
    delivery_time: z.string().optional(),
    availability_hours: z.string().optional(),
    portfolio_url: z.string().url().optional().or(z.literal('')),
    previous_work_desc: z.string().optional(),
    // Food fields
    ingredients: z.string().optional(),
    portion_size: z.string().optional(),
    delivery_area: z.string().optional(),
    food_delivery_time: z.string().optional(),
    daily_availability: z.string().optional(),
    hygiene_certification: z.string().optional(),
    combo_packages: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.post_type === 'buy' && !data.condition) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Condition is required for sell items",
            path: ['condition']
        })
    }

    if ((data.post_type === 'buy' || data.post_type === 'rental') && ![7, 15, 30].includes(data.duration_days)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Sell and rental ads can run for 7, 15, or 30 days',
            path: ['duration_days']
        })
    }

    if ((data.post_type === 'service' || data.post_type === 'food') && ![30, 90, 180].includes(data.duration_days)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Service and food ads can run for 30, 90, or 180 days',
            path: ['duration_days']
        })
    }
})

type PostAdFormData = z.infer<typeof postAdSchema>

interface PostAdFormProps {
    editId?: string | null
}

const POST_TYPE_TO_AD_TYPE: Record<string, string> = {
    buy: 'sell',
    rental: 'rent',
    service: 'service',
    food: 'food',
}

const TYPE_THEMES: Record<string, { accent: string; accentBg: string; ring: string; gradient: string; icon: React.ReactNode; label: string; pricePlaceholder: string; priceHelper: string; titlePlaceholder: string; descPlaceholder: string }> = {
    buy: {
        accent: 'text-blue-600',
        accentBg: 'bg-blue-600',
        ring: 'focus-visible:ring-blue-500',
        gradient: 'from-blue-600 to-indigo-600',
        icon: <ShoppingBag className="w-5 h-5" />,
        label: 'Sell Item',
        pricePlaceholder: 'Asking price',
        priceHelper: 'Set a competitive price for your item.',
        titlePlaceholder: 'e.g. Samsung Galaxy S24 Ultra — 256GB, Mint Condition',
        descPlaceholder: 'Describe your product in detail — condition, features, reason for selling, what\'s included in the box...',
    },
    rental: {
        accent: 'text-violet-600',
        accentBg: 'bg-violet-600',
        ring: 'focus-visible:ring-violet-500',
        gradient: 'from-violet-600 to-purple-600',
        icon: <Key className="w-5 h-5" />,
        label: 'For Rent',
        pricePlaceholder: 'Monthly rent',
        priceHelper: 'Monthly rent amount in BDT.',
        titlePlaceholder: 'e.g. Furnished Room near BUET — WiFi, AC Included',
        descPlaceholder: 'Describe the property — room type, furnished/unfurnished, nearby landmarks, transportation, neighborhood...',
    },
    service: {
        accent: 'text-emerald-600',
        accentBg: 'bg-emerald-600',
        ring: 'focus-visible:ring-emerald-500',
        gradient: 'from-emerald-600 to-teal-600',
        icon: <Briefcase className="w-5 h-5" />,
        label: 'Service',
        pricePlaceholder: 'Starting price',
        priceHelper: 'Base rate per session, hour, or project.',
        titlePlaceholder: 'e.g. Professional Graphic Design — Logo, Banner, Social Media',
        descPlaceholder: 'Describe your service — what you offer, your process, turnaround time, what clients can expect...',
    },
    food: {
        accent: 'text-red-500',
        accentBg: 'bg-red-500',
        ring: 'focus-visible:ring-red-500',
        gradient: 'from-red-500 to-orange-500',
        icon: <UtensilsCrossed className="w-5 h-5" />,
        label: 'Food',
        pricePlaceholder: 'Price per portion',
        priceHelper: 'Price for a single serving/portion.',
        titlePlaceholder: 'e.g. Homemade Chicken Biryani — Freshly Cooked Daily',
        descPlaceholder: 'Describe your food — taste profile, cooking method, what makes it special, allergen info...',
    },
}

export function PostAdForm({ editId }: PostAdFormProps) {
    const router = useRouter()
    const { user } = useAuthStore()
    const [rejectionReason, setRejectionReason] = useState<string | null>(null)

    const form = useForm<PostAdFormData>({
        resolver: zodResolver(postAdSchema as any),
        defaultValues: {
            post_type: 'buy',
            title: '',
            description: '',
            category: '',
            subcategory: '',
            condition: 'good',
            price: 0,
            duration_days: 15,
            is_negotiable: false,
            images: [],
            brand: '', model_name: '', usage_duration: '', delivery_option: '',
            location: '', availability_date: '', rental_duration: '',
            deposit_amount: 0, facilities: '', room_details: '',
            rules_conditions: '', contact_preference: '',
            skills: '', experience: '', delivery_time: '',
            availability_hours: '', portfolio_url: '', previous_work_desc: '',
            ingredients: '', portion_size: '', delivery_area: '',
            food_delivery_time: '', daily_availability: '',
            hygiene_certification: '', combo_packages: '',
        }
    })

    const { control, register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form
    const currentType = watch('post_type')
    const description = watch('description') || ''
    const selectedCategory = watch('category')
    const selectedSubcategory = watch('subcategory')

    const adType = POST_TYPE_TO_AD_TYPE[currentType] || currentType
    const theme = TYPE_THEMES[currentType] || TYPE_THEMES.buy

    const handleCategoryChange = useCallback((val: string) => setValue('category', val), [setValue])
    const handleSubcategoryChange = useCallback((val: string) => setValue('subcategory', val), [setValue])

    useEffect(() => {
        if (editId) {
            api.get(`/marketplace/listings/${editId}/`)
                .then(res => {
                    const data = res.data?.data || res.data
                    if (data.status === 'rejected' && data.rejection_reason) {
                        setRejectionReason(data.rejection_reason)
                    }
                    reset({
                        post_type: (data.post_type === 'sell' ? 'buy' : data.post_type === 'rent' ? 'rental' : data.post_type) as AdType,
                        title: data.title,
                        description: data.description,
                        category: data.category?.id || data.category?.slug || data.category || '',
                        subcategory: '',
                        condition: (data.post_type === 'rent' || data.post_type === 'rental') ? '' : (data.condition || 'good'),
                        price: Number(data.price),
                        duration_days: 15,
                        is_negotiable: Boolean(data.is_negotiable),
                        images: Array.isArray(data.images) && data.images.length > 0
                            ? data.images.map((img: any) => ({ url: typeof img === 'string' ? img : (img.image_url || img.image) }))
                            : [],
                        // Sell
                        brand: data.brand || '',
                        model_name: data.model_name || '',
                        usage_duration: data.usage_duration || '',
                        delivery_option: data.delivery_option || '',
                        // Rent
                        location: data.location || '',
                        availability_date: data.availability_date || '',
                        rental_duration: data.rental_duration || '',
                        deposit_amount: Number(data.deposit_amount) || 0,
                        facilities: data.facilities || '',
                        room_details: data.room_details || '',
                        rules_conditions: data.rules_conditions || '',
                        contact_preference: data.contact_preference || '',
                        // Service
                        skills: data.skills || '',
                        experience: data.experience || '',
                        delivery_time: data.delivery_time || '',
                        availability_hours: data.availability_hours || '',
                        portfolio_url: data.portfolio_url || '',
                        previous_work_desc: data.previous_work_desc || '',
                        // Food
                        ingredients: data.ingredients || '',
                        portion_size: data.portion_size || '',
                        delivery_area: data.delivery_area || '',
                        food_delivery_time: data.food_delivery_time || '',
                        daily_availability: data.daily_availability || '',
                        hygiene_certification: data.hygiene_certification || '',
                        combo_packages: data.combo_packages || '',
                    })
                })
                .catch(() => {
                    toast.error('Failed to load listing data.')
                })
        }
    }, [editId, reset])

    useEffect(() => {
        if (!editId) {
            setValue('category', '')
            setValue('subcategory', '')
            if (currentType === 'service' || currentType === 'food' || currentType === 'rental') {
                setValue('condition', '')
                setValue('duration_days', currentType === 'rental' ? 15 : 30)
            } else {
                setValue('condition', 'good')
                setValue('duration_days', 15)
            }
        }
    }, [currentType, setValue, editId])

    const onSubmit = async (data: PostAdFormData) => {
        try {
            const urlList = (data.images || [])
                .map(img => img.url)
                .filter(url => url && url.trim().length > 0)

            const finalCategory = data.subcategory || data.category

            const payload: Record<string, any> = {
                post_type: adType,
                title: data.title,
                description: data.description,
                category: finalCategory,
                price: data.price,
                duration_days: data.duration_days,
                is_negotiable: data.is_negotiable,
                images: urlList,
                ...(data.condition ? { condition: data.condition } : {}),
            }

            if (currentType === 'buy') {
                if (data.brand) payload.brand = data.brand
                if (data.model_name) payload.model_name = data.model_name
                if (data.usage_duration) payload.usage_duration = data.usage_duration
                if (data.delivery_option) payload.delivery_option = data.delivery_option
            }
            if (currentType === 'rental') {
                if (data.location) payload.location = data.location
                if (data.availability_date) payload.availability_date = data.availability_date
                if (data.rental_duration) payload.rental_duration = data.rental_duration
                if (data.deposit_amount) payload.deposit_amount = data.deposit_amount
                if (data.facilities) payload.facilities = data.facilities
                if (data.room_details) payload.room_details = data.room_details
                if (data.rules_conditions) payload.rules_conditions = data.rules_conditions
                if (data.contact_preference) payload.contact_preference = data.contact_preference
            }
            if (currentType === 'service') {
                if (data.skills) payload.skills = data.skills
                if (data.experience) payload.experience = data.experience
                if (data.delivery_time) payload.delivery_time = data.delivery_time
                if (data.availability_hours) payload.availability_hours = data.availability_hours
                if (data.portfolio_url) payload.portfolio_url = data.portfolio_url
                if (data.previous_work_desc) payload.previous_work_desc = data.previous_work_desc
            }
            if (currentType === 'food') {
                if (data.ingredients) payload.ingredients = data.ingredients
                if (data.portion_size) payload.portion_size = data.portion_size
                if (data.delivery_area) payload.delivery_area = data.delivery_area
                if (data.food_delivery_time) payload.food_delivery_time = data.food_delivery_time
                if (data.daily_availability) payload.daily_availability = data.daily_availability
                if (data.hygiene_certification) payload.hygiene_certification = data.hygiene_certification
                if (data.combo_packages) payload.combo_packages = data.combo_packages
            }

            if (editId) {
                await api.patch(`/marketplace/listings/${editId}/`, payload)
                toast.success('Ad updated! Your ad has been resubmitted for review.')
            } else {
                await api.post('/marketplace/listings/', payload)
                toast.success("Ad submitted for review! We'll notify you when approved.")
            }
            router.push('/marketplace/my-ads')

        } catch (error: any) {
            const resData = error.response?.data
            const fieldErrors = resData?.errors || resData
            if (fieldErrors && typeof fieldErrors === 'object') {
                let hasMappedError = false
                const unmappedErrors: string[] = []
                Object.keys(fieldErrors).forEach(key => {
                    const msg = Array.isArray(fieldErrors[key]) ? fieldErrors[key][0] : fieldErrors[key]
                    const errorStr = typeof msg === 'string' ? msg : String(msg)
                    if (key in data) {
                        form.setError(key as any, { type: 'server', message: errorStr })
                        hasMappedError = true
                    } else if (key !== 'message' && key !== 'success') {
                        unmappedErrors.push(errorStr)
                    }
                })

                if (unmappedErrors.length > 0) {
                    toast.error(`Error: ${unmappedErrors.join(', ')}`, { duration: 5000 })
                } else if (!hasMappedError) {
                    toast.error(resData?.message || resData?.detail || 'Submission failed. Please check your inputs and try again.')
                } else {
                    toast.error('Validation failed. Please check the errors below.')
                }
            } else {
                toast.error(resData?.message || resData?.detail || 'Submission failed. Please check your inputs and try again.')
            }
        }
    }

    const durationOptions = currentType === 'service' || currentType === 'food'
        ? [30, 90, 180]
        : [7, 15, 30]

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-red-800">Your ad was rejected</h3>
                        <p className="text-sm text-red-700 mt-1">{rejectionReason}</p>
                        <p className="text-xs text-red-500 mt-2">Fix the issue and save changes to resubmit for review.</p>
                    </div>
                </div>
            )}

            {/* Step 1: Type Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <Controller
                    name="post_type"
                    control={control}
                    render={({ field }) => (
                        <AdTypeSelector value={field.value} onChange={field.onChange} />
                    )}
                />
            </div>

            {/* Step 2: Basic Info — themed per type */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`bg-gradient-to-r ${theme.gradient} px-6 py-3 flex items-center gap-2 text-white`}>
                    {theme.icon}
                    <h2 className="font-bold">{theme.label} — Basic Information</h2>
                </div>
                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="title" className="font-semibold text-gray-800">Title</Label>
                        <Input
                            {...register('title')}
                            placeholder={theme.titlePlaceholder}
                            className={`w-full ${errors.title ? 'border-red-500 focus-visible:ring-red-500' : theme.ring}`}
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="font-semibold text-gray-800">Description</Label>
                        <Textarea
                            {...register('description')}
                            placeholder={theme.descPlaceholder}
                            rows={4}
                            className={`w-full resize-y ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : theme.ring}`}
                        />
                        <div className="flex justify-between items-center">
                            {errors.description ? (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            ) : <span />}
                            <span className="text-xs text-gray-400">
                                {description.length}/1000
                            </span>
                        </div>
                    </div>

                    <MarketplaceCategorySelector
                        adType={adType}
                        selectedCategoryId={selectedCategory}
                        selectedSubcategoryId={selectedSubcategory || ''}
                        onCategoryChange={handleCategoryChange}
                        onSubcategoryChange={handleSubcategoryChange}
                        error={errors.category?.message}
                    />
                </div>
            </div>

            {/* Step 3: Photos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <PhotoUploadSection control={control} register={register} errors={errors} />
            </div>

            {/* Step 4: Type-Specific Fields */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`bg-gradient-to-r ${theme.gradient} px-6 py-3 flex items-center gap-2 text-white`}>
                    {theme.icon}
                    <h2 className="font-bold">{theme.label} — Specific Details</h2>
                </div>
                <div className="p-6">
                    {currentType === 'buy' && <SellItemFields form={form} />}
                    {currentType === 'rental' && <RentalFields form={form} />}
                    {currentType === 'service' && <ServiceFields form={form} />}
                    {currentType === 'food' && <FoodFields form={form} />}
                </div>
            </div>

            {/* Step 5: Pricing & Visibility */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`bg-gradient-to-r ${theme.gradient} px-6 py-3 flex items-center gap-2 text-white`}>
                    {theme.icon}
                    <h2 className="font-bold">Pricing & Visibility</h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label className="font-semibold text-gray-800">Price (৳)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">৳</span>
                                <Input
                                    {...register('price')}
                                    type="number"
                                    step="0.01"
                                    placeholder={theme.pricePlaceholder}
                                    className={`pl-8 ${errors.price ? 'border-red-500 focus-visible:ring-red-500' : theme.ring}`}
                                />
                            </div>
                            <p className="text-xs text-gray-500">{theme.priceHelper}</p>
                            {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="font-semibold text-gray-800">Listing Duration</Label>
                            <Controller
                                name="duration_days"
                                control={control}
                                render={({ field }) => (
                                    <Select value={String(field.value)} onValueChange={(val) => field.onChange(Number(val))}>
                                        <SelectTrigger className={`${errors.duration_days ? 'border-red-500' : ''}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {durationOptions.map(days => (
                                                <SelectItem key={days} value={String(days)}>{days} Days</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <p className="text-xs text-gray-500">Your ad will automatically expire after this period.</p>
                            {errors.duration_days && <p className="text-sm text-red-500">{errors.duration_days.message}</p>}
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 mt-6 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            <strong>Automatic Campus Detection:</strong> This ad will be listed for <strong>{user?.university_name || 'your campus'}</strong>. Only verified users from your campus will see this in their local feed.
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                    type="button"
                    onClick={() => router.push('/marketplace')}
                    className="text-gray-600 hover:text-gray-900 font-medium order-2 sm:order-1"
                    disabled={isSubmitting}
                >
                    &larr; Cancel
                </button>

                <Button
                    type="submit"
                    className={`w-full sm:w-auto bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white font-semibold px-8 py-3 rounded-lg order-1 sm:order-2 h-auto shadow-lg`}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : editId ? 'Save Changes' : 'Submit for Review'}
                </Button>
            </div>
        </form>
    )
}
