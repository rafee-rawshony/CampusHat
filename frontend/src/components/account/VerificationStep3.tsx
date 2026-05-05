'use client'

import { useState, useRef } from 'react'
import { UploadCloud, X, CheckCircle, Image as ImageIcon, FileText, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'

interface Step1Data {
    student_id_number: string
    university_email: string
}

interface Step2Data {
    university_id: string
}

interface VerificationStep3Props {
    step1Data: Step1Data
    step2Data: Step2Data
    onBack: () => void
    onSuccess: () => void
}

export function VerificationStep3({ step1Data, step2Data, onBack, onSuccess }: VerificationStep3Props) {
    const { user, setUser } = useAuthStore()
    const router = useRouter()

    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFile = (selectedFile: File) => {
        if (selectedFile.size > 10 * 1024 * 1024) {
            return "File too large. Maximum size is 10MB."
        }
        const allowed = ['image/jpeg', 'image/png', 'application/pdf']
        if (!allowed.includes(selectedFile.type)) {
            return "Invalid file type. Use JPG, PNG or PDF."
        }
        return null
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0]
            const err = validateFile(selectedFile)
            if (err) {
                setError(err)
                setFile(null)
                setPreviewUrl(null)
                return
            }
            
            setError('')
            setFile(selectedFile)
            
            if (selectedFile.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(selectedFile))
            } else {
                setPreviewUrl(null) // It's a PDF
            }
        }
    }

    const clearFile = () => {
        setFile(null)
        setPreviewUrl(null)
        setError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSubmit = async () => {
        if (!file) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('verification_type', 'student_id')
            formData.append('student_id_number', step1Data.student_id_number)
            if (step1Data.university_email) {
                formData.append('university_email', step1Data.university_email)
            }
            formData.append('university_id', step2Data.university_id)
            formData.append('submitted_document', file)

            await api.post('/auth/verification/submit/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            // Update user state
            if (user) {
                setUser({ ...user, verification_status: 'pending' })
            }
            toast.success('Verification request submitted.')
            onSuccess()
            router.refresh() // re-evaluate page logic
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data?.detail || 'Failed to submit documents. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="font-semibold text-gray-800 text-lg">Verify Your Identity</h2>
            <p className="text-sm text-gray-500 mb-6 mt-1">Upload a photo or scan of your student ID card.</p>

            <div className="space-y-6">
                
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                {/* DESKTOP: Drag and Drop (Hidden on sm) */}
                <div className="hidden sm:block">
                    {!file ? (
                        <div 
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/jpeg,image/png,application/pdf"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-[#4C3B8A] transition-colors" />
                            <p className="font-semibold text-gray-700">Drag and drop your ID card here</p>
                            <p className="text-sm text-gray-500 mt-1 mb-2">or click to browse files</p>
                            <p className="text-xs text-gray-400 font-medium">Accepts JPG, PNG, PDF &bull; Max 10MB</p>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-4">
                                {previewUrl ? (
                                    <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden shrink-0">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white flex items-center justify-center shrink-0">
                                        <FileText className="w-8 h-8 text-blue-500" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-gray-800 text-sm max-w-[200px] truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={clearFile}
                                className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* MOBILE: Distinct Buttons (Hidden on md+) */}
                <div className="sm:hidden space-y-3">
                    {!file ? (
                        <>
                            <label className="flex items-center justify-between w-full border border-gray-200 rounded-xl p-4 bg-white active:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Camera className="w-5 h-5 text-gray-600" />
                                    <span className="font-medium text-gray-800">Take Photo</span>
                                </div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleFileSelect} 
                                />
                                <span className="text-gray-400 text-lg">&rsaquo;</span>
                            </label>
                            
                            <label className="flex items-center justify-between w-full border border-gray-200 rounded-xl p-4 bg-white active:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <ImageIcon className="w-5 h-5 text-gray-600" />
                                    <span className="font-medium text-gray-800">Choose from Gallery</span>
                                </div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden"
                                    onChange={handleFileSelect} 
                                />
                                <span className="text-gray-400 text-lg">&rsaquo;</span>
                            </label>

                            <label className="flex items-center justify-between w-full border border-gray-200 rounded-xl p-4 bg-white active:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-600" />
                                    <span className="font-medium text-gray-800">Upload PDF</span>
                                </div>
                                <input 
                                    type="file" 
                                    accept="application/pdf" 
                                    className="hidden"
                                    onChange={handleFileSelect} 
                                />
                                <span className="text-gray-400 text-lg">&rsaquo;</span>
                            </label>
                            
                            <p className="text-center text-xs text-gray-400 font-medium mt-2">Max 10MB limit</p>
                        </>
                    ) : (
                        <div className="border border-[#059669]/20 bg-[#059669]/5 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <CheckCircle className="w-5 h-5 text-[#059669] shrink-0" />
                                <div className="truncate">
                                    <p className="font-medium text-[#059669] text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-[#059669]/70 font-medium">Ready to upload</p>
                                </div>
                            </div>
                            <button 
                                onClick={clearFile}
                                className="p-2 shrink-0 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-100">
                    <button
                        onClick={onBack}
                        className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                        disabled={isSubmitting}
                    >
                        &larr; Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!file || isSubmitting}
                        className="bg-[#059669] hover:bg-[#047857] text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Request Verification'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
