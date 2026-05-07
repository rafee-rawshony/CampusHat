'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Smartphone, ShieldCheck, AlertCircle, Loader2, Mail, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { login as loginApi, resendVerification, sendOtp, verifyOtp } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { AuthHeroPanel } from '@/components/auth/AuthHeroPanel'
import { api } from '@/lib/api'

const OTP_LOGIN_ENABLED = true

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})
const otpRequestSchema = z.object({ identifier: z.string().min(1, 'Email or phone is required') })
const registerSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Enter a valid phone number').max(15),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
    terms: z.literal(true, { message: 'You must accept the terms' }),
}).refine(d => d.password === d.confirm_password, { message: "Passwords don't match", path: ['confirm_password'] })

type LoginForm = z.infer<typeof loginSchema>
type OTPRequestForm = z.infer<typeof otpRequestSchema>
type RegisterForm = z.infer<typeof registerSchema>

function getRoleRedirect(user: { role: string; seller_application_status?: string | null }, redirectParam: string | null): string {
    if (redirectParam) return redirectParam
    if (['admin', 'moderator', 'seller_mod', 'marketplace_mod'].includes(user.role)) return '/admin'
    if (user.seller_application_status === 'approved') return '/dashboard/seller'
    return '/'
}

function getPasswordStrength(pw: string) {
    if (!pw) return { score: 0, label: '', color: '' }
    let s = 0
    if (pw.length >= 8) s++; if (pw.length >= 12) s++; if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^a-zA-Z0-9]/.test(pw)) s++
    if (s <= 1) return { score: s, label: 'Weak', color: 'bg-red-500' }
    if (s <= 2) return { score: s, label: 'Fair', color: 'bg-orange-400' }
    if (s <= 3) return { score: s, label: 'Good', color: 'bg-yellow-400' }
    if (s <= 4) return { score: s, label: 'Strong', color: 'bg-emerald-400' }
    return { score: s, label: 'Very Strong', color: 'bg-emerald-500' }
}

function AuthPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isAuthenticated, _hasHydrated, setUser, setAccessToken } = useAuthStore()
    const initialTab = searchParams?.get('tab') === 'register' ? 'register' : 'login'
    const [authTab, setAuthTab] = useState<'login' | 'register'>(initialTab)
    const [methodTab, setMethodTab] = useState<'password' | 'otp'>('password')
    const [showPassword, setShowPassword] = useState(false)
    const [showPw, setShowPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [emailNotVerified, setEmailNotVerified] = useState(false)
    const [unverifiedEmail, setUnverifiedEmail] = useState('')
    const [successEmail, setSuccessEmail] = useState('')

    useEffect(() => {
        if (_hasHydrated && isAuthenticated && user) {
            const sp = new URLSearchParams(window.location.search)
            router.replace(getRoleRedirect(user, sp.get('redirect')))
        }
    }, [_hasHydrated, isAuthenticated, user, router])

    useEffect(() => {
        if (sessionStorage.getItem('session_expired')) {
            sessionStorage.removeItem('session_expired')
            toast.error('Your session expired. Please sign in again.')
        }
    }, [])

    const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
    const otpForm = useForm<OTPRequestForm>({ resolver: zodResolver(otpRequestSchema), defaultValues: { identifier: '' } })
    const regForm = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: { full_name: '', email: '', phone: '', password: '', confirm_password: '', terms: undefined as any },
    })

    const regPw = regForm.watch('password')
    const strength = getPasswordStrength(regPw || '')

    const handlePasswordLogin = async (data: LoginForm) => {
        setIsLoading(true); setEmailNotVerified(false)
        try {
            const { user, access_token } = await loginApi(data)
            setAccessToken(access_token); setUser(user); loginForm.reset()
            toast.success('Welcome back!')
            const sp = new URLSearchParams(window.location.search)
            router.push(getRoleRedirect(user, sp.get('redirect')))
        } catch (error: any) {
            const errorsObj = error.response?.data?.errors || {}
            const nonField = errorsObj.non_field_errors?.[0]
            const fieldFirst = (() => { for (const k of Object.keys(errorsObj)) { const v = errorsObj[k]; if (Array.isArray(v) && v.length) return v[0] } return null })()
            const message = nonField || fieldFirst || error.response?.data?.message || error.response?.data?.detail || 'Login failed'
            const lc = String(message).toLowerCase()
            if (lc.includes('verify') || lc.includes('not verified') || error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
                setEmailNotVerified(true); setUnverifiedEmail(data.email)
            }
            toast.error(message)
        } finally { setIsLoading(false) }
    }

    const handleSendOtp = async (data: OTPRequestForm) => {
        setIsLoading(true)
        try { await sendOtp({ identifier: data.identifier }); setOtpSent(true); toast.success('OTP sent!') }
        catch (e: any) { toast.error(e.response?.data?.message || 'Failed to send OTP') }
        finally { setIsLoading(false) }
    }

    const handleVerifyOtp = async () => {
        setIsLoading(true)
        try {
            const { user, access_token } = await verifyOtp({ identifier: otpForm.getValues('identifier'), otp })
            setAccessToken(access_token); setUser(user); otpForm.reset(); setOtp(''); toast.success('Welcome!')
            const sp = new URLSearchParams(window.location.search)
            router.push(getRoleRedirect(user, sp.get('redirect')))
        } catch (e: any) { toast.error(e.response?.data?.message || 'Invalid OTP') }
        finally { setIsLoading(false) }
    }

    const handleResendVerification = async () => {
        try { await resendVerification(unverifiedEmail); toast.success('Verification email sent!') }
        catch { toast.error('Failed to resend verification') }
    }

    const handleRegister = async (data: any) => {
        setIsLoading(true)
        try {
            await api.post('/auth/register/', { full_name: data.full_name, email: data.email, phone: data.phone, password: data.password })
            regForm.reset(); setSuccessEmail(data.email)
        } catch (error: any) {
            const resData = error.response?.data || {}
            const errorsObj = resData.errors || resData
            let handledInField = false

            if (typeof errorsObj === 'object') {
                Object.keys(errorsObj).forEach(key => {
                    if (['email', 'password', 'phone', 'full_name'].includes(key)) {
                        const val = errorsObj[key]
                        let errMsg = Array.isArray(val) ? val[0] : String(val)
                        
                        if (key === 'email' && errMsg.toLowerCase().includes('already exists')) {
                            errMsg = 'This email is already in the database, please login.'
                        }
                        
                        regForm.setError(key as any, { type: 'server', message: errMsg })
                        handledInField = true
                    }
                })
            }

            const nonField = errorsObj.non_field_errors?.[0]
            if (nonField) {
                toast.error(nonField)
            } else if (!handledInField) {
                toast.error(resData.message || resData.detail || 'Registration failed. Please check your inputs.')
            }
        } finally { setIsLoading(false) }
    }

    if (!_hasHydrated || (_hasHydrated && isAuthenticated)) return null

    // Success state after registration
    if (successEmail) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-gray-200/60 p-10 text-center border border-gray-100/80">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-7 border-4 border-emerald-100">
                        <Check className="w-10 h-10 text-emerald-500 stroke-[2.5]" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Check your email!</h2>
                    <p className="text-gray-500 text-sm mb-2">We sent a verification link to</p>
                    <p className="font-bold text-[#4C3B8A] text-base mb-6 break-all bg-purple-50 rounded-xl px-4 py-2.5 inline-block border border-purple-100/60">{successEmail}</p>
                    <p className="text-gray-400 text-xs mb-8">Click the link in your email to verify your account.</p>
                    <div className="space-y-3">
                        <button onClick={() => { setSuccessEmail(''); setAuthTab('login') }} className="w-full bg-[#4C3B8A] hover:bg-[#3d2f70] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-[#4C3B8A]/20">Continue to Login</button>
                        <button onClick={() => { setSuccessEmail(''); regForm.reset() }} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">Use a different email</button>
                    </div>
                </div>
            </div>
        )
    }

    const inputCls = 'w-full h-11 px-3.5 rounded-xl border text-sm font-medium outline-none transition-all duration-200 border-gray-200 bg-gray-50/80 focus:border-[#4C3B8A] focus:ring-2 focus:ring-[#4C3B8A]/15 focus:bg-white'
    const inputErrCls = 'w-full h-11 px-3.5 rounded-xl border text-sm font-medium outline-none transition-all duration-200 border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-2 focus:ring-red-500/15'

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
            {/* Left — Form Panel (scrollable) */}
            <div className="flex-1 flex flex-col pt-6 md:pt-10 pb-10 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-y-auto">
                <div className="mx-auto w-full max-w-md">
                    {/* Header — no CampusHat brand */}
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                            {authTab === 'login' ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1.5">
                            {authTab === 'login' ? 'Enter your credentials to access your account.' : (
                                <>Already have an account?{' '}<button onClick={() => setAuthTab('login')} className="text-[#4C3B8A] font-bold hover:underline">Sign in</button></>
                            )}
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="bg-gray-100 rounded-xl p-1 flex mb-6">
                        <button onClick={() => setAuthTab('login')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${authTab === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Login</button>
                        <button onClick={() => setAuthTab('register')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${authTab === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Register</button>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-gray-100/80 shadow-xl shadow-gray-200/50 p-6 sm:p-8">
                        {/* ═══ LOGIN ═══ */}
                        {authTab === 'login' && (
                            <>
                                {emailNotVerified && (
                                    <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-sm">
                                        <p className="font-semibold text-amber-800">Email not verified</p>
                                        <p className="text-amber-700/80 mt-1">Please verify your email.{' '}<button onClick={handleResendVerification} className="text-[#4C3B8A] hover:underline font-semibold">Resend verification</button></p>
                                    </div>
                                )}

                                {OTP_LOGIN_ENABLED && (
                                    <Tabs value={methodTab} onValueChange={(v) => setMethodTab(v as any)}>
                                        <TabsList className="w-full mb-5">
                                            <TabsTrigger value="password" className="flex-1 gap-1.5"><Eye className="h-3.5 w-3.5" /> Password</TabsTrigger>
                                            <TabsTrigger value="otp" className="flex-1 gap-1.5"><Smartphone className="h-3.5 w-3.5" /> OTP</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="password">
                                            <form onSubmit={loginForm.handleSubmit(handlePasswordLogin)} className="space-y-5" autoComplete="off">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                                                    <Input id="email" type="email" placeholder="Enter your email address" autoComplete="off" className="h-11 rounded-xl bg-gray-50/80 border-gray-200 focus:bg-white focus:border-[#4C3B8A] focus:ring-2 focus:ring-[#4C3B8A]/15" {...loginForm.register('email')} />
                                                    {loginForm.formState.errors.email && <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                                                    <div className="relative">
                                                        <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className="h-11 rounded-xl bg-gray-50/80 border-gray-200 focus:bg-white focus:border-[#4C3B8A] focus:ring-2 focus:ring-[#4C3B8A]/15 pr-10" {...loginForm.register('password')} />
                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                                                    </div>
                                                    {loginForm.formState.errors.password && <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>}
                                                </div>
                                                <div className="flex justify-end"><Link href="/auth/forgot-password" className="text-xs text-[#4C3B8A] hover:underline font-semibold">Forgot password?</Link></div>
                                                <Button type="submit" className="w-full h-11 rounded-xl bg-[#4C3B8A] hover:bg-[#3d2f70] text-white font-bold shadow-lg shadow-[#4C3B8A]/20" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign In'}</Button>
                                            </form>
                                        </TabsContent>
                                        <TabsContent value="otp">
                                            {!otpSent ? (
                                                <form onSubmit={otpForm.handleSubmit(handleSendOtp)} className="space-y-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-sm font-semibold text-gray-700">Email</Label>
                                                        <Input placeholder="Enter your email" className="h-11 rounded-xl bg-gray-50/80 border-gray-200 focus:bg-white focus:border-[#4C3B8A] focus:ring-2 focus:ring-[#4C3B8A]/15" {...otpForm.register('identifier')} />
                                                    </div>
                                                    <Button type="submit" className="w-full h-11 rounded-xl bg-[#4C3B8A] hover:bg-[#3d2f70] text-white font-bold shadow-lg shadow-[#4C3B8A]/20" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send OTP'}</Button>
                                                </form>
                                            ) : (
                                                <div className="space-y-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-sm font-semibold text-gray-700">Enter 6-digit OTP</Label>
                                                        <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" maxLength={6} className="text-center text-lg tracking-[0.5em] h-12 rounded-xl bg-gray-50/80 border-gray-200 focus:bg-white focus:border-[#4C3B8A]" />
                                                    </div>
                                                    <Button onClick={handleVerifyOtp} className="w-full h-11 rounded-xl bg-[#4C3B8A] hover:bg-[#3d2f70] text-white font-bold" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify OTP'}</Button>
                                                    <button onClick={() => setOtpSent(false)} className="text-sm text-[#4C3B8A] hover:underline w-full text-center font-medium">Resend OTP</button>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                )}

                                <div className="mt-6">
                                    <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span><div className="flex-1 h-px bg-gray-200" /></div>
                                    <GoogleSignInButton mode="signin" />
                                </div>
                                <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" /><span>Secure login for verified campus users</span>
                                </div>
                            </>
                        )}

                        {/* ═══ REGISTER ═══ */}
                        {authTab === 'register' && (
                            <>
                                <form onSubmit={regForm.handleSubmit(handleRegister)} autoComplete="off" noValidate>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                                            <input {...regForm.register('full_name')} placeholder="Enter your full name" autoComplete="off" className={regForm.formState.errors.full_name ? inputErrCls : inputCls} />
                                            {regForm.formState.errors.full_name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{regForm.formState.errors.full_name.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                                            <input {...regForm.register('email')} type="email" placeholder="Enter your email address" autoComplete="off" className={regForm.formState.errors.email ? inputErrCls : inputCls} />
                                            {regForm.formState.errors.email && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{regForm.formState.errors.email.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                                            <input {...regForm.register('phone')} type="tel" placeholder="+8801XXXXXXXXX" autoComplete="off" className={regForm.formState.errors.phone ? inputErrCls : inputCls} />
                                            {regForm.formState.errors.phone && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{regForm.formState.errors.phone.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                Password <span className="text-[11px] font-normal text-gray-400 ml-1">(Min. 8 chars, 1 uppercase, 1 special char)</span>
                                            </label>
                                            <div className="relative">
                                                <input {...regForm.register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password" className={`${regForm.formState.errors.password ? inputErrCls : inputCls} pr-10`} />
                                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                            </div>
                                            {regPw && regPw.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex gap-1">{[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-gray-100'}`} />)}</div>
                                                    <p className={`text-xs font-semibold ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-orange-500' : strength.score <= 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>{strength.label}</p>
                                                </div>
                                            )}
                                            {regForm.formState.errors.password && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{regForm.formState.errors.password.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                                            <div className="relative">
                                                <input {...regForm.register('confirm_password')} type={showConfirmPw ? 'text' : 'password'} placeholder="Re-enter password" autoComplete="new-password" className={`${regForm.formState.errors.confirm_password ? inputErrCls : inputCls} pr-10`} />
                                                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                            </div>
                                            {regForm.formState.errors.confirm_password && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{regForm.formState.errors.confirm_password.message}</p>}
                                        </div>

                                        <div className="flex items-start gap-3 pt-1">
                                            <input type="checkbox" id="terms" {...regForm.register('terms')} className="mt-0.5 w-4 h-4 rounded border-gray-200 accent-[#4C3B8A] cursor-pointer" />
                                            <label htmlFor="terms" className="text-sm text-gray-500 leading-snug cursor-pointer">I agree to the{' '}<Link href="/terms" className="text-[#4C3B8A] font-semibold hover:underline">Terms of Service</Link>{' '}and{' '}<Link href="/privacy" className="text-[#4C3B8A] font-semibold hover:underline">Privacy Policy</Link></label>
                                        </div>
                                        {regForm.formState.errors.terms && <p className="text-xs text-red-500 flex items-center gap-1 -mt-2"><AlertCircle className="w-3 h-3" />{regForm.formState.errors.terms.message}</p>}
                                        <button type="submit" disabled={isLoading} className="w-full h-12 bg-[#4C3B8A] hover:bg-[#3d2f70] disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4C3B8A]/20 mt-2">
                                            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
                                        </button>
                                    </div>
                                </form>
                                <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span><div className="flex-1 h-px bg-gray-200" /></div>
                                <GoogleSignInButton mode="signup" />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Right — Shared Hero Panel (fixed size) */}
            <AuthHeroPanel />
        </div>
    )
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AuthPageContent />
        </Suspense>
    )
}
