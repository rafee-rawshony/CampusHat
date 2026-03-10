'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Store, User, CheckCircle2, ChevronRight, UploadCloud, X, Verified, Building2
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

type BusinessType = 'individual' | 'student_seller' | 'club' | 'business' | 'official_store'

export default function SellerApplyPage() {
    const router = useRouter()
    const { isAuthenticated, isSeller } = useAuthStore()

    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'rejected'>('none')
    const [isLoading, setIsLoading] = useState(true)

    // Form Data State
    const [formData, setFormData] = useState({
        business_type: 'individual' as BusinessType,
        store_name: '',
        store_slug: '',
        description: '',
        mobile_banking_provider: '',
        mobile_banking_number: '',
        accepted_terms: false
    })

    // Document Files State
    const [documents, setDocuments] = useState({
        profile_photo: null as File | null,
        nid_front: null as File | null,
        nid_back: null as File | null,
        student_id: null as File | null,
        trade_license: null as File | null,
        tin_certificate: null as File | null
    })

    const [previews, setPreviews] = useState<Record<string, string>>({})

    // Initial check
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login')
            return
        }

        if (isSeller()) {
            router.push('/seller/dashboard')
            return
        }

        // Check if an application is already pending
        api.get('/seller/application/status/')
            .then(res => {
                if (res.data.status === 'pending') {
                    setApplicationStatus('pending')
                } else if (res.data.status === 'rejected') {
                    setApplicationStatus('rejected')
                }
            })
            .catch(() => {
                // Ignore 404s, implies no application exists
            })
            .finally(() => setIsLoading(false))

    }, [isAuthenticated, isSeller, router])

    const updateFormData = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }))
        // Auto generate slug if store name changes and slug hasn't been manually touched
        if (key === 'store_name' && !document.getElementById('store_slug')?.matches(':focus')) {
            const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            setFormData(prev => ({ ...prev, [key]: value, store_slug: slug }))
        }
    }

    const handleFileUpload = (key: keyof typeof documents, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File is too large. Maximum size is 10MB.")
            return
        }

        setDocuments(prev => ({ ...prev, [key]: file }))

        // Create preview
        if (previews[key]) URL.revokeObjectURL(previews[key])
        setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }))
    }

    const removeFile = (key: keyof typeof documents) => {
        setDocuments(prev => ({ ...prev, [key]: null }))
        if (previews[key]) URL.revokeObjectURL(previews[key])
        setPreviews(prev => {
            const newPreviews = { ...prev }
            delete newPreviews[key]
            return newPreviews
        })
    }

    const validateStep1 = () => {
        if (!formData.business_type || !formData.store_name || !formData.store_slug || !formData.mobile_banking_provider || !formData.mobile_banking_number) {
            toast.error("Please fill in all required fields.")
            return false
        }
        return true
    }

    const validateStep2 = () => {
        if (!documents.profile_photo) {
            toast.error("Store Profile Photo is required.")
            return false
        }

        // Conditional validation
        if (formData.business_type === 'individual') {
            if (!documents.nid_front || !documents.nid_back) {
                toast.error("Both NID Front and Back are required for Individuals.")
                return false
            }
        } else if (formData.business_type === 'student_seller') {
            if (!documents.student_id || !documents.nid_front) {
                toast.error("Student ID and NID Front are required for Student Sellers.")
                return false
            }
        } else if (['business', 'official_store'].includes(formData.business_type)) {
            if (!documents.trade_license || !documents.tin_certificate) {
                toast.error("Trade License and TIN Certificate are required for Registered Businesses.")
                return false
            }
        }

        return true
    }

    const nextStep = () => {
        if (step === 1 && !validateStep1()) return
        if (step === 2 && !validateStep2()) return
        setStep(prev => prev + 1)
        window.scrollTo(0, 0)
    }

    const prevStep = () => {
        setStep(prev => prev - 1)
        window.scrollTo(0, 0)
    }

    const submitApplication = async () => {
        if (!formData.accepted_terms) {
            toast.error("You must accept the Seller Terms of Service.")
            return
        }

        setIsSubmitting(true)
        try {
            const payload = new FormData()
            Object.entries(formData).forEach(([key, value]) => payload.append(key, String(value)))

            // Append only the selected documents
            Object.entries(documents).forEach(([key, file]) => {
                if (file) payload.append(`doc_${key}`, file)
            })

            await api.post('/seller/register/', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast.success("Application submitted successfully!")
            setApplicationStatus('pending')
            window.scrollTo(0, 0)

        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to submit application. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse font-bold text-brand-primary">Loading Application...</div></div>
    }

    // PENDING STATE VIEW
    if (applicationStatus === 'pending') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <div className="bg-white max-w-lg w-full rounded-3xl shadow-xl p-8 sm:p-12 text-center border border-gray-100">
                    <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full mx-auto flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
                        <Store className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#1A1A2E] mb-3">Application Under Review</h1>
                    <p className="text-gray-500 mb-8 leading-relaxed text-sm sm:text-base">
                        Thanks for applying to be a seller! Our Trust & Safety team is reviewing your documents.
                        This process typically takes 24-48 business hours. We&apos;ll email you once it&apos;s approved.
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Review Timeline</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-blue-500" /></div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Application Submitted</p>
                                    <p className="text-xs text-gray-500">We&apos;ve received your data.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 opacity-50">
                                <div className="mt-1"><div className="w-5 h-5 rounded-full border-2 border-gray-300" /></div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Document Verification</p>
                                    <p className="text-xs text-gray-500">Authenticating IDs & Licenses</p>
                                </div>
                            </div>
                            <div className="flex gap-4 opacity-50">
                                <div className="mt-1"><div className="w-5 h-5 rounded-full border-2 border-gray-300" /></div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Final Decision</p>
                                    <p className="text-xs text-gray-500">Store activation</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button onClick={() => router.push('/')} variant="outline" className="mt-8 w-full h-12 rounded-xl text-gray-600 font-bold border-gray-200 hover:bg-gray-50">
                        Return to Homepage
                    </Button>
                </div>
            </div>
        )
    }

    const businessTypes = [
        { id: 'individual', title: 'Individual', icon: User, desc: 'Selling used personal items or crafts' },
        { id: 'student_seller', title: 'Student Seller', icon: Verified, desc: 'Active student doing side-commerce' },
        { id: 'business', title: 'Business/Brand', icon: Store, desc: 'Registered small business with TIN' },
        { id: 'official_store', title: 'Official Store', icon: Building2, desc: 'Authorized distributor or parent brand' },
    ]

    const renderUploader = (key: keyof typeof documents, title: string, desc: string, required: boolean = true) => (
        <div key={key} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-gray-900">{title} {required && <span className="text-red-500">*</span>}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
            </div>

            {previews[key] ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previews[key]} alt="Preview" className="w-full h-full object-contain" />
                    <button onClick={() => removeFile(key)} className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-2 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-white hover:border-brand-primary transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-brand-primary mb-2" />
                        <p className="text-sm font-bold text-gray-600 group-hover:text-brand-primary">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG or PNG (MAX. 10MB)</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,image/png,image/jpeg" onChange={(e) => handleFileUpload(key, e)} />
                </label>
            )}
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shrink-0">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-brand-primary" />
                        <span className="font-extrabold text-gray-900 tracking-tight">Become a Seller</span>
                    </div>
                    <button onClick={() => router.push('/')} className="text-sm font-bold text-gray-500 hover:text-gray-900">Cancel</button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between relative z-10">
                        {[1, 2, 3].map(num => (
                            <div key={num} className="flex flex-col items-center gap-2 bg-[#F8FAFC]">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${step === num ? 'bg-brand-primary border-brand-primary text-white scale-110 shadow-lg shadow-brand-primary/20'
                                    : step > num ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-400'
                                    }`}>
                                    {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${step >= num ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {num === 1 ? 'Business Info' : num === 2 ? 'Documents' : 'Review'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="h-0.5 bg-gray-200 -mt-7 mb-7 mx-5 relative z-0">
                        <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 sm:p-10">
                        {/* STEP 1 */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Tell us about your business</h2>
                                    <p className="text-gray-500 mt-1">Select the classification that best matches your commerce footprint.</p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700">Business Type</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {businessTypes.map(type => {
                                            const Icon = type.icon
                                            const isSelected = formData.business_type === type.id
                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => updateFormData('business_type', type.id)}
                                                    className={`p-4 rounded-2xl border-2 text-left transition-all flex gap-4 ${isSelected ? 'border-brand-primary bg-brand-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                                >
                                                    <div className={`mt-0.5 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold ${isSelected ? 'text-brand-primary' : 'text-gray-900'}`}>{type.title}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Store Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="e.g. Campus Tech Stop"
                                            value={formData.store_name}
                                            onChange={e => updateFormData('store_name', e.target.value)}
                                            className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-brand-primary focus-visible:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Store Slug URL <span className="text-red-500">*</span></Label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-100 text-gray-500 sm:text-sm font-medium">
                                                campushat.com/s/
                                            </span>
                                            <Input
                                                id="store_slug"
                                                placeholder="campus-tech-stop"
                                                value={formData.store_slug}
                                                onChange={e => updateFormData('store_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                className="border-l-0 rounded-l-none h-12 bg-gray-50 border-gray-200 focus-visible:ring-brand-primary focus-visible:bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700">Store Description</Label>
                                    <Textarea
                                        placeholder="What kind of products do you sell? Help buyers understand your catalog."
                                        rows={4}
                                        value={formData.description}
                                        onChange={e => updateFormData('description', e.target.value)}
                                        className="resize-none bg-gray-50 border-gray-200 focus-visible:ring-brand-primary focus-visible:bg-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Payout Method <span className="text-red-500">*</span></Label>
                                        <Select value={formData.mobile_banking_provider} onValueChange={v => updateFormData('mobile_banking_provider', v)}>
                                            <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                                                <SelectValue placeholder="Select provider" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bkash">bKash (Primary)</SelectItem>
                                                <SelectItem value="nagad">Nagad</SelectItem>
                                                <SelectItem value="rocket">Rocket</SelectItem>
                                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-gray-500 font-medium">Where we will disburse your earnings.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Account Number <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="e.g. 017xxxxxxxx"
                                            value={formData.mobile_banking_number}
                                            onChange={e => updateFormData('mobile_banking_number', e.target.value)}
                                            className="h-12 bg-gray-50 border-gray-200 focus-visible:ring-brand-primary focus-visible:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Verify your identity</h2>
                                    <p className="text-gray-500 mt-1">Upload the required documents for <span className="font-bold text-brand-primary px-1 py-0.5 bg-brand-primary/10 rounded">{formData.business_type.replace('_', ' ').toUpperCase()}</span> verification.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Everyone needs a profile photo */}
                                    {renderUploader('profile_photo', 'Store Logo / Profile Photo', 'A clear picture representing your brand')}

                                    {/* Conditional uploads based on business type */}
                                    {formData.business_type === 'individual' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {renderUploader('nid_front', 'User NID Front', 'Clear scan of national ID front side')}
                                            {renderUploader('nid_back', 'User NID Back', 'Clear scan of national ID back side')}
                                        </div>
                                    )}

                                    {formData.business_type === 'student_seller' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {renderUploader('student_id', 'Valid Student ID Card', 'Must show current semester or valid expiration year')}
                                            {renderUploader('nid_front', 'User NID Front', 'Clear scan of national ID')}
                                        </div>
                                    )}

                                    {['business', 'official_store'].includes(formData.business_type) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {renderUploader('trade_license', 'Company Trade License', 'Up to date business trade license document')}
                                            {renderUploader('tin_certificate', 'TIN Certificate', 'Taxpayer Identification Number clearance')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 3 */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Review & Apply</h2>
                                    <p className="text-gray-500 mt-1">Check your details before submitting to our moderation team.</p>
                                </div>

                                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-4">
                                    <div className="flex gap-6 pb-4 border-b border-gray-200">
                                        <div className="w-16 h-16 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm shrink-0">
                                            {previews.profile_photo ? (
                                                <img src={previews.profile_photo} alt="Store Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <Store className="w-8 h-8 text-gray-400 m-4" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900">{formData.store_name}</h3>
                                            <p className="text-sm font-bold text-gray-500">campushat.com/s/{formData.store_slug}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-4 text-sm mt-4">
                                        <div>
                                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Account Type</span>
                                            <span className="font-bold text-gray-900">{businessTypes.find(t => t.id === formData.business_type)?.title}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Payout Method</span>
                                            <span className="font-bold text-gray-900 capitalize">{formData.mobile_banking_provider} ({formData.mobile_banking_number})</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Provided Documents</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {Object.entries(documents).filter(([_, f]) => f !== null).map(([key]) => (
                                                    <span key={key} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-600 capitalize">
                                                        {key.replace('_', ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 shadow-sm">
                                    <Checkbox
                                        id="terms"
                                        checked={formData.accepted_terms}
                                        onCheckedChange={(c) => updateFormData('accepted_terms', c === true)}
                                        className="mt-1 data-[state=checked]:bg-brand-primary"
                                    />
                                    <div className="space-y-1 leading-relaxed">
                                        <Label htmlFor="terms" className="font-bold text-gray-900 cursor-pointer">I accept the Seller Terms of Service</Label>
                                        <p className="text-xs text-gray-600">
                                            By submitting this application, I confirm all provided information and documents are authentic.
                                            I agree to CampusHat&apos;s anti-fraud policies, commission rates where applicable, and platform guidelines.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Navigation Footer */}
                    <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center sm:px-10">
                        {step > 1 ? (
                            <Button onClick={prevStep} variant="ghost" className="text-gray-500 hover:text-gray-900 font-bold px-0 gap-1">
                                Back
                            </Button>
                        ) : (
                            <div /> // Placeholder for flex alignment
                        )}

                        {step < 3 ? (
                            <Button onClick={nextStep} className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-8 h-12 rounded-xl text-sm shadow-lg shadow-brand-primary/25">
                                Continue to Next Step <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={submitApplication}
                                disabled={isSubmitting || !formData.accepted_terms}
                                className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-8 h-12 rounded-xl text-sm shadow-lg shadow-emerald-500/25 transition-all"
                            >
                                {isSubmitting ? 'Submitting...' : 'Complete Application'}
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
