'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Check, ShoppingBag, Key, Briefcase, Utensils, UploadCloud, X, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { MarketplaceAdCard } from '@/components/marketplace/MarketplaceAdCard'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'

type PostType = 'buy' | 'rental' | 'service' | 'food' | null

export default function PostAdPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { isAuthenticated, user, isVerifiedStudent, isAdmin, isModerator, isSeller } = useAuthStore()
    const canAccessMarketplace = isAuthenticated && (isVerifiedStudent() || isAdmin() || isModerator() || isSeller())

    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [adData, setAdData] = useState({
        post_type: null as PostType,
        title: '',
        description: '',
        category: '',
        condition: '', // Only for buy/rental
        price: '',
        price_unit: '', // Only for rental/service
        is_negotiable: false,
        duration: '',
        meetup_location: '',
        campus_visibility: 'My University Only'
    })

    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])

    // Handlers
    const updateAdData = (field: string, value: any) => setAdData(prev => ({ ...prev, [field]: value }))

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const filesArray = Array.from(e.target.files).slice(0, 8 - images.length)
        setImages(prev => [...prev, ...filesArray])

        const newPreviews = filesArray.map(file => URL.createObjectURL(file))
        setImagePreviews(prev => [...prev, ...newPreviews])
    }

    const removeImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index])
        setImages(prev => prev.filter((_, i) => i !== index))
        setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    const validateStep2 = () => {
        if (!adData.title || adData.title.length < 5) return "Title requires at least 5 characters."
        if (!adData.description || adData.description.length < 20) return "Description requires at least 20 characters."
        if (!adData.category) return "Please select a category."
        if (!adData.price || isNaN(Number(adData.price))) return "Please enter a valid price."
        if (!adData.duration) return "Please select an ad duration."
        if ((adData.post_type === 'rental' || adData.post_type === 'service') && !adData.price_unit) return "Please select a price unit."
        if ((adData.post_type === 'buy' || adData.post_type === 'rental') && !adData.condition) return "Please select item condition."
        return null
    }

    const handleNext = () => {
        if (currentStep === 1 && !adData.post_type) return
        if (currentStep === 2) {
            const error = validateStep2()
            if (error) { toast({ title: "Incomplete Field", description: error, variant: "destructive" }); return }
        }
        if (currentStep === 3 && images.length === 0) {
            toast({ title: "Images required", description: "Please upload at least one image.", variant: "destructive" })
            return
        }
        setCurrentStep(prev => prev + 1)
    }

    const submitAd = async () => {
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            Object.entries(adData).forEach(([key, val]) => {
                if (val !== null && val !== '') formData.append(key, val.toString())
            })
            images.forEach(img => formData.append('uploaded_images', img))

            await api.post('/marketplace/listings/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast({ title: "Success!", description: "Your ad has been posted and is currently Under Review." })
            router.push('/marketplace/my-ads')
        } catch (error: any) {
            toast({
                title: "Failed to post ad",
                description: error.response?.data?.detail || "Something went wrong.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!canAccessMarketplace) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] pt-12">
                <UpgradePrompt
                    isOpen={true}
                    onClose={() => router.push('/marketplace')}
                    title="Verification Required"
                    description="You must verify your university email to post ads on the Marketplace. This keeps our community safe."
                />
            </div>
        )
    }

    // Step UI Mapping
    const typeCards = [
        { id: 'buy', icon: <ShoppingBag className="w-8 h-8" />, title: 'Buy', bg: 'bg-[#7C3AED]', label: 'Sell Physical Items' },
        { id: 'rental', icon: <Key className="w-8 h-8" />, title: 'Rental', bg: 'bg-[#059669]', label: 'Rent out housing or gear' },
        { id: 'service', icon: <Briefcase className="w-8 h-8" />, title: 'Services', bg: 'bg-[#0891B2]', label: 'Offer tutoring, rides, etc.' },
        { id: 'food', icon: <Utensils className="w-8 h-8" />, title: 'Food', bg: 'bg-[#D97706]', label: 'Sell homemade meals' },
    ]

    const categoriesMap: Record<string, string[]> = {
        buy: ['Electronics', 'Books', 'Furniture', 'Clothing', 'Other'],
        rental: ['Apartment', 'Bicycle', 'Camera Gear', 'Event Tools'],
        service: ['Tutoring', 'Delivery', 'Design/Web', 'Rideshare'],
        food: ['Full Meals', 'Snacks', 'Baking', 'Meal Prep'],
    }

    const durationOptions = (adData.post_type === 'service' || adData.post_type === 'food')
        ? ['1 month', '3 months', '6 months']
        : ['7 days', '15 days', '30 days']

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {typeCards.map(type => (
                            <button
                                key={type.id}
                                onClick={() => updateAdData('post_type', type.id as PostType)}
                                className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all ${adData.post_type === type.id ? 'border-brand-primary bg-brand-primary/5 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'} text-left relative overflow-hidden group`}
                            >
                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white shrink-0 ${type.bg}`}>
                                    {type.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{type.title}</h3>
                                    <p className="text-sm font-medium text-gray-500">{type.label}</p>
                                </div>
                                {adData.post_type === type.id && (
                                    <div className="absolute top-4 right-4 bg-brand-primary text-white rounded-full p-1">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="text-gray-900">Ad Title <span className="text-red-500">*</span></Label>
                            <Input id="title" placeholder="e.g. MacBook Pro M1 2020" value={adData.title} onChange={e => updateAdData('title', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label className="text-gray-900">Category <span className="text-red-500">*</span></Label>
                                <Select value={adData.category} onValueChange={val => updateAdData('category', val)}>
                                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                    <SelectContent>
                                        {(categoriesMap[adData.post_type || 'buy'] || []).map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {(adData.post_type === 'buy' || adData.post_type === 'rental') && (
                                <div className="grid gap-2">
                                    <Label className="text-gray-900">Condition <span className="text-red-500">*</span></Label>
                                    <Select value={adData.condition} onValueChange={val => updateAdData('condition', val)}>
                                        <SelectTrigger><SelectValue placeholder="Select Condition" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEW">New</SelectItem>
                                            <SelectItem value="USED-LIKE NEW">Used - Like New</SelectItem>
                                            <SelectItem value="USED-GOOD">Used - Good</SelectItem>
                                            <SelectItem value="USED-FAIR">Used - Fair</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-end gap-6">
                            <div className="grid gap-2 relative">
                                <Label className="text-gray-900">Price <span className="text-red-500">*</span></Label>
                                <span className="absolute left-3 bottom-[calc(0.5rem+3px)] text-gray-500 font-bold z-10">৳</span>
                                <Input type="number" min="0" placeholder="0" value={adData.price} onChange={e => updateAdData('price', e.target.value)} className="pl-8" />
                            </div>
                            {(adData.post_type === 'rental' || adData.post_type === 'service') && (
                                <div className="grid gap-2">
                                    <Label className="text-gray-900">Price Unit <span className="text-red-500">*</span></Label>
                                    <Select value={adData.price_unit} onValueChange={val => updateAdData('price_unit', val)}>
                                        <SelectTrigger><SelectValue placeholder="e.g. per month" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hour">per Hour</SelectItem>
                                            <SelectItem value="day">per Day</SelectItem>
                                            <SelectItem value="week">per Week</SelectItem>
                                            <SelectItem value="month">per Month</SelectItem>
                                            <SelectItem value="job">per Job/Task</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="flex items-center gap-2 h-10 pb-2">
                                <input type="checkbox" id="negotiable" checked={adData.is_negotiable} onChange={e => updateAdData('is_negotiable', e.target.checked)} className="rounded border-gray-300 w-4 h-4 text-brand-primary focus:ring-brand-primary" />
                                <Label htmlFor="negotiable" className="cursor-pointer text-gray-700">Price Negotiable</Label>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-gray-900">Ad Duration <span className="text-red-500">*</span></Label>
                            <Select value={adData.duration} onValueChange={val => updateAdData('duration', val)}>
                                <SelectTrigger><SelectValue placeholder="How long should this ad run?" /></SelectTrigger>
                                <SelectContent>
                                    {durationOptions.map(dur => <SelectItem key={dur} value={dur}>{dur}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Ad will automatically expire and hide after this duration if not renewed.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="text-gray-900">Detailed Description <span className="text-red-500">*</span></Label>
                            <Textarea id="description" placeholder="Include specifications, dimensions, reason for selling, etc." rows={6} value={adData.description} onChange={e => updateAdData('description', e.target.value)} className="resize-none" />
                            <p className="text-xs text-gray-500 text-right">{adData.description.length} / 5000 chars (min 20)</p>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="grid gap-2">
                            <Label className="text-gray-900">Product Images (Up to 8) <span className="text-red-500">*</span></Label>
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-brand-primary hover:bg-brand-primary/5 transition-colors text-center relative flex flex-col items-center justify-center">
                                <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={images.length >= 8} />
                                <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="font-semibold text-gray-700">Drag & drop or click to upload</p>
                                <p className="text-xs text-gray-500 mt-1">First image becomes the cover thumbnail.</p>
                            </div>

                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    {imagePreviews.map((src, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl border border-gray-200 overflow-hidden group">
                                            <Image src={src} alt="Preview" fill className="object-cover" />
                                            {idx === 0 && <span className="absolute top-1 left-1 bg-brand-primary text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Cover</span>}
                                            <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2 pt-6 border-t border-gray-100">
                            <Label htmlFor="meetup_location" className="text-gray-900">Safe Meetup Location (Optional)</Label>
                            <Input id="meetup_location" placeholder="e.g. Inside University Library Campus 2" value={adData.meetup_location} onChange={e => updateAdData('meetup_location', e.target.value)} />
                            <p className="text-xs text-brand-primary font-medium flex gap-1 items-center mt-1">
                                <ShieldCheck className="w-3 h-3" /> We recommend public, well-lit university grounds for transactions.
                            </p>
                        </div>
                    </div>
                )

            case 4:
                // Generate a dummy object implementing MarketplaceListing for the preview
                const previewListing: any = {
                    id: 'preview',
                    title: adData.title,
                    price: adData.price,
                    price_unit: adData.price_unit,
                    images: imagePreviews.map((src) => ({ image: src })),
                    condition: adData.condition,
                    post_type: adData.post_type,
                    category: adData.category,
                    university_name: adData.campus_visibility === 'My University Only' ? (user?.university_name || 'Your University') : 'All Campuses',
                    user: {
                        first_name: user?.first_name || 'You',
                        last_name: user?.last_name || '',
                        avatar: user?.profile_picture
                    },
                    created_at: new Date().toISOString(),
                    contact_visible: true
                }

                return (
                    <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm font-medium">
                            Review your ad carefully. Once POSTED, it will be placed "Under Review" by a moderator before becoming publicly active in the Marketplace.
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Ad Details Mapping</h3>
                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Category</div>
                                    <div className="font-semibold text-gray-900">{adData.category}</div>

                                    <div className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Price Negotiable</div>
                                    <div className="font-semibold text-gray-900">{adData.is_negotiable ? 'Yes' : 'No'}</div>

                                    <div className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Duration</div>
                                    <div className="font-semibold text-gray-900">{adData.duration}</div>

                                    <div className="text-gray-500 uppercase tracking-wider text-[10px] font-bold">Description Length</div>
                                    <div className="font-semibold text-gray-900">{adData.description.length} Characters</div>
                                </div>
                            </div>
                            <div className="max-w-[400px] mx-auto w-full">
                                <p className="text-sm font-bold text-gray-900 mb-2">Live Card Preview</p>
                                <div className="pointer-events-none">
                                    <MarketplaceAdCard listing={previewListing} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="bg-[#F5F5F5] min-h-screen pb-20 pt-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header & Progress */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-[#1A1A2E] tracking-tight mb-6">Post an Ad</h1>

                    {/* Progress Bar (4 steps) */}
                    <div className="relative flex justify-between">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }} />
                        </div>
                        {['Ad Type', 'Details', 'Media', 'Review'].map((label, idx) => {
                            const stepNumber = idx + 1
                            const isActive = currentStep === stepNumber
                            const isPast = currentStep > stepNumber

                            return (
                                <div key={label} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${isActive ? 'bg-brand-primary border-brand-primary text-white scale-110 shadow-md' : isPast ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                                        {isPast ? <Check className="w-4 h-4" /> : stepNumber}
                                    </div>
                                    <span className={`text-[11px] font-bold uppercase mt-2 tracking-wide absolute -bottom-6 whitespace-nowrap ${isActive ? 'text-brand-primary' : 'text-gray-400'}`}>
                                        {label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-12">
                    {renderStepContent()}
                </div>

                {/* Footer Controls */}
                <div className="mt-8 flex justify-between items-center py-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={() => currentStep > 1 ? setCurrentStep(p => p - 1) : router.back()}
                        className="bg-white border-gray-300 text-gray-700 font-bold gap-2"
                        disabled={isSubmitting}
                    >
                        <ArrowLeft className="w-4 h-4" /> {currentStep === 1 ? 'Cancel' : 'Back'}
                    </Button>

                    {currentStep < 4 ? (
                        <Button
                            onClick={handleNext}
                            className="bg-brand-primary hover:bg-brand-dark text-white font-bold gap-2"
                            disabled={currentStep === 1 && !adData.post_type}
                        >
                            Next Step <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={submitAd}
                            className="bg-[#1A1A2E] hover:bg-black text-white px-8 font-bold gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Posting...' : 'Confirm & Post Ad'} <Check className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
