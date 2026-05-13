'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    MapPin, Clock, Flag, ChevronDown, ChevronUp, Tag,
    ShoppingBag, Key, Briefcase, UtensilsCrossed
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
    images: { id: number | string, image?: string, image_url?: string }[]
    condition?: string
    post_type: 'sell' | 'rent' | 'buy' | 'rental' | 'service' | 'food'
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
    // Sell
    brand?: string | null
    model_name?: string | null
    usage_duration?: string | null
    delivery_option?: string | null
    // Rent
    location?: string | null
    availability_date?: string | null
    rental_duration?: string | null
    deposit_amount?: string | number | null
    facilities?: string | null
    room_details?: string | null
    rules_conditions?: string | null
    contact_preference?: string | null
    // Service
    skills?: string | null
    experience?: string | null
    delivery_time?: string | null
    availability_hours?: string | null
    portfolio_url?: string | null
    previous_work_desc?: string | null
    // Food
    ingredients?: string | null
    portion_size?: string | null
    delivery_area?: string | null
    food_delivery_time?: string | null
    daily_availability?: string | null
    hygiene_certification?: string | null
    combo_packages?: string | null
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

                        {/* Type-Specific Details Section */}
                        {(listing.post_type === 'buy' || listing.post_type === 'sell') && (listing.brand || listing.model_name || listing.usage_duration || listing.delivery_option) && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                                    Product Specifications
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {listing.brand && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Brand</p>
                                            <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.brand}</p>
                                        </div>
                                    )}
                                    {listing.model_name && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</p>
                                            <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.model_name}</p>
                                        </div>
                                    )}
                                    {listing.usage_duration && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Used For</p>
                                            <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.usage_duration}</p>
                                        </div>
                                    )}
                                    {listing.delivery_option && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery</p>
                                            <p className="text-sm font-bold text-gray-900 mt-0.5 capitalize">{listing.delivery_option.replace(/_/g, ' ')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {(listing.post_type === 'rental' || listing.post_type === 'rent') && (listing.location || listing.room_details || listing.facilities || listing.rules_conditions) && (
                            <div className="space-y-4">
                                {(listing.location || listing.rental_duration || listing.deposit_amount) && (
                                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-2xl border border-violet-100">
                                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Key className="w-5 h-5 text-violet-600" />
                                            Rental Information
                                        </h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            {listing.location && (
                                                <div className="col-span-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</p>
                                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.location}</p>
                                                </div>
                                            )}
                                            {listing.availability_date && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available From</p>
                                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.availability_date}</p>
                                                </div>
                                            )}
                                            {listing.rental_duration && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</p>
                                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.rental_duration}</p>
                                                </div>
                                            )}
                                            {listing.deposit_amount && Number(listing.deposit_amount) > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Security Deposit</p>
                                                    <p className="text-sm font-bold text-amber-700 mt-0.5">৳{Number(listing.deposit_amount).toLocaleString()}</p>
                                                </div>
                                            )}
                                            {listing.contact_preference && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Via</p>
                                                    <p className="text-sm font-bold text-gray-900 mt-0.5 capitalize">{listing.contact_preference}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {(listing.room_details || listing.facilities) && (
                                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-2xl border border-teal-100">
                                        <h2 className="text-lg font-bold text-gray-900 mb-3">Room & Facilities</h2>
                                        {listing.room_details && (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Room Details</p>
                                                <p className="text-sm text-gray-700 whitespace-pre-line">{listing.room_details}</p>
                                            </div>
                                        )}
                                        {listing.facilities && (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Facilities</p>
                                                <p className="text-sm text-gray-700 whitespace-pre-line">{listing.facilities}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {listing.rules_conditions && (
                                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                        <h2 className="text-lg font-bold text-gray-900 mb-2">Rules & Conditions</h2>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">{listing.rules_conditions}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {listing.post_type === 'service' && (listing.skills || listing.experience || listing.previous_work_desc) && (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-emerald-600" />
                                        Service Profile
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {listing.skills && (
                                            <div className="col-span-2">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Skills</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {listing.skills.split(',').map((s, i) => (
                                                        <span key={i} className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{s.trim()}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {listing.experience && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Experience</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.experience}</p>
                                            </div>
                                        )}
                                        {listing.delivery_time && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Time</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.delivery_time}</p>
                                            </div>
                                        )}
                                        {listing.availability_hours && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.availability_hours}</p>
                                            </div>
                                        )}
                                        {listing.portfolio_url && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Portfolio</p>
                                                <a href={listing.portfolio_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-emerald-600 hover:underline mt-0.5 block truncate">{listing.portfolio_url}</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {listing.previous_work_desc && (
                                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                        <h2 className="text-lg font-bold text-gray-900 mb-2">Previous Work</h2>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">{listing.previous_work_desc}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {listing.post_type === 'food' && (listing.ingredients || listing.portion_size || listing.delivery_area) && (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-2xl border border-red-100">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <UtensilsCrossed className="w-5 h-5 text-red-500" />
                                        Food Details
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {listing.portion_size && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Portion Size</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5 capitalize">{listing.portion_size}</p>
                                            </div>
                                        )}
                                        {listing.daily_availability && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.daily_availability}</p>
                                            </div>
                                        )}
                                        {listing.delivery_area && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Area</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.delivery_area}</p>
                                            </div>
                                        )}
                                        {listing.food_delivery_time && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Time</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{listing.food_delivery_time}</p>
                                            </div>
                                        )}
                                    </div>
                                    {listing.ingredients && (
                                        <div className="mt-4 pt-4 border-t border-red-100">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ingredients</p>
                                            <p className="text-sm text-gray-700 whitespace-pre-line">{listing.ingredients}</p>
                                        </div>
                                    )}
                                </div>
                                {listing.hygiene_certification && (
                                    <div className="bg-cyan-50 p-6 rounded-2xl border border-cyan-100">
                                        <h2 className="text-lg font-bold text-gray-900 mb-2">Hygiene & Safety</h2>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">{listing.hygiene_certification}</p>
                                    </div>
                                )}
                                {listing.combo_packages && (
                                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                        <h2 className="text-lg font-bold text-gray-900 mb-2">Combo / Package Options</h2>
                                        <p className="text-sm text-gray-700 whitespace-pre-line">{listing.combo_packages}</p>
                                    </div>
                                )}
                            </div>
                        )}
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
