'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Store, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

const otpRequestSchema = z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
})

type LoginForm = z.infer<typeof loginSchema>
type OTPRequestForm = z.infer<typeof otpRequestSchema>

export default function LoginPage() {
    const router = useRouter()
    const { setUser, setAccessToken } = useAuthStore()
    const [showPassword, setShowPassword] = useState(false)
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
    const [methodTab, setMethodTab] = useState<'password' | 'otp'>('password')
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [emailNotVerified, setEmailNotVerified] = useState(false)
    const [unverifiedEmail, setUnverifiedEmail] = useState('')

    const loginForm = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    const otpForm = useForm<OTPRequestForm>({
        resolver: zodResolver(otpRequestSchema),
        defaultValues: { identifier: '' },
    })

    const handlePasswordLogin = async (data: LoginForm) => {
        setIsLoading(true)
        setEmailNotVerified(false)
        try {
            const response = await api.post('/auth/login/', data)
            const { user, access_token } = response.data.data || response.data
            setAccessToken(access_token)
            setUser(user)
            toast.success('Welcome back!')

            // Role-based redirect
            if (user.role === 'admin') {
                router.push('/admin/dashboard')
            } else if (user.role === 'seller') {
                router.push('/seller/dashboard')
            } else {
                router.push('/')
            }
        } catch (error: any) {
            const message = error.response?.data?.message || error.response?.data?.detail || 'Login failed'
            if (message.includes('not verified') || error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
                setEmailNotVerified(true)
                setUnverifiedEmail(data.email)
            }
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendOtp = async (data: OTPRequestForm) => {
        setIsLoading(true)
        try {
            await api.post('/auth/otp/send/', { identifier: data.identifier })
            setOtpSent(true)
            toast.success('OTP sent! Check your inbox.')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send OTP')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        setIsLoading(true)
        try {
            const response = await api.post('/auth/otp/verify/', {
                identifier: otpForm.getValues('identifier'),
                otp,
            })
            const { user, access_token } = response.data.data || response.data
            setAccessToken(access_token)
            setUser(user)
            toast.success('Welcome!')
            router.push('/')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid OTP')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendVerification = async () => {
        try {
            await api.post('/auth/resend-verification/', { email: unverifiedEmail })
            toast.success('Verification email sent!')
        } catch {
            toast.error('Failed to resend verification')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-base p-4">
            <Card className="w-full max-w-md animate-fade-in">
                <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-brand-primary">Campus</span>
                        <span className="text-2xl font-bold text-brand-accent">Hat</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Unified access for students and faculty
                    </p>
                </CardHeader>
                <CardContent>
                    {/* Email Not Verified Banner */}
                    {emailNotVerified && (
                        <div className="mb-4 p-3 rounded-btn bg-badge-pending/10 border border-badge-pending text-sm">
                            <p className="font-medium text-badge-pending">Email not verified</p>
                            <p className="text-muted-foreground mt-1">
                                Please verify your email address.{' '}
                                <button
                                    onClick={handleResendVerification}
                                    className="text-brand-primary hover:underline font-medium"
                                >
                                    Resend verification
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Login / Register Tabs */}
                    <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'register')}>
                        <TabsList className="w-full">
                            <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
                            <TabsTrigger value="register" className="flex-1" asChild>
                                <Link href="/auth/register">Register</Link>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="mt-6">
                            {/* Password / OTP sub-tabs */}
                            <Tabs value={methodTab} onValueChange={(v) => setMethodTab(v as 'password' | 'otp')}>
                                <TabsList className="w-full mb-4">
                                    <TabsTrigger value="password" className="flex-1 gap-1.5">
                                        <Eye className="h-3.5 w-3.5" /> Password
                                    </TabsTrigger>
                                    <TabsTrigger value="otp" className="flex-1 gap-1.5">
                                        <Smartphone className="h-3.5 w-3.5" /> OTP
                                    </TabsTrigger>
                                </TabsList>

                                {/* Password Login */}
                                <TabsContent value="password">
                                    <form onSubmit={loginForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="your@university.edu"
                                                {...loginForm.register('email')}
                                            />
                                            {loginForm.formState.errors.email && (
                                                <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder="••••••••"
                                                    {...loginForm.register('password')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {loginForm.formState.errors.password && (
                                                <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                                            )}
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? 'Signing in...' : 'Sign In'}
                                        </Button>
                                    </form>
                                </TabsContent>

                                {/* OTP Login */}
                                <TabsContent value="otp">
                                    {!otpSent ? (
                                        <form onSubmit={otpForm.handleSubmit(handleSendOtp)} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="identifier">Email or Phone</Label>
                                                <Input
                                                    id="identifier"
                                                    placeholder="Email or phone number"
                                                    {...otpForm.register('identifier')}
                                                />
                                                {otpForm.formState.errors.identifier && (
                                                    <p className="text-xs text-destructive">{otpForm.formState.errors.identifier.message}</p>
                                                )}
                                            </div>
                                            <Button type="submit" className="w-full" disabled={isLoading}>
                                                {isLoading ? 'Sending...' : 'Send OTP'}
                                            </Button>
                                        </form>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Enter 6-digit OTP</Label>
                                                <Input
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    className="text-center text-lg tracking-[0.5em]"
                                                />
                                            </div>
                                            <Button onClick={handleVerifyOtp} className="w-full" disabled={isLoading}>
                                                {isLoading ? 'Verifying...' : 'Verify OTP'}
                                            </Button>
                                            <button
                                                onClick={() => setOtpSent(false)}
                                                className="text-sm text-brand-primary hover:underline w-full text-center"
                                            >
                                                Resend OTP
                                            </button>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>

                            {/* Join as Seller */}
                            <div className="mt-4">
                                <Button variant="outline" className="w-full gap-2" asChild>
                                    <Link href="/auth/register?seller=true">
                                        <Store className="h-4 w-4" /> Join as Seller
                                    </Link>
                                </Button>
                            </div>

                            {/* Social Login */}
                            <div className="mt-6">
                                <div className="relative">
                                    <Separator />
                                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-card px-2 text-xs text-muted-foreground">
                                        or continue with
                                    </span>
                                </div>
                                <div className="flex justify-center gap-4 mt-4">
                                    {['Google', 'Apple', 'Facebook'].map((provider) => (
                                        <Button key={provider} variant="outline" size="icon" className="rounded-full">
                                            <span className="text-xs font-semibold">{provider[0]}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
