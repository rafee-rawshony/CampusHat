'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Eye, EyeOff, GraduationCap, ShoppingBag, User,
    Check, AlertCircle, Loader2, ChevronDown, Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const baseSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Enter a valid phone number').max(15),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine(d => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
})

const studentSchema = baseSchema.extend({
    university_id: z.string().min(1, 'Please select your university'),
})

type BaseForm = z.infer<typeof baseSchema>
type StudentForm = z.infer<typeof studentSchema>
type RegType = 'customer' | 'student'

// ─── Password Strength ────────────────────────────────────────────────────────

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    if (!pw) return { score: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
    if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-400' }
    if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-400' }
    if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-400' }
    return { score, label: 'Very Strong', color: 'bg-emerald-500' }
}

// ─── University Dropdown ──────────────────────────────────────────────────────

function UniversitySelect({
    value, onChange, error
}: { value: string; onChange: (v: string) => void; error?: string }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [universities, setUniversities] = useState<any[]>([])

    useEffect(() => {
        api.get('/universities/?page_size=1000').then(res => {
            const raw = res.data?.data || res.data
            const results = raw?.results || (Array.isArray(raw) ? raw : [])
            if (Array.isArray(results)) setUniversities(results)
        }).catch(() => {})
    }, [])

    const filtered = universities.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.short_name?.toLowerCase().includes(search.toLowerCase())
    )

    const selected = universities.find(u => String(u.id) === value)

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between h-11 px-3 rounded-xl border text-sm font-medium transition-all
                    ${error ? 'border-red-300 bg-red-50' : open ? 'border-[#634C9F] ring-2 ring-[#634C9F]/20 bg-white' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}
                `}
            >
                <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
                    {selected ? `${selected.name} (${selected.short_name})` : 'Select your university'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search university..."
                                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg outline-none focus:border-[#634C9F] focus:bg-white"
                            />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto custom-scrollbar">
                        {filtered.length === 0 ? (
                            <p className="text-center py-4 text-sm text-gray-400">No universities found</p>
                        ) : filtered.map(u => (
                            <button
                                type="button"
                                key={u.id}
                                onClick={() => { onChange(String(u.id)); setOpen(false); setSearch('') }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors flex items-center justify-between
                                    ${String(u.id) === value ? 'bg-purple-50 text-[#634C9F] font-semibold' : 'text-gray-700'}
                                `}
                            >
                                <div>
                                    <span className="font-medium">{u.name}</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{u.short_name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
        </div>
    )
}

