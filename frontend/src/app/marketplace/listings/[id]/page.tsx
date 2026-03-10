'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    MapPin,
    Clock,
    Phone,
    MessageCircle,
    Flag,
    ShieldCheck,
    ChevronDown,
    ChevronUp,
    User,
    Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { OfferModal } from '@/components/marketplace/OfferModal'
import { ReportModal } from '@/components/marketplace/ReportModal'
import { formatDistanceToNow, format } from 'date-fns'

interface DetailListing {
    id: string | number
    title: string
    description: string
    price: string | number
    price_unit?: string
    images: { id: number, image: string }[]
    condition?: string
    post_type: 'buy' | 'rental' | 'service' | 'food'
    category: { name: string } | string
    university_name?: string
    meetup_location?: string
    user: {
        id: number | string
        first_name: string
        last_name: string
        avatar?: string | null
        reputation_score?: number
    }
    created_at: string
    expires_at: string
    contact_visible: boolean
    contact_phone?: string
}

export default function MarketplaceAdDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { isAuthenticated, isVerifiedStudent } = useAuthStore()
    const [listing, setListing] = useState<DetailListing | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeImage, setActiveImage] = useState(0)
    const [descExpanded, setDescExpanded] = useState(false)

    const [isOfferModalOpen, setOfferModalOpen] = useState(false)
    const [isReportModalOpen, setReportModalOpen] = useState(false)

    useEffect(() => {
        const fetchListing = async () => {
            try {
                // In production, this hits GET /api/v1/marketplace/listings/{id}/
                // The backend automatically evaluates contact_visible based on the JWT token.
                const res = await api.get(`/marketplace/listings/${params.id}/`)
                setListing(res.data)
            } catch (err: any) {
                console.warn('Listing fetch failed, falling back to dummy data', err)
                // Fallback dummy
                setListing({
                    id: params.id,
                    title: 'Brand New Calculator Campus Edition',
                    description: 'This is a detailed description of the item. It includes all the specifications, history, and reasons for selling.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.',
                    price: '1200',
                    images: [
                        { id: 1, image: 'https://placehold.co/800x600/F5F5F5/1A1A2E.png?text=Preview+1' },
                        { id: 2, image: 'https://placehold.co/800x600/E5E5E5/1A1A2E.png?text=Preview+2' },
                    ],
                    condition: 'USED-LIKE NEW',
                    post_type: 'buy',
                    category: 'Electronics',
                    university_name: 'Daffodil International University',
                    meetup_location: 'Library Area, Main Campus',
                    user: {
                        id: 99,
                        first_name: 'Alex',
                        last_name: 'Smith',
                        reputation_score: 4.8
                    },
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
                    // Evaluate locally for dummy purposes:
                    contact_visible: isAuthenticated && isVerifiedStudent(),
                    contact_phone: '+8801900000000'
                })
            } finally {
                setLoading(false)
            }
        }
        fetchListing()
    }, [params.id, isAuthenticated, isVerifiedStudent])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl animate-pulse">
                <div className="h-8 bg-gray-200 w-1/3 mb-6 rounded" />
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                    <div className="aspect-[4/3] bg-gray-200 rounded-2xl" />
                    <div className="space-y-4">
                        <div className="h-10 bg-gray-200 rounded" />
                        <div className="h-20 bg-gray-200 rounded" />
                        <div className="h-64 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!listing) return <div className="text-center py-20 text-gray-500">Listing not found.</div>

    const categoryName = typeof listing.category === 'string' ? listing.category : listing.category?.name || 'Various'
    const isContactVisible = listing.contact_visible

    return (
        <div className="bg-[#F5F5F5] min-h-screen pb-20 pt-6">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Breadcrumb / Top Bar */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
                    <Link href="/marketplace" className="hover:text-brand-primary">Marketplace</Link>
                    <span>/</span>
                    <Link href={`/marketplace/${listing.post_type}`} className="hover:text-brand-primary capitalize">{listing.post_type}</Link>
                    <span>/</span>
                    <span className="text-gray-900 truncate max-w-[200px]">{listing.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
                    {/* LEFT COLUMN: Gallery & Description */}
                    <div className="space-y-8">
                        {/* Image Gallery */}
                        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="relative aspect-[4/3] w-full bg-gray-50 rounded-xl overflow-hidden mb-2">
                                {listing.images.length > 0 ? (
                                    <Image
                                        src={listing.images[activeImage].image}
                                        alt={listing.title}
                                        fill
                                        className="object-contain"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                                        No Image Available
                                    </div>
                                )}
                            </div>
                            {listing.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
                                    {listing.images.map((img, idx) => (
                                        <button
                                            key={img.id || idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-brand-primary scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        >
                                            <Image src={img.image} alt="Thumbnail" fill className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Description Section */}
                        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-brand-primary" />
                                Description
                            </h2>
                            <div className={`prose prose-gray max-w-none text-gray-700 leading-relaxed ${!descExpanded ? 'line-clamp-4' : ''}`}>
                                {listing.description.split('\n').map((para, idx) => (
                                    <p key={idx} className="mb-2">{para}</p>
                                ))}
                            </div>
                            {listing.description.length > 250 && (
                                <button
                                    onClick={() => setDescExpanded(!descExpanded)}
                                    className="mt-4 flex items-center gap-1 text-brand-primary font-bold text-sm hover:underline"
                                >
                                    {descExpanded ? 'Show Less' : 'Read More'}
                                    {descExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Info & Contact Hub */}
                    <div className="space-y-6 lg:sticky lg:top-24">
                        {/* Title & Price Card */}
                        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant={listing.post_type as any} className="uppercase shadow-sm text-[11px] font-extrabold tracking-wider px-3">
                                    {listing.post_type}
                                </Badge>
                                {listing.condition && (
                                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 text-[11px] uppercase font-bold shadow-sm">
                                        {listing.condition.replace('-', ' ')}
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                                {listing.title}
                            </h1>

                            <div className="flex items-end gap-1 mb-6">
                                <span className="text-4xl font-black text-brand-primary tracking-tighter">৳{Number(listing.price).toLocaleString()}</span>
                                {listing.price_unit && (
                                    <span className="text-lg font-bold text-gray-500 mb-1">/{listing.price_unit}</span>
                                )}
                            </div>

                            <div className="space-y-3 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-brand-primary" />
                                    </div>
                                    <div className="text-sm font-medium">
                                        <p className="text-gray-900">{listing.university_name || 'All Campuses'}</p>
                                        <p className="text-xs text-gray-500">{categoryName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4 text-brand-primary" />
                                    </div>
                                    <div className="text-sm font-medium">
                                        <p className="text-gray-900">Posted {formatDistanceToNow(new Date(listing.created_at))} ago</p>
                                        <p className="text-xs text-gray-500">Expires {format(new Date(listing.expires_at), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Seller Card (ROLE-GATED) */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                            {/* Blurred Overlay for Unverified */}
                            {!isContactVisible && (
                                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-gray-300 rounded-2xl">
                                    <ShieldCheck className="w-12 h-12 text-brand-primary mb-3" />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Verification Required</h3>
                                    <p className="text-sm text-gray-600 mb-5 font-medium max-w-[250px]">
                                        To maintain a safe campus environment, contact info and chat are restricted.
                                    </p>
                                    {isAuthenticated ? (
                                        <Button onClick={() => router.push('/auth/verify')} className="bg-brand-primary hover:bg-brand-dark text-white rounded-xl font-bold shadow-md w-full">
                                            Get Verified
                                        </Button>
                                    ) : (
                                        <Button onClick={() => router.push('/auth/login')} className="bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-md w-full">
                                            Sign In to Continue
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className={`p-6 md:p-8 ${!isContactVisible && 'blur-sm select-none pointer-events-none opacity-50'}`}>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Seller Information</h3>
                                <div className="flex items-center gap-4 mb-6">
                                    {listing.user.avatar ? (
                                        <Image src={listing.user.avatar} alt="Seller" width={56} height={56} className="rounded-full object-cover w-14 h-14 border-2 border-gray-100 shadow-sm" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary/20 to-purple-500/20 flex items-center justify-center border-2 border-white shadow-sm">
                                            <User className="w-6 h-6 text-brand-primary" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg leading-tight">
                                            {listing.user.first_name} {listing.user.last_name}
                                        </h4>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <div className="flex items-center bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                ★ {listing.user.reputation_score?.toFixed(1) || "0.0"}
                                            </div>
                                            <span className="text-xs font-medium text-gray-500">Verified Member</span>
                                        </div>
                                    </div>
                                </div>

                                {listing.contact_phone && (
                                    <div className="flex flex-col gap-1 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contact Number</span>
                                        <a href={`tel:${listing.contact_phone}`} className="flex items-center gap-2 text-brand-primary font-bold hover:underline">
                                            <Phone className="w-4 h-4" />
                                            {listing.contact_phone}
                                        </a>
                                    </div>
                                )}

                                {listing.meetup_location && (
                                    <div className="flex flex-col gap-1 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Safe Meetup Area</span>
                                        <div className="flex items-start gap-2 text-gray-700 font-medium text-sm">
                                            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                            {listing.meetup_location}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={() => router.push(`/marketplace/chat?user=${listing.user.id}&listing=${listing.id}`)}
                                        className="w-full bg-[#1A1A2E] hover:bg-black text-white rounded-xl h-12 font-bold shadow-md gap-2"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Send Message
                                    </Button>
                                    <Button
                                        onClick={() => setOfferModalOpen(true)}
                                        variant="outline"
                                        className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary/5 rounded-xl h-12 font-bold"
                                    >
                                        Make Offer
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Report Button (Authenticated users only) */}
                        {isAuthenticated && (
                            <div className="flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReportModalOpen(true)}
                                    className="text-gray-400 hover:text-red-500 gap-1 text-xs font-medium"
                                >
                                    <Flag className="w-3 h-3" />
                                    Report this listing
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <OfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setOfferModalOpen(false)}
                listingId={listing.id}
                listingTitle={listing.title}
                askingPrice={listing.price}
            />
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setReportModalOpen(false)}
                entityId={listing.id}
                entityType="listing"
            />
        </div>
    )
}
