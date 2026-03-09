'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, IdCard, Check, X, UploadCloud, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface University {
    id: string
    name: string
    short_code?: string
}

export default function VerifyPage() {
    const { user, setUser, isAuthenticated, isVerifiedStudent } = useAuthStore()
    const router = useRouter()

    const [currentStep, setCurrentStep] = useState(1)
    const [universities, setUniversities] = useState<University[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showPending, setShowPending] = useState(false)

    // Form State
    const [studentId, setStudentId] = useState('')
    const [uniEmail, setUniEmail] = useState('')
    const [campusId, setCampusId] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Initial Guard & State Load
    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/auth/login')
            return
        }

        // If already a student/faculty, return to account
        if (isVerifiedStudent()) {
            router.replace('/account')
            return
        }

        if (user?.verification_status === 'pending') {
            setShowPending(true)
        }

        // Pre-fill campus if profile has it mapping
        if (user?.university_id && !campusId) {
            setCampusId(user.university_id)
        }
    }, [isAuthenticated, isVerifiedStudent, user, router, campusId])

    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const { data } = await api.get('/universities/')
                setUniversities(data.data || data.results || data || [])
            } catch {
                setUniversities([
                    { id: '1', name: 'American International University-Bangladesh' },
                    { id: '2', name: 'University of Dhaka' },
                    { id: '3', name: 'North South University' },
                ])
            }
        }
        fetchUniversities()
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Max 5MB.')
            return
        }

        const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Only JPG, PNG, and PDF are allowed.')
            return
        }

        setSelectedFile(file)
    }

    const handleSubmit = async () => {
        if (!studentId || !campusId || !selectedFile) {
            toast.error('Please complete all required fields.')
            return
        }

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('student_id_number', studentId)
            formData.append('university_id', campusId)
            if (uniEmail) formData.append('university_email', uniEmail)
            formData.append('id_document', selectedFile)

            // Submit logic
            await api.post('/auth/verification/submit/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            // Optimistic Update
            if (user) {
                setUser({ ...user, verification_status: 'pending' })
            }
            setShowPending(true)
            toast.success('Verification request submitted.')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Submission failed.')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        if (user) {
            // Technically we should clear the backend state too if implemented that way, 
            // but for UI sake we wipe the local form
            setUser({ ...user, verification_status: 'not_submitted', verification_rejection_reason: '' })
        }
        setCurrentStep(1)
        setShowPending(false)
    }

    if (!user) return null

    // RENDER: Pending State
    if (showPending) {
        return (
            <div className="min-h-screen bg-surface-base py-12 px-4 flex items-center justify-center animate-fade-in">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
                    <div className="h-20 w-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <Clock className="h-10 w-10 text-brand-primary animate-pulse" />
                        <div className="absolute top-0 right-0 h-4 w-4 bg-amber-400 rounded-full border-2 border-white"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                        Your verification request has been received and is being reviewed by our <span className="text-brand-primary font-medium hover:underline cursor-pointer">campus administrators</span>. This usually takes 24-48 hours.
                    </p>
                    <Button onClick={() => router.push('/marketplace')} className="w-full">
                        Back to Marketplace
                    </Button>
                </div>
            </div>
        )
    }

    // STEPS NAVIGATION
    const steps = [
        { id: 1, name: 'DETAILS' },
        { id: 2, name: 'CAMPUS' },
        { id: 3, name: 'IDENTITY' },
    ]

    return (
        <div className="min-h-screen bg-surface-base py-12 px-4 sm:px-6">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full mx-auto overflow-hidden animate-fade-in">

                {/* Rejection Banner */}
                {user.verification_status === 'rejected' && (
                    <div className="bg-red-50 border-b border-red-100 p-4 shrink-0">
                        <div className="flex items-start">
                            <X className="h-5 w-5 text-red-500 mr-2 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-red-800">Verification Rejected</h4>
                                <p className="text-xs text-red-700 mt-1">{user.verification_rejection_reason || 'Information provided could not be verified.'}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={resetForm} className="ml-2 text-red-600 border-red-200 hover:bg-red-100 shrink-0">
                                Resubmit
                            </Button>
                        </div>
                    </div>
                )}

                <div className="p-6 sm:p-8">
                    {/* Top Progress Indicator */}
                    <div className="relative mb-10">
                        <div className="overflow-hidden h-1 mb-4 text-xs flex rounded bg-gray-100 absolute top-4 left-6 right-6 z-0">
                            <div
                                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-primary transition-all duration-300"
                            ></div>
                        </div>

                        <ul className="flex justify-between relative z-10">
                            {steps.map((step) => {
                                const isActive = currentStep === step.id
                                const isCompleted = currentStep > step.id

                                return (
                                    <li key={step.id} className="flex flex-col items-center">
                                        <div className={cn(
                                            "h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white transition-colors duration-300",
                                            isActive ? "bg-brand-primary text-white" :
                                                isCompleted ? "bg-brand-primary text-white" : "bg-gray-200 text-gray-400"
                                        )}>
                                            {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold mt-2 tracking-wider",
                                            (isActive || isCompleted) ? "text-brand-primary" : "text-gray-400"
                                        )}>
                                            {step.name}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Content Steps */}
                    <div className="mt-8">

                        {/* STEP 1: Details */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-slide-in-right">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Academic Details</h2>
                                    <p className="text-sm text-gray-500 mt-1">Provide your student ID information.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="studentId">Student ID Number <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="studentId"
                                            value={studentId}
                                            onChange={(e) => setStudentId(e.target.value)}
                                            placeholder="222-15-6235"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="uniEmail">University Email <span className="font-normal text-muted-foreground">(Optional)</span></Label>
                                        <Input
                                            id="uniEmail"
                                            type="email"
                                            value={uniEmail}
                                            onChange={(e) => setUniEmail(e.target.value)}
                                            placeholder="rizvee15-6235@s.diu.edu.bd"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-12 text-md mt-6"
                                    disabled={!studentId.trim()}
                                    onClick={() => setCurrentStep(2)}
                                >
                                    Next Step
                                </Button>
                            </div>
                        )}

                        {/* STEP 2: Campus */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-slide-in-right">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Select Your Campus</h2>
                                    <p className="text-sm text-gray-500 mt-1">Which university are you currently attending?</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="campus">Campus Name <span className="text-red-500">*</span></Label>
                                    <Select value={campusId} onValueChange={setCampusId}>
                                        <SelectTrigger className="bg-gray-50 h-12">
                                            <SelectValue placeholder="Select your university..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {universities.map((uni) => (
                                                <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <Button variant="outline" className="h-12" onClick={() => setCurrentStep(1)}>
                                        Back
                                    </Button>
                                    <Button
                                        className="h-12"
                                        disabled={!campusId}
                                        onClick={() => setCurrentStep(3)}
                                    >
                                        Next Step
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Identity */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-slide-in-right">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Verify Identity</h2>
                                    <p className="text-sm text-gray-500 mt-1">Upload a photo or PDF of your student ID card.</p>
                                </div>

                                <div className="mt-4">
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept="image/jpeg,image/png,application/pdf"
                                    />

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-colors bg-gray-50",
                                            selectedFile ? "border-brand-primary/50 bg-brand-light/30" : "border-gray-200 hover:border-brand-primary hover:bg-brand-light/20"
                                        )}
                                    >
                                        <div className="h-12 w-12 rounded-full bg-brand-light flex items-center justify-center mb-4">
                                            {selectedFile ? (
                                                selectedFile.type === 'application/pdf' ? <FileText className="h-6 w-6 text-brand-primary" /> : <IdCard className="h-6 w-6 text-brand-primary" />
                                            ) : (
                                                <UploadCloud className="h-6 w-6 text-brand-primary" />
                                            )}
                                        </div>

                                        {selectedFile ? (
                                            <div className="text-center">
                                                <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="font-medium text-gray-700">Click to browse files</p>
                                                <p className="text-xs text-gray-500 mt-2">Supported Formats: JPG, PNG, PDF (Max 5MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <Button variant="outline" className="h-12 border-gray-200" onClick={() => setCurrentStep(2)} disabled={isLoading}>
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!selectedFile || isLoading}
                                        className="h-12 bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {isLoading ? 'Submitting...' : 'Request Verification'}
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}