// ─── Main Register Content ─────────────────────────────────────────────────────

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [regType, setRegType] = useState<RegType>(
        searchParams.get('type') === 'student' ? 'student' : 'customer'
    )
    const [showPw, setShowPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [successEmail, setSuccessEmail] = useState('')

    // Customer form
    const customerForm = useForm<BaseForm>({
        resolver: zodResolver(baseSchema),
        defaultValues: { full_name: '', email: '', phone: '', password: '', confirm_password: '', terms: undefined as any },
    })

    // Student form
    const studentForm = useForm<StudentForm>({
        resolver: zodResolver(studentSchema),
        defaultValues: { full_name: '', email: '', phone: '', password: '', confirm_password: '', terms: undefined as any, university_id: '' },
    })

    const activeForm = regType === 'student' ? studentForm : customerForm
    const pw = activeForm.watch('password')
    const strength = getPasswordStrength(pw || '')

    const onSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            const payload: Record<string, any> = {
                full_name: data.full_name,
                email: data.email,
                phone: data.phone,
                password: data.password,
            }
            if (regType === 'student' && data.university_id) {
                payload.university_id = data.university_id
            }
            await api.post('/auth/register/', payload)
            setSuccessEmail(data.email)
        } catch (error: any) {
            const msg = error.response?.data?.message
                || error.response?.data?.errors?.email?.[0]
                || error.response?.data?.email?.[0]
                || 'Registration failed. Please try again.'
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    // ─── Success State ─────────────────────────────────────────────────────
    if (successEmail) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100">
                        <Check className="w-10 h-10 text-emerald-500 stroke-[2.5]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email!</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-2">
                        We sent a verification link to
                    </p>
                    <p className="font-bold text-[#634C9F] text-base mb-6 break-all bg-purple-50 rounded-xl px-4 py-2 inline-block">
                        {successEmail}
                    </p>
                    <p className="text-gray-400 text-xs mb-8">
                        Click the link in your email to verify your account. Check your spam folder if you don&apos;t see it.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push(`/auth/login`)}
                            className="w-full bg-[#634C9F] hover:bg-[#45357A] text-white font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            Continue to Login
                        </button>
                        <button
                            onClick={() => { setSuccessEmail(''); customerForm.reset(); studentForm.reset() }}
                            className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
                        >
                            Use a different email
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Shared Form Fields ────────────────────────────────────────────────
    const renderFields = (form: any) => (
        <div className="space-y-4">
            {/* Full Name */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                    {...form.register('full_name')}
                    placeholder="e.g. Rafee Rawshony"
                    className={`w-full h-11 px-3 rounded-xl border text-sm font-medium outline-none transition-all
                        ${form.formState.errors.full_name ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 bg-gray-50 focus:border-[#634C9F] focus:ring-2 focus:ring-[#634C9F]/20 focus:bg-white'}
                    `}
                />
                {form.formState.errors.full_name && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.full_name.message}
                    </p>
                )}
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                    {...form.register('email')}
                    type="email"
                    placeholder="you@university.edu.bd"
                    className={`w-full h-11 px-3 rounded-xl border text-sm font-medium outline-none transition-all
                        ${form.formState.errors.email ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 bg-gray-50 focus:border-[#634C9F] focus:ring-2 focus:ring-[#634C9F]/20 focus:bg-white'}
                    `}
                />
                {form.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.email.message}
                    </p>
                )}
            </div>

            {/* Phone */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input
                    {...form.register('phone')}
                    type="tel"
                    placeholder="+8801XXXXXXXXX"
                    className={`w-full h-11 px-3 rounded-xl border text-sm font-medium outline-none transition-all
                        ${form.formState.errors.phone ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 bg-gray-50 focus:border-[#634C9F] focus:ring-2 focus:ring-[#634C9F]/20 focus:bg-white'}
                    `}
                />
                {form.formState.errors.phone && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.phone.message}
                    </p>
                )}
            </div>

            {/* University (students only) */}
            {regType === 'student' && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your University</label>
                    <UniversitySelect
                        value={form.watch('university_id') || ''}
                        onChange={(v) => form.setValue('university_id', v, { shouldValidate: true })}
                        error={form.formState.errors.university_id?.message}
                    />
                </div>
            )}

            {/* Password */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                    <input
                        {...form.register('password')}
                        type={showPw ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        className={`w-full h-11 px-3 pr-10 rounded-xl border text-sm font-medium outline-none transition-all
                            ${form.formState.errors.password ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 bg-gray-50 focus:border-[#634C9F] focus:ring-2 focus:ring-[#634C9F]/20 focus:bg-white'}
                        `}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {/* Strength Indicator */}
                {pw && pw.length > 0 && (
                    <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-all duration-300
                                        ${i <= strength.score ? strength.color : 'bg-gray-100'}
                                    `}
                                />
                            ))}
                        </div>
                        <p className={`text-xs font-semibold ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-orange-500' : strength.score <= 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                            {strength.label}
                        </p>
                    </div>
                )}
                {form.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.password.message}
                    </p>
                )}
            </div>

            {/* Confirm Password */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                    <input
                        {...form.register('confirm_password')}
                        type={showConfirmPw ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        className={`w-full h-11 px-3 pr-10 rounded-xl border text-sm font-medium outline-none transition-all
                            ${form.formState.errors.confirm_password ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-200 bg-gray-50 focus:border-[#634C9F] focus:ring-2 focus:ring-[#634C9F]/20 focus:bg-white'}
                        `}
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {form.formState.errors.confirm_password && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.confirm_password.message}
                    </p>
                )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-1">
                <input
                    type="checkbox"
                    id="terms"
                    {...form.register('terms')}
                    className="mt-0.5 w-4 h-4 rounded border-gray-200 accent-[#634C9F] cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-500 leading-snug cursor-pointer">
                    I agree to the{' '}
                    <Link href="/terms" className="text-[#634C9F] font-semibold hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-[#634C9F] font-semibold hover:underline">Privacy Policy</Link>
                </label>
            </div>
            {form.formState.errors.terms && (
                <p className="text-xs text-red-500 flex items-center gap-1 -mt-2">
                    <AlertCircle className="w-3 h-3" />
                    {form.formState.errors.terms.message}
                </p>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#634C9F] hover:bg-[#45357A] disabled:opacity-60 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#634C9F]/25 hover:shadow-[#634C9F]/40 mt-2"
            >
                {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                ) : (
                    regType === 'student' ? 'Create Student Account' : 'Create Account'
                )}
            </button>
        </div>
    )

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-purple-50">
            {/* Left — Form */}
            <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-8 lg:px-16 xl:px-24 overflow-y-auto">
                <div className="mx-auto w-full max-w-md">
                    {/* Brand */}
                    <div className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-1 mb-6">
                            <span className="text-2xl font-black text-gray-800">Campus</span>
                            <span className="text-2xl font-black text-[#634C9F]">Hat</span>
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900 leading-tight">Create your account</h1>
                        <p className="text-gray-500 mt-2 text-sm">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-[#634C9F] font-bold hover:underline">Sign in</Link>
                        </p>
                    </div>

                    {/* Login / Register tab bar */}
                    <div className="bg-gray-100 rounded-xl p-1 flex mb-6">
                        <button
                            type="button"
                            onClick={() => router.push('/auth/login')}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Login
                        </button>
                        <div className="flex-1 py-2 rounded-lg bg-white shadow-sm text-sm font-bold text-gray-900 text-center">
                            Register
                        </div>
                    </div>

                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {[
                            { type: 'customer' as RegType, icon: User, label: 'General User', sub: 'Shop & browse' },
                            { type: 'student' as RegType, icon: GraduationCap, label: 'Student / Faculty', sub: 'Campus marketplace' },
                        ].map(({ type, icon: Icon, label, sub }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setRegType(type)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-center
                                    ${regType === type
                                        ? 'border-[#634C9F] bg-[#634C9F]/5 shadow-md'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                                    ${regType === type ? 'bg-[#634C9F] text-white' : 'bg-gray-100 text-gray-500'}
                                `}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold leading-tight ${regType === type ? 'text-[#634C9F]' : 'text-gray-700'}`}>{label}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                                </div>
                                {regType === type && (
                                    <div className="w-5 h-5 rounded-full bg-[#634C9F] flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white stroke-[3]" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
                        {regType === 'customer' ? (
                            <form onSubmit={customerForm.handleSubmit(onSubmit)} noValidate>
                                {renderFields(customerForm)}
                            </form>
                        ) : (
                            <form onSubmit={studentForm.handleSubmit(onSubmit)} noValidate>
                                {renderFields(studentForm)}
                            </form>
                        )}
                    </div>

                    {/* Seller CTA */}
                    <div className="mt-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800">Want to sell on CampusHat?</p>
                            <p className="text-xs text-gray-500 mt-0.5">Apply separately after registration</p>
                        </div>
                        <Link
                            href="/seller/apply"
                            className="text-xs font-bold text-orange-600 hover:text-orange-700 border border-orange-200 bg-white rounded-lg px-3 py-1.5 transition-colors shrink-0"
                        >
                            Apply →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right — Hero Panel (desktop only) */}
            <div className="hidden lg:flex w-[45%] xl:w-[42%] relative bg-gradient-to-br from-[#45357A] via-[#634C9F] to-[#7B5EA7] items-center justify-center p-12 overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-20 w-[500px] h-[500px] rounded-full bg-white/5 blur-[80px]" />
                    <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full bg-purple-900/30 blur-[80px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-white/3 blur-[60px]" />
                </div>

                <div className="relative z-10 max-w-sm text-white text-center">
                    {/* Floating cards */}
                    <div className="mb-8 relative">
                        <div className="w-24 h-24 bg-white/15 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto border border-white/20 shadow-2xl">
                            <span className="text-5xl">🎓</span>
                        </div>
                        {/* Small floating badges */}
                        <div className="absolute -top-3 -right-6 bg-emerald-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg animate-bounce">
                            VERIFIED
                        </div>
                        <div className="absolute -bottom-2 -left-4 bg-yellow-400 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                            17 UNIS
                        </div>
                    </div>

                    <h2 className="text-3xl font-black mb-4 leading-tight">
                        Campus commerce,<br />made simple
                    </h2>
                    <p className="text-white/70 text-sm leading-relaxed mb-10">
                        Join thousands of students buying, selling, and connecting on Bangladesh&apos;s only verified campus marketplace.
                    </p>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        {[
                            { value: '17+', label: 'Universities' },
                            { value: '10k+', label: 'Students' },
                            { value: '5k+', label: 'Listings' },
                        ].map(s => (
                            <div key={s.value} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                                <p className="text-xl font-black">{s.value}</p>
                                <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5 font-bold">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Feature bullets */}
                    {[
                        '✓ Student-verified listings',
                        '✓ Campus-specific marketplace',
                        '✓ Secure peer-to-peer trading',
                        '✓ Faculty & student discounts',
                    ].map(item => (
                        <div key={item} className="text-left text-sm text-white/80 font-medium py-1.5 flex items-center gap-2">
                            <span className="text-emerald-400 font-black">{item.substring(0, 1)}</span>
                            <span>{item.substring(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#634C9F] animate-spin" />
                    <p className="text-gray-400 text-sm font-medium">Loading...</p>
                </div>
            </div>
        }>
            <RegisterContent />
        </Suspense>
    )
}
