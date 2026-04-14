'use client'

import React from 'react'
import { Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { usePathname } from 'next/navigation'

export function SellerTopBar() {
    const { user } = useAuthStore()
    const pathname = usePathname()

    // Determine title from URL safely
    let title = 'Dashboard Overview'
    if (pathname.includes('/products')) title = 'Inventory Management'
    else if (pathname.includes('/orders')) title = 'Order Management'
    else if (pathname.includes('/wallet')) title = 'Wallet & Payouts'
    else if (pathname.includes('/settings')) title = 'Store Settings'
    else if (pathname.includes('/messages')) title = 'Customer Messages'

    return (
        <header className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
            <h1 className="font-semibold text-gray-900">{title}</h1>
            
            <div className="flex items-center gap-4">
                <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                
                <div className="w-[1px] h-6 bg-gray-200"></div>
                
                <div className="flex items-center gap-2">
                    {user?.profile_picture ? (
                        <img 
                            src={user.profile_picture} 
                            alt="Avatar" 
                            className="w-7 h-7 rounded-full object-cover border border-gray-200" 
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                        {user?.full_name?.split(' ')[0] || 'Seller'}
                    </span>
                </div>
            </div>
        </header>
    )
}
