'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Store } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { api, extractArray } from '@/lib/api'

// Customer Schema
const customerSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(10, 'Valid phone required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Student Schema (Customer + university_id)
const studentSchema = customerSchema.extend({
    university_id: z.string().min(1, 'Please select a university'),
})

type CustomerForm = z.infer<typeof customerSchema>
type StudentForm = z.infer<typeof studentSchema>

interface University {
    id: string
    name: string
    short_code?: string
}

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Check if redirecting to seller
    useEffect(() => {
        if (searchParams.get('type') === 'seller') {
            router.replace('/seller/register')
        }
    }, [searchParams, router])

    const initialTab = searchParams.get('type') === 'student' ? 'student' : 'customer'
    const [regTab, setRegTab] = useState<'customer' | 'student'>(initialTab)
    const [showPassword, setShowPassword] = useState(false)
    const [universities, setUniversities] = useState<University[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Customer Form
    const customerForm = useForm<CustomerForm>({
        resolver: zodResolver(customerSchema),
        defaultValues: { full_name: '', email: '', phone: '', password: '' },
    })

    // Student Form
    const studentForm = useForm<StudentForm>({
        resolver: zodResolver(studentSchema),
        defaultValues: { full_name: '', email: '', phone: '', password: '', university_id: '' },
    })

    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const { data } = await api.get('/universities/')
                setUniversities(extractArray<University>(data))
            } catch {
                setUniversities([
                    { id: '1', name: 'American International University-Bangladesh', short_code: 'AIUB' },
                    { id: '2', name: 'University of Dhaka', short_code: 'DU' },
                    { id: '3', name: 'North South University', short_code: 'NSU' },
                    { id: '4', name: 'BRAC University', short_code: 'BRACU' },
                ])
            }
        }
        fetchUniversities()
    }, [])

    const onSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            const payload = {
                ...data,
                is_seller: false,
            }
            await api.post('/auth/register/', payload)
            toast.success('Registration successful! Please verify your email.')
            router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
        } catch (error: any) {
            const message = error.response?.data?.message || error.response?.data?.email?.[0] || 'Registration failed'
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    // Shared Form Fields component for DRYness
    const SharedFields = ({ form }: { form: any }) => (
        <>
            <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" placeholder="John Doe" {...form.register('full_name')} />
                {form.formState.errors.full_name && <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" {...form.register('email')} />
                    {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" placeholder="+8801..." {...form.register('phone')} />
                    {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...form.register('password')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>
        </>
    )

    return (
        <div className="min-h-screen flex bg-surface-base">
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start mb-4">
                            <span className="text-3xl font-bold text-gray-800">Campus</span>
                            <span className="text-3xl font-bold text-brand-primary">Hat</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Create your account</h2>
                        <p className="text-sm text-gray-500 mt-2">
                            Unified access for students and faculty
                        </p>
                    </div>

                    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 animate-fade-in">
                        {/* Top-level Auth Switch */}
                        <Tabs value="register" className="mb-6">
                            <TabsList className="w-full">
                                <TabsTrigger value="login" className="flex-1" asChild>
                                    <Link href="/auth/login">Login</Link>
                                </TabsTrigger>
                                <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Customer | Student Sub-tabs */}
                        <Tabs value={regTab} onValueChange={(v) => setRegTab(v as 'customer' | 'student')}>
                            <TabsList className="w-full mb-6 relative">
                                <TabsTrigger value="customer" className="flex-1 z-10">Customer</TabsTrigger>
                                <TabsTrigger value="student" className="flex-1 z-10">Student</TabsTrigger>
                            </TabsList>

                            {/* Customer Form */}
                            <TabsContent value="customer">
                                <form onSubmit={customerForm.handleSubmit((d) => onSubmit(d))} className="space-y-4">
                                    <SharedFields form={customerForm} />
                                    <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                                        {isLoading ? 'Creating account...' : 'Create Account'}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* Student Form */}
                            <TabsContent value="student">
                                <form onSubmit={studentForm.handleSubmit((d) => onSubmit(d))} className="space-y-4">
                                    <SharedFields form={studentForm} />

                                    <div className="space-y-2">
                                        <Label htmlFor="university">Your Campus</Label>
                                        <Select onValueChange={(val) => studentForm.setValue('university_id', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="American International University-Bangladesh (AIUB)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {universities.map((uni) => (
                                                    <SelectItem key={uni.id} value={uni.id}>
                                                        {uni.name} {uni.short_code ? `(${uni.short_code})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {studentForm.formState.errors.university_id && (
                                            <p className="text-xs text-destructive">{studentForm.formState.errors.university_id.message}</p>
                                        )}
                                    </div>

                                    <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                                        {isLoading ? 'Creating account...' : 'Create Student Account'}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>

                        {/* Become a Seller Link */}
                        <div className="mt-6 border border-gray-100 rounded-xl p-4 bg-gray-50 flex flex-col items-center justify-center text-center">
                            <Store className="h-6 w-6 text-brand-primary mb-2" />
                            <p className="text-sm text-gray-700 font-medium mb-3">Want to sell on CampusHat?</p>
                            <Button variant="outline" className="w-full bg-white font-bold text-brand-primary hover:bg-brand-light transition-colors" asChild>
                                <Link href="/seller/register">Join as Seller</Link>
                            </Button>
                        </div>

                        {/* Social Login */}
                        <div className="mt-6">
                            <div className="relative">
                                <Separator />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                                    or continue with
                                </span>
                            </div>
                            <div className="flex justify-center gap-4 mt-4">
                                {['Google', 'Apple', 'Facebook'].map((provider) => (
                                    <Button key={provider} variant="outline" size="icon" className="rounded-full shadow-sm hover:bg-gray-50">
                                        <span className="text-xs font-semibold">{provider[0]}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#634C9F] to-[#45357A] items-center justify-center p-12 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-white/5 blur-[120px]"></div>
                    <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#8b76c4]/20 blur-[100px]"></div>
                </div>

                <div className="relative z-10 max-w-lg text-white">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                            <span className="text-2xl font-bold">🎓</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-4">Empowering campus commerce</h3>
                        <p className="text-white/80 text-lg leading-relaxed mb-8">
                            A secure, verifiable marketplace specifically designed for students and faculty. Connect, trade, and discover services from your peers.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                                <p className="text-2xl font-bold mb-1">10k+</p>
                                <p className="text-white/60 text-sm">Active Students</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                                <p className="text-2xl font-bold mb-1">5k+</p>
                                <p className="text-white/60 text-sm">Daily Listings</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface-base"><p className="text-muted-foreground">Loading...</p></div>}>
            <RegisterContent />
        </Suspense>
    )
}
