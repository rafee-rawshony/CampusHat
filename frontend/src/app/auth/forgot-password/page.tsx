'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Mail, KeyRound, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword, resetPassword } from '@/services/auth.service'

const emailSchema = z.object({
    email: z.string().email('Please enter a valid email'),
})

const resetSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
})

type EmailForm = z.infer<typeof emailSchema>
type ResetForm = z.infer<typeof resetSchema>

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [step, setStep] = useState<'email' | 'reset'>('email')
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const emailForm = useForm<EmailForm>({
        resolver: zodResolver(emailSchema),
    })

    const resetForm = useForm<ResetForm>({
        resolver: zodResolver(resetSchema),
    })

    const onSendOTP = async (data: EmailForm) => {
        setIsLoading(true)
        try {
            await forgotPassword(data.email)
            setEmail(data.email)
            setStep('reset')
            toast.success('If an account exists, a reset code has been sent to your email.')
        } catch {
            toast.success('If an account exists, a reset code has been sent to your email.')
            setEmail(data.email)
            setStep('reset')
        } finally {
            setIsLoading(false)
        }
    }

    const onResetPassword = async (data: ResetForm) => {
        setIsLoading(true)
        try {
            await resetPassword({
                email,
                otp: data.otp,
                new_password: data.new_password,
            })
            toast.success('Password reset successfully! You can now log in.')
            router.push('/auth/login')
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Invalid or expired code. Please try again.'
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-primary font-medium mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>

                    {step === 'email' ? (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center">
                                    <Mail className="w-6 h-6 text-brand-primary" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Forgot Password</h1>
                                    <p className="text-sm text-gray-500">Enter your email to receive a reset code</p>
                                </div>
                            </div>

                            <form onSubmit={emailForm.handleSubmit(onSendOTP)} className="space-y-5">
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input
                                        {...emailForm.register('email')}
                                        type="email"
                                        placeholder="your@email.com"
                                        className="bg-gray-50"
                                    />
                                    {emailForm.formState.errors.email && (
                                        <p className="text-red-500 text-xs">{emailForm.formState.errors.email.message}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 font-bold bg-brand-primary hover:bg-brand-dark"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Code'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center">
                                    <KeyRound className="w-6 h-6 text-brand-primary" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Reset Password</h1>
                                    <p className="text-sm text-gray-500">
                                        Enter the 6-digit code sent to <span className="font-medium text-gray-700">{email}</span>
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-5">
                                <div className="space-y-2">
                                    <Label>6-Digit Code</Label>
                                    <Input
                                        {...resetForm.register('otp')}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="bg-gray-50 text-center text-xl tracking-[0.5em] font-bold"
                                    />
                                    {resetForm.formState.errors.otp && (
                                        <p className="text-red-500 text-xs">{resetForm.formState.errors.otp.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <div className="relative">
                                        <Input
                                            {...resetForm.register('new_password')}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Min 8 characters"
                                            className="bg-gray-50 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {resetForm.formState.errors.new_password && (
                                        <p className="text-red-500 text-xs">{resetForm.formState.errors.new_password.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <Input
                                        {...resetForm.register('confirm_password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Re-enter password"
                                        className="bg-gray-50"
                                    />
                                    {resetForm.formState.errors.confirm_password && (
                                        <p className="text-red-500 text-xs">{resetForm.formState.errors.confirm_password.message}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 font-bold bg-brand-primary hover:bg-brand-dark"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="w-full text-center text-sm text-gray-500 hover:text-brand-primary font-medium"
                                >
                                    Didn't receive a code? Try again
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
