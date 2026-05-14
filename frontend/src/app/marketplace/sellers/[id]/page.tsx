'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
    ArrowLeft, MessageCircle,
    ShieldCheck, Zap, Star, Award, TrendingUp,
    Clock, Calendar, Package, CheckCircle2, MapPin,
    BadgeCheck, Users
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { absoluteMediaUrl } from '@/services/upload.service'
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard'
import type { MarketplaceListing } from '@/components/marketplace/MarketplaceListingCard'
import toast from 'react-hot-toast'

interface Badge {
    type: string
    label: string
}

interface SellerProfile {
    id: string
    full_name: string
    profile_picture: string | null
    university_name: string | null
    department: string | null
    is_verified_student: boolean
    member_since: string
    last_active: string | null

    reputation_score: number
    trust_level: string
    response_rate: number
    avg_response_minutes: number | null

    active_listings: number
    completed_sales: number
    total_listings: number

    badges: Badge[]
    same_university: boolean

    listings: MarketplaceListing[]
}

const TRUST_LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    new: { label: 'New Seller', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
    trusted: { label: 'Trusted Seller', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    highly_trusted: { label: 'Highly Trusted', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
    campus_verified: { label: 'Campus Verified', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    elite: { label: 'Elite Seller', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
    verified_student: <ShieldCheck className="w-3.5 h-3.5" />,
    campus_trusted: <BadgeCheck className="w-3.5 h-3.5" />,
    fast_responder: <Zap className="w-3.5 h-3.5" />,
    active_seller: <TrendingUp className="w-3.5 h-3.5" />,
    top_seller: <Award className="w-3.5 h-3.5" />,
    student_seller: <ShieldCheck className="w-3.5 h-3.5" />,
    verified_seller: <CheckCircle2 className="w-3.5 h-3.5" />,
    best_seller: <Star className="w-3.5 h-3.5" />,
    fast_dispatch: <Zap className="w-3.5 h-3.5" />,
}

const BADGE_COLORS: Record<string, string> = {
    verified_student: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    campus_trusted: 'bg-blue-50 text-blue-700 border-blue-200',
    fast_responder: 'bg-amber-50 text-amber-700 border-amber-200',
    active_seller: 'bg-violet-50 text-violet-700 border-violet-200',
    top_seller: 'bg-rose-50 text-rose-700 border-rose-200',
    student_seller: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    verified_seller: 'bg-blue-50 text-blue-700 border-blue-200',
    best_seller: 'bg-amber-50 text-amber-700 border-amber-200',
    fast_dispatch: 'bg-orange-50 text-orange-700 border-orange-200',
}

const POST_TYPE_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'sell', label: 'Buy' },
    { value: 'rent', label: 'Rental' },
    { value: 'service', label: 'Services' },
    { value: 'food', label: 'Food' },
]

function getResponseLabel(minutes: number | null): string {
    if (minutes === null) return 'No data'
    if (minutes <= 10) return 'Within 10 mins'
    if (minutes <= 30) return 'Within 30 mins'
    if (minutes <= 60) return 'Within 1 hour'
    if (minutes <= 180) return 'Within a few hours'
    return 'Within a day'
}

function getLastActiveLabel(dateStr: string | null): string {
    if (!dateStr) return 'Unknown'
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
        return 'Unknown'
    }
}

export default function MarketplaceSellerProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { user, isAuthenticated } = useAuthStore()
    const sellerId = params?.id as string

    const [profile, setProfile] = useState<SellerProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [startingChat, setStartingChat] = useState(false)
    const [typeFilter, setTypeFilter] = useState('all')

    const isOwnProfile = isAuthenticated && String(user?.id) === String(sellerId)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/marketplace/sellers/${sellerId}/profile/`)
                setProfile(res.data?.data || res.data)
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    setError('Seller not found.')
                } else {
                    setError('Failed to load profile.')
                }
            } finally {
                setLoading(false)
            }
        }
        if (sellerId) fetchProfile()
    }, [sellerId])

    const handleMessage = async () => {
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/marketplace/sellers/${sellerId}`)
            return
        }
        if (isOwnProfile) return

        const firstListing = profile?.listings?.[0]
        if (!firstListing) {
            toast.error('This seller has no active listings to message about')
            return
        }

        setStartingChat(true)
        try {
            const res = await api.post('/marketplace/chats/start/', {
                product_id: firstListing.id,
            })
            const chatId = res.data?.data?.id || res.data?.id
            if (chatId) {
                router.push(`/marketplace/chat/${chatId}`)
            }
        } catch {
            toast.error('Could not start chat')
        } finally {
            setStartingChat(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="container mx-auto px-4 max-w-4xl py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
                        <div className="bg-white rounded-2xl p-8 border border-gray-100">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-gray-200 rounded-full" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-6 w-48 bg-gray-200 rounded" />
                                    <div className="h-4 w-32 bg-gray-200 rounded" />
                                    <div className="h-4 w-24 bg-gray-200 rounded" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl" />)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center px-8">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{error || 'Profile not found'}</h2>
                    <p className="text-sm text-gray-500 mb-6">This seller profile may have been removed or is no longer available.</p>
                    <Link href="/marketplace" className="text-[#4C3B8A] font-bold hover:underline">
                        Back to Marketplace
                    </Link>
                </div>
            </div>
        )
    }

    const trustConfig = TRUST_LEVEL_CONFIG[profile.trust_level] || TRUST_LEVEL_CONFIG.new
    const initials = profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'

    const filteredListings = typeFilter === 'all'
        ? profile.listings
        : profile.listings.filter(l => l.post_type === typeFilter)

    return (
        <div className="bg-gray-50 min-h-screen pb-24 sm:pb-12">
            {/* Top nav */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="container mx-auto max-w-4xl px-4">
                    <div className="flex items-center h-14 gap-3">
                        <button
                            onClick={() => router.back()}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors -ml-1"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <nav className="flex items-center text-sm text-gray-500 font-medium">
                            <Link href="/marketplace" className="hover:text-[#4C3B8A] transition-colors">Marketplace</Link>
                            <span className="mx-2 text-gray-300">/</span>
                            <span className="text-gray-900 font-semibold truncate max-w-[200px]">{profile.full_name}</span>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-4xl px-4 pt-6 space-y-5">

                {/* ── PROFILE HEADER ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Gradient banner */}
                    <div className="h-20 sm:h-28 bg-gradient-to-r from-[#4C3B8A] via-[#6B5AAE] to-[#8B6FD4]" />

                    <div className="px-5 sm:px-8 pb-6 -mt-10 sm:-mt-12">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                            {/* Avatar */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg shrink-0 bg-white">
                                {profile.profile_picture ? (
                                    <Image
                                        src={absoluteMediaUrl(profile.profile_picture)}
                                        alt={profile.full_name}
                                        width={96}
                                        height={96}
                                        unoptimized
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#4C3B8A] to-[#6B5AAE] text-white flex items-center justify-center font-bold text-2xl">
                                        {initials}
                                    </div>
                                )}
                            </div>

                            {/* Name & info */}
                            <div className="flex-1 min-w-0 sm:pb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 truncate">
                                        {profile.full_name}
                                    </h1>
                                    {profile.is_verified_student && (
                                        <ShieldCheck className="w-5 h-5 text-[#4C3B8A] shrink-0" />
                                    )}
                                </div>

                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${trustConfig.bg} ${trustConfig.color} ${trustConfig.border}`}>
                                        <Award className="w-3 h-3" />
                                        {trustConfig.label}
                                    </span>

                                    {profile.university_name && (
                                        <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                            <MapPin className="w-3 h-3" />
                                            {profile.university_name}
                                        </span>
                                    )}
                                </div>

                                {profile.department && (
                                    <p className="text-xs text-gray-400 mt-1 font-medium">{profile.department}</p>
                                )}
                            </div>

                            {/* Action button — desktop */}
                            {!isOwnProfile && (
                                <div className="hidden sm:flex items-center shrink-0 sm:pb-1">
                                    <button
                                        onClick={handleMessage}
                                        disabled={startingChat}
                                        className="flex items-center gap-2 bg-[#4C3B8A] hover:bg-[#3D2F6E] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#4C3B8A]/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        {startingChat ? 'Starting...' : 'Message'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 mt-4 flex-wrap text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Member since {format(new Date(profile.member_since), 'MMM yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Active {getLastActiveLabel(profile.last_active)}
                            </span>
                            {profile.avg_response_minutes !== null && (
                                <span className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Replies {getResponseLabel(profile.avg_response_minutes).toLowerCase()}
                                </span>
                            )}
                        </div>

                        {/* Same university indicator */}
                        {profile.same_university && (
                            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 w-fit">
                                <Users className="w-3.5 h-3.5" />
                                From your campus
                            </div>
                        )}
                    </div>
                </div>

                {/* ── TRUST & STATS ── */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                        <div className="text-2xl font-black text-gray-900">{profile.completed_sales}</div>
                        <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Successful Deals</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                        <div className="text-2xl font-black text-gray-900">{profile.response_rate}%</div>
                        <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Response Rate</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                        <div className="text-2xl font-black text-gray-900">{profile.active_listings}</div>
                        <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Active Listings</div>
                    </div>
                </div>

                {/* ── BADGES ── */}
                {profile.badges.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                        <h2 className="text-sm font-bold text-gray-900 mb-3">Trust Badges</h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.badges.map((badge, i) => {
                                const colorClass = BADGE_COLORS[badge.type] || 'bg-gray-50 text-gray-700 border-gray-200'
                                const icon = BADGE_ICONS[badge.type] || <CheckCircle2 className="w-3.5 h-3.5" />
                                return (
                                    <span
                                        key={i}
                                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${colorClass}`}
                                    >
                                        {icon}
                                        {badge.label}
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── LISTINGS SECTION ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-[#4C3B8A]" />
                                Active Listings
                                <span className="text-gray-400 font-medium">({profile.active_listings})</span>
                            </h2>

                            {/* Filter chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                {POST_TYPE_FILTERS.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => setTypeFilter(f.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                            typeFilter === f.value
                                                ? 'bg-[#4C3B8A] text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        {filteredListings.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 font-medium">
                                    {typeFilter === 'all' ? 'No active listings' : `No ${typeFilter} listings`}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {filteredListings.map(listing => (
                                    <MarketplaceListingCard key={listing.id} listing={listing} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── MOBILE STICKY BAR ── */}
            {!isOwnProfile && (
                <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t border-gray-100 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={handleMessage}
                        disabled={startingChat}
                        className="w-full flex items-center justify-center gap-2 bg-[#4C3B8A] hover:bg-[#3D2F6E] text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-[#4C3B8A]/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <MessageCircle className="w-4 h-4" />
                        {startingChat ? 'Starting...' : 'Message Seller'}
                    </button>
                </div>
            )}
        </div>
    )
}
