'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Store, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
    login as loginApi,
    resendVerification,
    sendOtp,
    verifyOtp,
} from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'

// OTP login is backed by /auth/otp/send/ and /auth/otp/verify/ on the backend.
const OTP_LOGIN_ENABLED = true

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

const otpRequestSchema = z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
})

type LoginForm = z.infer<typeof loginSchema>
type OTPRequestForm = z.infer<typeof otpRequestSchema>

// Shared redirect logic — used after both password and OTP login.
// seller_application_status is checked because the backend never changes
// user.role to 'seller' on approval — it only sets SellerProfile.status.
function getRoleRedirect(
    user: { role: string; seller_application_status?: string | null },
    redirectParam: string | null
): string {
    if (redirectParam) return redirectParam
    if (['admin', 'moderator', 'seller_mod', 'marketplace_mod'].includes(user.role)) return '/admin'
    if (user.seller_application_status === 'approved') return '/seller'
    return '/'
}

export default function LoginPage() {
    const router = useRouter()
    const { user, isAuthenticated, _hasHydrated, setUser, setAccessToken } = useAuthStore()
    const [showPassword, setShowPassword] = useState(false)
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
    const [methodTab, setMethodTab] = useState<'password' | 'otp'>('password')
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [emailNotVerified, setEmailNotVerified] = useState(false)
    const [unverifiedEmail, setUnverifiedEmail] = useState('')

    // If store has hydrated and user is already signed in, redirect them away
    useEffect(() => {
        if (_hasHydrated && isAuthenticated && user) {
            const searchParams = new URLSearchParams(window.location.search)
            router.replace(getRoleRedirect(user, searchParams.get('redirect')))
        }
    }, [_hasHydrated, isAuthenticated, user, router])

    useEffect(() => {
        if (sessionStorage.getItem('session_expired')) {
            sessionStorage.removeItem('session_expired')
            toast.error('Your session expired. Please sign in again.')
        }
    }, [])


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
            const { user, access_token } = await loginApi(data)
            setAccessToken(access_token)
            setUser(user)
            loginForm.reset()
            toast.success('Welcome back!')

            const searchParams = new URLSearchParams(window.location.search)
            router.push(getRoleRedirect(user, searchParams.get('redirect')))
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
            await sendOtp({ identifier: data.identifier })
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
            const { user, access_token } = await verifyOtp({
                identifier: otpForm.getValues('identifier'),
                otp,
            })
            setAccessToken(access_token)
            setUser(user)
            otpForm.reset()
            setOtp('')
            toast.success('Welcome!')

            const searchParams = new URLSearchParams(window.location.search)
            router.push(getRoleRedirect(user, searchParams.get('redirect')))
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid OTP')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendVerification = async () => {
        try {
            await resendVerification(unverifiedEmail)
            toast.success('Verification email sent!')
        } catch {
            toast.error('Failed to resend verification')
        }
    }

    // Show blank while store hydrates or while redirecting an already-logged-in user
    if (!_hasHydrated || (_hasHydrated && isAuthenticated)) return null

    return (
        <div className="min-h-screen flex bg-surface-base">
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start mb-4">
                            <span className="text-3xl font-bold text-gray-800">Campus</span>
                            <span className="text-3xl font-bold text-brand-primary">Hat</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Welcome back</h2>
                        <p className="text-sm text-gray-500 mt-2">
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 animate-fade-in">
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
                        <Tabs value={authTab} onValueChange={(v) => {
                            if (v === 'register') {
                                router.push('/auth/register')
                            } else {
                                setAuthTab(v as 'login')
                            }
                        }}>
                            <TabsList className="w-full">
                                <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
                                <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login" className="mt-6">
                                {/* Password / OTP sub-tabs — OTP tab hidden until backend is ready */}
                                <Tabs value={methodTab} onValueChange={(v) => setMethodTab(v as 'password' | 'otp')}>
                                    {OTP_LOGIN_ENABLED && (
                                        <TabsList className="w-full mb-4">
                                            <TabsTrigger value="password" className="flex-1 gap-1.5">
                                                <Eye className="h-3.5 w-3.5" /> Password
                                            </TabsTrigger>
                                            <TabsTrigger value="otp" className="flex-1 gap-1.5">
                                                <Smartphone className="h-3.5 w-3.5" /> OTP
                                            </TabsTrigger>
                                        </TabsList>
                                    )}

                                    {/* Password Login */}
                                    <TabsContent value="password">
                                        <form onSubmit={loginForm.handleSubmit(handlePasswordLogin)} className="space-y-4" autoComplete="off">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter your Email or Student Email"
                                                    autoComplete="off"
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
                                                        autoComplete="new-password"
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
                                            <div className="flex justify-end">
                                                <Link href="/auth/forgot-password" className="text-xs text-brand-primary hover:underline font-medium">
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <Button type="submit" className="w-full" disabled={isLoading}>
                                                {isLoading ? 'Signing in...' : 'Sign In'}
                                            </Button>
                                        </form>
                                    </TabsContent>

                                    {/* OTP Login — kept as dead code until backend is ready */}
                                    {OTP_LOGIN_ENABLED && (
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
                                    )}
                                </Tabs>

                                {/* Social Login */}
                                <div className="mt-6">
                                    <div className="relative">
                                        <Separator />
                                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-card px-2 text-xs text-muted-foreground">
                                            or continue with
                                        </span>
                                    </div>
                                    <div className="flex justify-center gap-4 mt-4">
                                        <Button variant="outline" size="icon" className="rounded-full">
                                            <span className="text-xs font-semibold">G</span>
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#4C3B8A] to-[#45357A] items-center justify-center p-12 overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-white/5 blur-[120px]"></div>
                    <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#8b76c4]/20 blur-[100px]"></div>
                </div>

                <div className="relative z-10 max-w-lg text-white">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                            <Store className="text-white h-6 w-6" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Start your campus journey today</h3>
                        <p className="text-white/80 text-lg leading-relaxed mb-8">
                            Join thousands of students and faculty members buying, selling, and connecting on the ultimate campus marketplace.
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#45357A] bg-gray-200 overflow-hidden">
                                        <Image src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" width={40} height={40} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm font-medium">
                                <span className="font-bold">4.9/5</span> rating from 10k+ users
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
