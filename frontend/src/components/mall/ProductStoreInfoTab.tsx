'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, UserPlus, Building2 } from 'lucide-react'
import { getInitials } from '@/lib/initials'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export interface ProductStore {
    id: string
    slug: string
    name: string
    logo: string | null
    banner: string | null
    banner_color: string | null
    badge_label: string | null
    follower_count: number
    on_time_delivery_rate: number
    response_rate: number
    seller: {
        user: {
            full_name: string
            date_joined: string
        }
    }
}

export function ProductStoreInfoTab({ store }: { store: ProductStore }) {
    const { isAuthenticated } = useAuthStore()
    const [isFollowing, setIsFollowing] = useState(false)
    const [followerCount, setFollowerCount] = useState(store.follower_count)
    const [isUpdating, setIsUpdating] = useState(false)

    // Using year from the backend date_joined
    const joinDate = new Date(store.seller?.user?.date_joined || new Date())
    const joinYear = joinDate.getFullYear()

    const handleFollowToggle = async () => {
        if (!isAuthenticated) {
            toast.error("Please login to follow stores.")
            return
        }

        setIsUpdating(true)
        try {
            await api.post(`/stores/${store.slug}/follow/`)
            
            // Toggle local state
            setIsFollowing(prev => !prev)
            setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1)
            toast.success(isFollowing ? 'Unfollowed store' : 'Following store!')
        } catch {
            toast.error("An error occurred. Please try again.")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="max-w-4xl">
            {/* Banner */}
            <div 
                className="w-full h-32 rounded-2xl overflow-hidden relative"
                style={{ backgroundColor: store.banner_color || '#4C3B8A' }}
            >
                {store.banner && (
                    <Image 
                        src={store.banner} 
                        alt={`${store.name} banner`} 
                        fill 
                        className="object-cover opacity-90"
                        sizes="(max-width: 1024px) 100vw, 800px"
                    />
                )}
            </div>

            {/* Profile Row */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 px-4 sm:px-6 -mt-8 relative z-10 mb-6">
                
                {/* Logo */}
                <div 
                    className="w-[84px] h-[84px] rounded-full border-4 border-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm bg-white"
                >
                    {store.logo ? (
                        <Image 
                            src={store.logo} 
                            alt={store.name} 
                            fill 
                            className="object-cover"
                            sizes="84px"
                        />
                    ) : (
                        <div 
                            className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                            style={{ backgroundColor: store.banner_color || '#4C3B8A' }}
                        >
                            {getInitials(store.name || 'S')}
                        </div>
                    )}
                </div>

                {/* Name / Info */}
                <div className="flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-gray-900">{store.name}</h2>
                        {store.badge_label && (
                            <span className="flex items-center gap-1 bg-[#4C3B8A]/10 text-[#4C3B8A] px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {store.badge_label}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        Member since {joinYear} • Owned by {store.seller?.user?.full_name || 'Seller'}
                    </p>
                </div>

                {/* Desktop Buttons */}
                <div className="hidden sm:flex items-center gap-3 pb-1">
                    <Link 
                        href={`/sellers/${store.slug}`}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#4C3B8A] text-[#4C3B8A] font-semibold text-sm hover:bg-[#4C3B8A] hover:text-white transition-colors"
                    >
                        <Building2 className="w-4 h-4" />
                        Visit Store
                    </Link>
                    <button 
                        onClick={handleFollowToggle}
                        disabled={isUpdating}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border-2",
                            isFollowing 
                                ? "bg-gray-100 border-gray-100 text-gray-700 hover:bg-gray-200 hover:border-gray-200" 
                                : "bg-[#4C3B8A] border-[#4C3B8A] text-white hover:bg-[#34285e] hover:border-[#34285e]",
                            isUpdating && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <UserPlus className="w-4 h-4" />
                        {isFollowing ? 'Following' : 'Follow Store'}
                    </button>
                </div>
            </div>

            {/* Mobile Buttons */}
            <div className="flex sm:hidden items-center gap-3 px-4 mb-6">
                <Link 
                    href={`/sellers/${store.slug}`}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#4C3B8A] text-[#4C3B8A] font-semibold text-sm"
                >
                    Visit Store
                </Link>
                <button 
                    onClick={handleFollowToggle}
                    disabled={isUpdating}
                    className={cn(
                        "flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2",
                        isFollowing 
                            ? "bg-gray-100 border-gray-100 text-gray-700" 
                            : "bg-[#4C3B8A] border-[#4C3B8A] text-white"
                    )}
                >
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 sm:px-6">
                <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{followerCount.toLocaleString()}</p>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Followers</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{store.on_time_delivery_rate}%</p>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">On-Time Delivery</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{store.response_rate}%</p>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Response Rate</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-green-600">Active</p>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Store Status</p>
                </div>
            </div>
        </div>
    )
}
