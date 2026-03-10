'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ShoppingBag, Key, Briefcase, Utensils, X, Info, Plus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from "@/components/ui/checkbox"
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'

type PostType = 'buy' | 'rental' | 'service' | 'food'

function PostAdContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams?.get('edit')
    const { toast } = useToast()

    const { isAuthenticated, user, isVerifiedStudent, isAdmin, isModerator, isSeller } = useAuthStore()
    const canAccessMarketplace = isAuthenticated && (isVerifiedStudent() || isAdmin() || isModerator() || isSeller())

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingEdit, setIsLoadingEdit] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Active upload tab (for Section 3)
    const [photoMode, setPhotoMode] = useState<'url' | 'upload'>('url')

    // Form State
    const [adData, setAdData] = useState({
        post_type: 'buy' as PostType,
        title: '',
        description: '',
        category: '',
        condition: '', // Only for buy/rental
        price: '',
        duration_days: '15',
        is_anonymous: false,
        campus_visibility: 'own_university'
    })

    // Image arrays (Up to 8 combined)
    const [imageUrls, setImageUrls] = useState<string[]>([''])
    const [uploadFiles, setUploadFiles] = useState<File[]>([])
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([])
    const [existingImages, setExistingImages] = useState<{ id: number, image: string }[]>([])

    // Categories mapping
    const categoriesMap: Record<PostType, string[]> = {
        buy: ['Textbooks', 'Electronics', 'Furniture', 'Clothing', 'Sports', 'Other'],
        rental: ['Housing', 'Appliances', 'Vehicles', 'Tools', 'Other'],
        service: ['Tutoring', 'Design', 'Labor', 'Tech Support', 'Other'],
        food: ['Homemade Meals', 'Snacks', 'Bakery', 'Other'],
    }

    // Load Edit Data
    useEffect(() => {
        if (editId && canAccessMarketplace) {
            setIsLoadingEdit(true)
            api.get(`/marketplace/listings/${editId}/`)
                .then(res => {
                    const data = res.data
                    setAdData({
                        post_type: data.post_type as PostType,
                        title: data.title,
                        description: data.description,
                        category: data.category?.name || data.category,
                        condition: data.condition || '',
                        price: data.price.toString(),
                        duration_days: '15', // Fallback, normally calculate from expires_at if needed
                        is_anonymous: false, // Default since API might not expose this flag
                        campus_visibility: 'own_university'
                    })
                    setExistingImages(data.images || [])
                    setPhotoMode('upload') // Assume if editing, show the rich preview gallery
                })
                .catch(() => {
                    toast({ title: "Error Loading Ad", description: "Could not fetch existing ad data.", variant: "destructive" })
                })
                .finally(() => setIsLoadingEdit(false))
        }
    }, [editId, canAccessMarketplace])

    // Handlers
    const updateAdData = (field: string, value: any) => {
        setAdData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined } as any))
    }

    const handleTypeChange = (type: PostType) => {
        setAdData(prev => ({
            ...prev,
            post_type: type,
            category: categoriesMap[type][0], // Auto-select first category
            condition: (type === 'buy' || type === 'rental') ? 'USED-GOOD' : '' // Reset or set default condition
        }))
    }

    // Image URL logic
    const handleUrlChange = (index: number, value: string) => {
        const newUrls = [...imageUrls]
        newUrls[index] = value
        setImageUrls(newUrls)
    }
    const addUrlRow = () => {
        const totalImages = imageUrls.filter(u => u.trim() !== '').length + uploadFiles.length + existingImages.length
        if (totalImages < 8) setImageUrls(prev => [...prev, ''])
    }
    const removeUrlRow = (index: number) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index))
        if (imageUrls.length === 1) setImageUrls(['']) // keep at least one empty
    }

    // Image File logic
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        const currentCount = imageUrls.filter(u => u.trim() !== '').length + uploadFiles.length + existingImages.length
        const allowed = 8 - currentCount

        const filesArray = Array.from(e.target.files).slice(0, allowed)
        setUploadFiles(prev => [...prev, ...filesArray])

        const newPreviews = filesArray.map(file => URL.createObjectURL(file))
        setUploadPreviews(prev => [...prev, ...newPreviews])
    }
    const removeUploadFile = (index: number) => {
        URL.revokeObjectURL(uploadPreviews[index])
        setUploadFiles(prev => prev.filter((_, i) => i !== index))
        setUploadPreviews(prev => prev.filter((_, i) => i !== index))
    }
    const removeExistingImage = (index: number) => {
        // Just remove from array visually, backend patch should handle remaining
        setExistingImages(prev => prev.filter((_, i) => i !== index))
    }

    // Submit Validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        if (!adData.title.trim()) newErrors.title = "Title is required"
        else if (adData.title.length < 5) newErrors.title = "Title must be at least 5 characters"

        if (!adData.description.trim()) newErrors.description = "Description is required"
        else if (adData.description.length < 20) newErrors.description = "Description must be at least 20 characters"
        else if (adData.description.length > 1000) newErrors.description = "Description cannot exceed 1000 characters"

        if (!adData.category) newErrors.category = "Category is required"
        if ((adData.post_type === 'buy' || adData.post_type === 'rental') && !adData.condition) {
            newErrors.condition = "Condition is required"
        }

        if (!adData.price && adData.price !== '0') newErrors.price = "Price is required"
        else if (isNaN(Number(adData.price)) || Number(adData.price) < 0) newErrors.price = "Price must be a valid positive number"

        const totalImages = imageUrls.filter(u => u.trim() !== '').length + uploadFiles.length + existingImages.length
        if (totalImages === 0) newErrors.images = "Please add at least one image"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) {
            // Scroll to top to show banner if needed
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('post_type', adData.post_type)
            formData.append('title', adData.title)
            formData.append('description', adData.description)
            formData.append('category', adData.category)

            if (adData.condition) formData.append('condition', adData.condition)
            formData.append('price', adData.price)
            formData.append('duration_days', adData.duration_days)
            formData.append('is_anonymous', String(adData.is_anonymous))
            formData.append('campus_visibility', adData.campus_visibility)

            // Handle URL images vs File uploads based on backend requirements
            // For now, mapping valid URLs back to a comma-separated string if the backend supports it:
            const validUrls = imageUrls.filter(u => u.trim() !== '')
            if (validUrls.length > 0) formData.append('image_urls', JSON.stringify(validUrls))

            // Append binary files
            uploadFiles.forEach(file => formData.append('uploaded_images', file))

            if (editId) {
                // Determine remaining existing image IDs to keep
                const existingImageIds = existingImages.map(img => img.id)
                formData.append('keep_images', JSON.stringify(existingImageIds))
                await api.patch(`/marketplace/listings/${editId}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                toast({ title: 'Success', description: 'Your ad has been updated and is back Under Review.' })
            } else {
                await api.post('/marketplace/listings/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                toast({ title: 'Success', description: "Ad submitted for review. We'll notify you when it's approved." })
            }
            router.push('/marketplace/my-ads')

        } catch (error: any) {
            toast({
                title: "Failed to save ad",
                description: error.response?.data?.detail || "Please check your inputs and try again.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!canAccessMarketplace) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-[#F5F5F5] pt-12 flex justify-center px-4">
                <UpgradePrompt
                    isOpen={true}
                    onClose={() => router.push('/marketplace')}
                    title="Verification Required"
                    description="You must verify your university email to post ads on the Marketplace. This builds trust and keeps your campus safe."
                />
            </div>
        )
    }

    if (isLoadingEdit) {
        return <div className="min-h-screen pt-20 text-center animate-pulse text-gray-500">Loading ad data...</div>
    }

    const adTypeCards = [
        { id: 'buy', icon: <ShoppingBag className="w-6 h-6" />, label: 'Sell Item' },
        { id: 'rental', icon: <Key className="w-6 h-6" />, label: 'For Rent' },
        { id: 'service', icon: <Briefcase className="w-6 h-6" />, label: 'Service' },
        { id: 'food', icon: <Utensils className="w-6 h-6" />, label: 'Food' },
    ]

    const totalUploadedImages = imageUrls.filter(u => u.trim() !== '').length + uploadFiles.length + existingImages.length

    return (
        <div className="bg-[#F5F5F5] min-h-screen pb-20 pt-8 sm:pt-12">
            <div className="container mx-auto px-4 max-w-2xl">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-2 mb-2 text-sm text-gray-500 font-medium">
                        <span onClick={() => router.back()} className="cursor-pointer hover:text-brand-primary">Marketplace</span>
                        <span>/</span>
                        <span className="text-gray-900">{editId ? 'Edit Advertisement' : 'Post New Advertisement'}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A1A2E] tracking-tight mb-2">
                        {editId ? 'Edit Your Ad' : 'What are you offering?'}
                    </h1>
                    <p className="text-gray-500">
                        {editId ? 'Update your listing details below.' : 'Reach fellow students across your campus community in minutes.'}
                    </p>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium text-sm">
                        Please correct the errors below before submitting.
                    </div>
                )}

                {/* Main Form Card */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden p-6 sm:p-8 space-y-12">

                    {/* SECTION 1: Select Type */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
                            <span className="text-brand-primary mr-1">1.</span> Select Advertisement Type
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {adTypeCards.map(type => {
                                const isSelected = adData.post_type === type.id
                                return (
                                    <button
                                        type="button"
                                        key={type.id}
                                        onClick={() => handleTypeChange(type.id as PostType)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2
                                            ${isSelected
                                                ? 'bg-brand-primary border-brand-primary text-white shadow-md scale-105'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <div className={/* Always retain color if not selected, but white if selected? Demo says purple background, white icon. Let's just use current color inheritance */ "inherit"}>
                                            {type.icon}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">{type.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* SECTION 2: About Your Ad */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
                            <span className="text-brand-primary mr-1">2.</span> About Your Ad
                        </h2>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-gray-700 font-bold">Ad Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. 2nd Year Mechanical Engineering Books"
                                value={adData.title}
                                onChange={e => updateAdData('title', e.target.value)}
                                className={`h-12 bg-gray-50 border-gray-200 ${errors.title ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-brand-primary'}`}
                            />
                            {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-brand-primary font-bold">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Tell us more about what you're offering..."
                                rows={4}
                                value={adData.description}
                                onChange={e => updateAdData('description', e.target.value)}
                                className={`resize-none bg-gray-50 border-gray-200 ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-brand-primary'}`}
                            />
                            <div className="flex justify-between items-center text-xs">
                                {errors.description ? (
                                    <span className="text-red-500 font-medium">{errors.description}</span>
                                ) : <span />}
                                <span className={`${adData.description.length > 1000 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                    {adData.description.length} / 1000
                                </span>
                            </div>
                        </div>

                        {/* Category & Condition */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-bold">Category</Label>
                                <Select value={adData.category} onValueChange={val => updateAdData('category', val)}>
                                    <SelectTrigger className={`h-12 bg-gray-50 border-gray-200 ${errors.category && !adData.category ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(categoriesMap[adData.post_type] || []).map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && !adData.category && <p className="text-xs text-red-500 font-medium">{errors.category}</p>}
                            </div>

                            {(adData.post_type === 'buy' || adData.post_type === 'rental') && (
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-bold">Condition</Label>
                                    <Select value={adData.condition} onValueChange={val => updateAdData('condition', val)}>
                                        <SelectTrigger className={`h-12 bg-gray-50 border-gray-200 ${errors.condition && !adData.condition ? 'border-red-500' : ''}`}>
                                            <SelectValue placeholder="Select Condition" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEW">New</SelectItem>
                                            <SelectItem value="USED-LIKE NEW">Used - Like New</SelectItem>
                                            <SelectItem value="USED-GOOD">Used - Good</SelectItem>
                                            <SelectItem value="USED-FAIR">Used - Fair</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.condition && !adData.condition && <p className="text-xs text-red-500 font-medium">{errors.condition}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: Add Photos */}
                    <div className="space-y-6">
                        <div className="border-b border-gray-100 pb-2 mb-4">
                            <h2 className="text-lg font-bold text-gray-900 inline-flex items-center">
                                <span className="text-brand-primary mr-1">3.</span> Add Photos
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">High quality photos help you get more responses. Upload at least one image.</p>
                        </div>

                        {/* Toggle Mode */}
                        <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                            <button type="button" onClick={() => setPhotoMode('url')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${photoMode === 'url' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Enter URL</button>
                            <button type="button" onClick={() => setPhotoMode('upload')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${photoMode === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Upload File</button>
                        </div>

                        {photoMode === 'url' ? (
                            <div className="space-y-3 bg-gray-50 p-4 border border-gray-100 rounded-xl">
                                {imageUrls.map((url, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <div className="flex-1 space-y-1">
                                            {i === 0 && <Label className="text-brand-primary font-bold text-xs uppercase">Main Image URL</Label>}
                                            <Input
                                                placeholder="https://image-hosting.com/my-photo.jpg"
                                                value={url}
                                                onChange={e => handleUrlChange(i, e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className={i === 0 ? "pt-5" : ""}>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeUrlRow(i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {totalUploadedImages < 8 && (
                                    <button
                                        type="button"
                                        onClick={addUrlRow}
                                        className="text-brand-primary font-bold text-sm hover:underline flex items-center gap-1 mt-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add another photo
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-brand-primary hover:bg-brand-primary/5 transition-colors text-center relative flex flex-col items-center justify-center bg-gray-50">
                                    <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={totalUploadedImages >= 8} />
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-brand-primary">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <p className="font-bold text-gray-900">Click to upload files</p>
                                    <p className="text-xs text-gray-500 mt-1">JPG/PNG, max 5MB. Up to 8 photos.</p>
                                </div>
                            </div>
                        )}

                        {errors.images && <p className="text-sm font-bold text-red-500 mt-2">{errors.images}</p>}

                        {/* Combined Previews */}
                        {(uploadPreviews.length > 0 || imageUrls.some(u => u.trim() !== '') || existingImages.length > 0) && (
                            <div className="pt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Image Previews</p>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                    {/* Existing Edit Images */}
                                    {existingImages.map((img, i) => (
                                        <div key={`existing-${img.id}`} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group bg-white shadow-sm">
                                            <Image src={img.image} alt="Preview" fill className="object-cover" />
                                            <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Valid URLs Previews */}
                                    {imageUrls.map((u, i) => u.trim() !== '' && (
                                        <div key={`url-${i}`} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group bg-white shadow-sm">
                                            <Image src={u} alt="URL Preview" fill className="object-cover" unoptimized />
                                            <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">URL</span>
                                        </div>
                                    ))}

                                    {/* File Upload Previews */}
                                    {uploadPreviews.map((src, i) => (
                                        <div key={`upload-${i}`} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group bg-white shadow-sm">
                                            <Image src={src} alt="Upload Preview" fill className="object-cover" />
                                            <button type="button" onClick={() => removeUploadFile(i)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: Pricing & Visibility */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
                            <span className="text-brand-primary mr-1">4.</span> Pricing & Visibility
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2 relative">
                                <Label htmlFor="price" className="text-gray-700 font-bold">Price <span className="text-gray-400 font-normal">(৳)</span></Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
                                    <Input
                                        type="number"
                                        id="price"
                                        placeholder="0.00"
                                        value={adData.price}
                                        onChange={e => updateAdData('price', e.target.value)}
                                        className={`pl-8 h-12 bg-gray-50 border-gray-200 ${errors.price ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-brand-primary'}`}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium">
                                    {adData.post_type === 'service' ? 'Rate per session/hour' : adData.post_type === 'food' ? 'Price per portion/set' : 'Total price for the item.'}
                                </p>
                                {errors.price && <p className="text-xs text-red-500 font-medium">{errors.price}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-700 font-bold">Listing Duration</Label>
                                <Select value={adData.duration_days} onValueChange={val => updateAdData('duration_days', val)}>
                                    <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 Days</SelectItem>
                                        <SelectItem value="15">15 Days</SelectItem>
                                        <SelectItem value="30">30 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-gray-500 font-medium">Your ad will automatically expire after this period.</p>
                            </div>
                        </div>

                        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-gray-200 p-4 shadow-sm bg-gray-50/50">
                            <Checkbox
                                id="anonymous"
                                checked={adData.is_anonymous}
                                onCheckedChange={(c: boolean | 'indeterminate') => updateAdData('is_anonymous', c === true)}
                                className="mt-1"
                            />
                            <div className="space-y-1 leading-none">
                                <Label htmlFor="anonymous" className="font-bold text-gray-900 cursor-pointer">Post Anonymously</Label>
                                <p className="text-xs text-gray-500">
                                    Hide your profile name and avatar from this listing. Your verified status badge will still be shown to build trust.
                                </p>
                            </div>
                        </div>

                        {/* Campus Detection Banner */}
                        <div className="bg-blue-50 p-4 text-blue-800 rounded-xl flex items-start gap-3 border border-blue-100">
                            <Info className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" />
                            <div>
                                <p className="font-bold text-sm text-blue-900 mb-1">Automatic Campus Detection</p>
                                <p className="text-xs leading-relaxed">
                                    This ad will be listed for <span className="font-bold bg-blue-100 px-1 py-0.5 rounded">{user?.university_name || 'All Universities'}</span>.
                                    Only verified users from your campus will see this in their local feed.
                                </p>
                            </div>

                        </div>
                    </div>
                </form>

                {/* Footer Controls */}
                <div className="mt-6 flex justify-between items-center px-2 py-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-brand-primary font-bold hover:underline flex items-center gap-1"
                        disabled={isSubmitting}
                    >
                        <ArrowLeft className="w-4 h-4" /> Cancel
                    </button>

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#059669] hover:bg-green-700 text-white shadow-xl h-12 px-8 font-bold text-base tracking-wide"
                    >
                        {isSubmitting ? 'Processing...' : editId ? 'Save Changes' : 'Submit for Review'}
                    </Button>
                </div>

            </div>
        </div>
    )
}

export default function PostAdPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-20 text-center animate-pulse text-gray-500">Loading form...</div>}>
            <PostAdContent />
        </Suspense>
    )
}
