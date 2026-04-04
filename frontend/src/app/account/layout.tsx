'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User as UserIcon, ShoppingBag, Grid, LogOut, Upload } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, logout } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isAuthenticated, router])

    if (!user) return null

    const handleLogout = () => {
        logout()
        router.push('/')
    }

    const navigation = [
        { name: 'My Profile', href: '/account', icon: UserIcon },
        { name: 'My Orders', href: '/account/orders', icon: ShoppingBag },
        { name: 'My Listings', href: '/account/listings', icon: Grid },
    ]

    const renderStatusBadge = () => {
        switch (user.role) {
            case 'normal_user':
                return <Badge variant="destructive" className="mt-2 text-[10px] px-2 py-0">NOT VERIFIED</Badge>
            case 'student':
                return <Badge variant="default" className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-[10px] px-2 py-0">STUDENT</Badge>
            case 'faculty':
                return <Badge variant="default" className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-[10px] px-2 py-0">FACULTY</Badge>
            case 'seller':
                return <Badge variant="default" className="mt-2 bg-blue-500 hover:bg-blue-600 text-[10px] px-2 py-0">SELLER</Badge>
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-surface-base pb-12">
            <div className="bg-white border-b border-gray-100 py-3 mb-8">
                <div className="container mx-auto px-4">
                    <div className="text-sm text-gray-500">
                        <Link href="/" className="hover:text-brand-primary">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 font-medium">My Account</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* LEFT SIDEBAR */}
                    <aside className="w-full md:w-[260px] shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="relative group cursor-pointer">
                                    <Avatar className="h-[72px] w-[72px] border-2 border-white shadow-sm">
                                        {user.profile_picture ? (
                                            <AvatarImage src={user.profile_picture} alt={user.full_name} className="object-cover" />
                                        ) : (
                                            <AvatarFallback className="bg-brand-light text-brand-primary text-xl font-bold">
                                                {getInitials(user.full_name)}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Upload className="text-white h-5 w-5" />
                                    </div>
                                </div>
                                <h3 className="mt-3 font-bold text-gray-900 text-lg">{user.full_name}</h3>
                                {renderStatusBadge()}
                                {user?.role === 'normal_user' && (
                                    <div className='mx-4 mt-4 p-4 bg-yellow-50 border border-yellow-200
                                                    rounded-lg flex items-start gap-3 text-left'>
                                        <span className='text-yellow-500 text-xl mt-0.5'>⚠</span>
                                        <div>
                                            <p className='font-semibold text-yellow-800 text-sm'>
                                                Your account is not verified
                                            </p>
                                            <p className='text-yellow-700 text-sm mt-0.5'>
                                                Verify your student status to unlock Marketplace features
                                                — post ads, chat, and see contact info.
                                            </p>
                                            <a href='/account/verify'
                                               className='inline-block mt-2 text-sm font-semibold
                                                          text-brand-primary hover:underline'>
                                                Verify Now →
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile tab navigation — sm:hidden */}
                            <div className='sm:hidden flex border-b border-gray-100 overflow-x-auto no-scrollbar -mx-6 px-4 mb-4 pb-2'>
                                {[
                                    { label: 'Profile',  href: '/account' },
                                    { label: 'Orders',   href: '/account/orders' },
                                    { label: 'Listings', href: '/account/listings' },
                                ].map(tab => (
                                <Link key={tab.href} href={tab.href}
                                    className={`shrink-0 px-5 py-3 text-sm font-semibold border-b-2 transition
                                    ${pathname === tab.href
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-gray-500'}`}
                                >
                                    {tab.label}
                                </Link>
                                ))}
                            </div>

                            <nav className="hidden sm:flex flex-col gap-1">
                                {navigation.map((item) => {
                                    const isActive = pathname === item.href
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200',
                                                isActive
                                                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            )}
                                        >
                                            <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400")} />
                                            {item.name}
                                        </Link>
                                    )
                                })}

                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                                    >
                                        <LogOut className="h-5 w-5 text-red-500" />
                                        Logout
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* RIGHT CONTENT */}
                    <main className="flex-1">
                        {children}
                    </main>

                </div>
            </div>
        </div>
    )
}
