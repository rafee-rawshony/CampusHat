'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Info, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { AdTypeSelector, AdType } from './AdTypeSelector'
import { PhotoUploadSection } from './PhotoUploadSection'
import { MarketplaceCategorySelector } from './MarketplaceCategorySelector'

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
    is_anonymous: z.boolean().default(false),
    images: z.array(z.object({
        url: z.string().url('Must be a valid URL').or(z.literal(''))
    })).optional(),
}).superRefine((data, ctx) => {
    if (data.post_type === 'buy' && !data.condition) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Condition is required for this ad type",
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

// Maps frontend post_type values to backend ad_type values
const POST_TYPE_TO_AD_TYPE: Record<string, string> = {
    buy: 'sell',
    rental: 'rent',
    service: 'service',
    food: 'food',
}

const CONDITIONS = [
    { label: 'Like New', value: 'like_new' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'For Parts', value: 'for_parts' },
]

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
            is_anonymous: false,
            images: [],
        }
    })

    const { control, register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form
    const currentType = watch('post_type')
    const description = watch('description') || ''
    const selectedCategory = watch('category')
    const selectedSubcategory = watch('subcategory')

    // Map frontend post_type to backend ad_type for API calls
    const adType = POST_TYPE_TO_AD_TYPE[currentType] || currentType

    // Stable callbacks for category selector
    const handleCategoryChange = useCallback((val: string) => setValue('category', val), [setValue])
    const handleSubcategoryChange = useCallback((val: string) => setValue('subcategory', val), [setValue])

    // Edit Mode Loader
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
                        is_anonymous: Boolean(data.is_anonymous),
                        images: Array.isArray(data.images) && data.images.length > 0
                            ? data.images.map((img: any) => ({ url: typeof img === 'string' ? img : (img.image_url || img.image) }))
                            : [{ url: '' }]
                    })
                })
                .catch(() => {
                    toast.error('Failed to load listing data.')
                })
        }
    }, [editId, reset])

    // Reset category selection when ad type changes
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
            // Clean up URLs, mapping to string[]
            const urlList = (data.images || [])
                .map(img => img.url)
                .filter(url => url && url.trim().length > 0)

            // Send subcategory as the category if selected, otherwise send the parent category
            const finalCategory = data.subcategory || data.category

            const payload = {
                post_type: adType,
                title: data.title,
                description: data.description,
                category: finalCategory,
                price: data.price,
                duration_days: data.duration_days,
                is_anonymous: data.is_anonymous,
                images: urlList,
                ...(data.condition ? { condition: data.condition } : {})
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
            // Inline backend field errors (nested under "errors" in our API envelope)
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

    const priceHelper = currentType === 'rental'
        ? 'Price per month.'
        : currentType === 'service'
            ? 'Rate per session/hour.'
            : 'Total price for the item.'

    const durationOptions = currentType === 'service' || currentType === 'food'
        ? [30, 90, 180]
        : [7, 15, 30]

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-red-800">Your ad was rejected</h3>
                        <p className="text-sm text-red-700 mt-1">{rejectionReason}</p>
                        <p className="text-xs text-red-500 mt-2">Fix the issue and save changes to resubmit for review.</p>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <Controller
                    name="post_type"
                    control={control}
                    render={({ field }) => (
                        <AdTypeSelector value={field.value} onChange={field.onChange} />
                    )}
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">
                    <span className="text-[#4C3B8A] mr-1">2.</span> About Your Ad
                </h2>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="font-semibold text-gray-800">Ad Title</Label>
                        <Input
                            {...register('title')}
                            placeholder="e.g. 2nd Year Mechanical Engineering Books"
                            className={`w-full ${errors.title ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-[#4C3B8A]'}`}
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="font-semibold text-gray-800">Description</Label>
                        <Textarea
                            {...register('description')}
                            placeholder="Tell us more about what you're offering..."
                            rows={4}
                            className={`w-full resize-y ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-[#4C3B8A]'}`}
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

                    {/* Cascading Category Selector */}
                    <MarketplaceCategorySelector
                        adType={adType}
                        selectedCategoryId={selectedCategory}
                        selectedSubcategoryId={selectedSubcategory || ''}
                        onCategoryChange={handleCategoryChange}
                        onSubcategoryChange={handleSubcategoryChange}
                        error={errors.category?.message}
                    />

                    {/* Condition — only for Buy */}
                    {currentType === 'buy' && (
                        <div className="space-y-2">
                            <Label className="font-semibold text-gray-800">Condition</Label>
                            <Controller
                                name="condition"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={`${errors.condition ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Select Condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CONDITIONS.map(c => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.condition && <p className="text-sm text-red-500">{errors.condition.message}</p>}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <PhotoUploadSection control={control} register={register} errors={errors} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">
                    <span className="text-[#4C3B8A] mr-1">4.</span> Pricing & Visibility
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="font-semibold text-gray-800">Price (৳)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">৳</span>
                            <Input
                                {...register('price')}
                                type="number"
                                step="0.01"
                                className={`pl-8 ${errors.price ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-[#4C3B8A]'}`}
                            />
                        </div>
                        <p className="text-xs text-gray-500">{priceHelper}</p>
                        {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                    </div>

                    <div className="space-y-2">
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

                <div className="mt-6 flex items-start space-x-3">
                    <Controller
                        name="is_anonymous"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                id="is_anonymous"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                            />
                        )}
                    />
                    <div className="space-y-1 leading-none">
                        <Label htmlFor="is_anonymous" className="text-sm font-medium cursor-pointer">
                            Post Anonymously
                        </Label>
                        <p className="text-sm text-gray-500">
                            Hide your profile name and avatar from this listing. Your verified status badge will still be shown to build trust.
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 mt-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                        <strong>Automatic Campus Detection:</strong> This ad will be listed for <strong>{user?.university_name || 'your campus'}</strong>. Only verified users from your campus will see this in their local feed.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
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
                    className="w-full sm:w-auto bg-[#059669] hover:bg-[#047857] text-white font-semibold px-8 py-3 rounded-lg order-1 sm:order-2 h-auto"
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
