'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'

const registerSchema = z
    .object({
        full_name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Please enter a valid email'),
        university_id: z.string().min(1, 'Please select a university'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirm_password: z.string(),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: 'Passwords do not match',
        path: ['confirm_password'],
    })

type RegisterForm = z.infer<typeof registerSchema>

interface University {
    id: string
    name: string
}

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isSeller = searchParams.get('seller') === 'true'
    const [showPassword, setShowPassword] = useState(false)
    const [universities, setUniversities] = useState<University[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            full_name: '',
            email: '',
            university_id: '',
            password: '',
            confirm_password: '',
        },
    })

    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const { data } = await api.get('/universities/')
                setUniversities(data.data || data.results || data || [])
            } catch {
                // Fallback mock data
                setUniversities([
                    { id: '1', name: 'University of Dhaka' },
                    { id: '2', name: 'BUET' },
                    { id: '3', name: 'North South University' },
                    { id: '4', name: 'BRAC University' },
                ])
            }
        }
        fetchUniversities()
    }, [])

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true)
        try {
            await api.post('/auth/register/', {
                full_name: data.full_name,
                email: data.email,
                university_id: data.university_id,
                password: data.password,
                is_seller: isSeller,
            })
            toast.success('Registration successful! Please verify your email.')
            router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
        } catch (error: any) {
            const message = error.response?.data?.message || error.response?.data?.email?.[0] || 'Registration failed'
            toast.error(message)
        } finally {
            setIsLoading(false)
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
                        {isSeller ? 'Register as a Seller' : 'Create your account'}
                    </p>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="register">
                        <TabsList className="w-full mb-6">
                            <TabsTrigger value="login" className="flex-1" asChild>
                                <Link href="/auth/login">Login</Link>
                            </TabsTrigger>
                            <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                placeholder="John Doe"
                                {...form.register('full_name')}
                            />
                            {form.formState.errors.full_name && (
                                <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="university">University</Label>
                            <Select onValueChange={(val) => form.setValue('university_id', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your university" />
                                </SelectTrigger>
                                <SelectContent>
                                    {universities.map((uni) => (
                                        <SelectItem key={uni.id} value={uni.id}>
                                            {uni.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.university_id && (
                                <p className="text-xs text-destructive">{form.formState.errors.university_id.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@university.edu"
                                {...form.register('email')}
                            />
                            {form.formState.errors.email && (
                                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                            )}
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
                            {form.formState.errors.password && (
                                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirm Password</Label>
                            <Input
                                id="confirm_password"
                                type="password"
                                placeholder="••••••••"
                                {...form.register('confirm_password')}
                            />
                            {form.formState.errors.confirm_password && (
                                <p className="text-xs text-destructive">{form.formState.errors.confirm_password.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Creating account...' : isSeller ? 'Register as Seller' : 'Create Account'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-surface-base">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        }>
            <RegisterContent />
        </Suspense>
    )
}
