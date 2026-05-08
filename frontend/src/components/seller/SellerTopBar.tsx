'use client'

import React from 'react'
import { Bell, ChevronDown, UserCircle, Home, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { absoluteMediaUrl } from '@/services/upload.service'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function SellerTopBar() {
    const { user, logout } = useAuthStore()
    const pathname = usePathname()
    const router = useRouter()

    // Determine title from URL safely
    let title = 'Dashboard Overview'
    if (pathname.includes('/products/bulk-upload')) title = 'Bulk Product Upload'
    else if (pathname.includes('/products/top')) title = 'Top Products'
    else if (pathname.includes('/products')) title = 'Product Management'
    else if (pathname.includes('/inventory')) title = 'Inventory Management'
    else if (pathname.includes('/orders')) title = 'Order Management'
    else if (pathname.includes('/returns')) title = 'Returns & Refunds'
    else if (pathname.includes('/reviews')) title = 'Customer Reviews'
    else if (pathname.includes('/customers')) title = 'Customer Insights'
    else if (pathname.includes('/performance')) title = 'Performance Scorecard'
    else if (pathname.includes('/promotions')) title = 'Promotions'
    else if (pathname.includes('/wallet')) title = 'Wallet & Payouts'
    else if (pathname.includes('/messages')) title = 'Customer Messages'
    else if (pathname.includes('/settings')) title = 'Store Settings'

    return (
        <header className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
            <h1 className="font-semibold text-gray-900">{title}</h1>
            
            <div className="flex items-center gap-4">
                <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                
                <div className="w-[1px] h-6 bg-gray-200"></div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors outline-none">
                            {user?.profile_picture ? (
                                <img 
                                    src={absoluteMediaUrl(user.profile_picture)} 
                                    alt="Avatar" 
                                    className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#4C3B8A] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div className="hidden sm:flex flex-col items-start leading-tight">
                                <span className="text-sm font-semibold text-gray-900">
                                    {user?.full_name?.split(' ')[0] || 'Seller'}
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium capitalize">
                                    {user?.role || 'Seller'}
                                </span>
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-1 shadow-lg border-gray-100">
                        <DropdownMenuLabel className="font-normal p-3">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none text-gray-900">{user?.full_name}</p>
                                <p className="text-xs leading-none text-gray-400 truncate mt-1">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-50" />
                        
                        <DropdownMenuItem asChild className="p-2.5 cursor-pointer focus:bg-gray-50">
                            <Link href="/account" className="flex items-center gap-2.5 text-gray-600">
                                <UserCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Profile Settings</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild className="p-2.5 cursor-pointer focus:bg-gray-50">
                            <Link href="/" className="flex items-center gap-2.5 text-gray-600">
                                <Home className="w-4 h-4" />
                                <span className="text-sm font-medium">Back to Store</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-gray-50" />
                        
                        <DropdownMenuItem 
                            onClick={() => { logout(); router.push('/auth/login') }}
                            className="p-2.5 text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer flex items-center gap-2.5"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-semibold">Log Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
