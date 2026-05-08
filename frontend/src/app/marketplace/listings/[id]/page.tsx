'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    MapPin,
    Clock,
    Flag,
    ChevronDown,
    ChevronUp,
    Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { MakeOfferModal } from '@/components/marketplace/MakeOfferModal'
import { ReportListingModal } from '@/components/marketplace/ReportListingModal'
import { ListingImageGallery } from '@/components/marketplace/ListingImageGallery'
import { ListingContactSection } from '@/components/marketplace/ListingContactSection'
import { ChatButton } from '@/components/marketplace/ChatButton'
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
    user_info: {
        id: number | string
        full_name: string
        profile_picture?: string | null
        reputation_score?: number
    }
    created_at: string
    expires_at: string
    contact_visible: boolean
    contact_phone?: string
    is_negotiable: boolean
}

export default function MarketplaceAdDetailPage({ params }: { params: { id: string } }) {
    const { isAuthenticated, canAccessMarketplace, user } = useAuthStore()
    const [listing, setListing] = useState<DetailListing | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [descExpanded, setDescExpanded] = useState(false)

    const [isOfferModalOpen, setOfferModalOpen] = useState(false)
    const [isReportModalOpen, setReportModalOpen] = useState(false)

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await api.get(`/marketplace/listings/${params.id}/`)
                setListing(res.data?.data || res.data)
            } catch (err: any) {
                const status = err?.response?.status
                if (status === 404) {
                    setError('This listing was not found or may have been removed.')
                } else {
                    setError('Failed to load listing. Please try again later.')
                }
            } finally {
                setLoading(false)
            }
        }
        fetchListing()
    }, [params.id])

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

    if (error || !listing) return (
        <div className="text-center py-20">
            <p className="text-gray-500 mb-4">{error || 'Listing not found.'}</p>
            <Link href="/marketplace" className="text-brand-primary font-bold hover:underline">
                Back to Marketplace
            </Link>
        </div>
    )

    const categoryName = typeof listing.category === 'string' ? listing.category : listing.category?.name || 'Various'
    return (
        <div className="bg-white min-h-screen pb-20 pt-6">
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
                        <ListingImageGallery images={listing.images} postType={listing.post_type} title={listing.title} />

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
                        <ListingContactSection 
                            listing={listing} 
                            isAuthenticated={isAuthenticated} 
                            onOpenOfferModal={() => setOfferModalOpen(true)} 
                        />

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
            <MakeOfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setOfferModalOpen(false)}
                listingId={listing.id}
                listingTitle={listing.title}
                askingPrice={listing.price}
            />
            <ReportListingModal
                isOpen={isReportModalOpen}
                onClose={() => setReportModalOpen(false)}
                entityId={listing.id}
                entityType="listing"
            />

            {/* Mobile Sticky Bar - Only for verified users, not on own listing */}
            {canAccessMarketplace() && String(user?.id) !== String(listing.user_info.id) && (
                <div className='fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t px-4 py-3 flex gap-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'>
                    <ChatButton
                        listingId={listing.id}
                        variant="outline"
                        className='flex-1 border-2 border-brand-primary text-brand-primary font-bold py-2.5 rounded-xl text-sm h-auto bg-white hover:bg-brand-primary/5'
                    >
                        Message
                    </ChatButton>
                    {listing.is_negotiable && (
                        <button onClick={() => setOfferModalOpen(true)}
                            className='flex-1 bg-brand-primary text-white font-bold py-2.5 rounded-xl text-sm shadow-md'>
                            Make Offer
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
