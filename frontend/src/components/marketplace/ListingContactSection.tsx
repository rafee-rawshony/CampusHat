import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MapPin, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth.store'
import { ChatButton } from './ChatButton'

interface ListingContactSectionProps {
    listing: {
        id: string | number
        post_type: string
        contact_visible: boolean
        contact_phone?: string
        meetup_location?: string
        user_info: {
            id: string | number
            full_name: string
            profile_picture?: string | null
            reputation_score?: number
        }
    }
    isAuthenticated: boolean
    onOpenOfferModal: () => void
}

export function ListingContactSection({ listing, isAuthenticated, onOpenOfferModal }: ListingContactSectionProps) {
    const router = useRouter()
    const { user, canAccessMarketplace } = useAuthStore()
    const isContactVisible = listing.contact_visible || (isAuthenticated && canAccessMarketplace())
    const isOwnListing = isAuthenticated && String(user?.id) === String(listing.user_info.id)

    // Role-aware messages and CTA for the locked contact section
    const getLockContent = () => {
        if (!isAuthenticated) {
            return {
                message: 'Sign in to view contact information and send messages.',
                cta: 'Sign In to Continue',
                action: () => router.push(`/auth/login?redirect=/marketplace/listings/${listing.id}`),
            }
        }
        const role = user?.role
        if (role === 'student' || role === 'faculty') {
            // Student/faculty but not yet verified
            return {
                message: 'Verify your university student ID to unlock contact info, chat, and posting.',
                cta: 'Verify Student ID',
                action: () => router.push('/account/verify'),
            }
        }
        // normal_user, seller, or unknown — marketplace is student-only
        return {
            message: 'Marketplace is for verified university students and faculty only.',
            cta: 'Learn More',
            action: () => router.push('/help'),
        }
    }

    const lockContent = getLockContent()

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
            {/* Blurred Overlay for Unverified */}
            {!isContactVisible && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-gray-300 rounded-2xl">
                    <ShieldCheck className="w-12 h-12 text-brand-primary mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Access Restricted</h3>
                    <p className="text-sm text-gray-600 mb-5 font-medium max-w-[250px]">
                        {lockContent.message}
                    </p>
                    <Button
                        onClick={lockContent.action}
                        className="bg-brand-primary hover:bg-brand-dark text-white rounded-xl font-bold shadow-md w-full"
                    >
                        {lockContent.cta}
                    </Button>
                </div>
            )}

            <div className={`p-6 md:p-8 ${!isContactVisible && 'blur-sm select-none pointer-events-none opacity-50'}`}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Seller Information</h3>
                <div className="flex items-center gap-4 mb-6">
                    {listing.user_info.profile_picture ? (
                        <Image src={listing.user_info.profile_picture} alt="Seller" width={56} height={56} className="rounded-full object-cover w-14 h-14 border-2 border-gray-100 shadow-sm" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary/20 to-purple-500/20 flex items-center justify-center border-2 border-white shadow-sm">
                            <User className="w-6 h-6 text-brand-primary" />
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold text-gray-900 text-lg leading-tight">
                            {listing.user_info.full_name}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex items-center bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                ★ {listing.user_info.reputation_score ? Number(listing.user_info.reputation_score).toFixed(1) : "0.0"}
                            </div>
                            <span className="text-xs font-medium text-gray-500">Verified Member</span>
                        </div>
                    </div>
                </div>

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
                    {isOwnListing ? (
                        <Button
                            onClick={() => router.push(`/marketplace/my-ads/edit/${listing.id}`)}
                            className="w-full bg-[#4C3B8A] hover:bg-[#2D1B69] text-white rounded-xl h-12 font-bold shadow-md gap-2"
                        >
                            Edit Listing
                        </Button>
                    ) : (
                        <>
                            <ChatButton
                                listingId={listing.id}
                                className="w-full bg-[#4C3B8A] hover:bg-[#2D1B69] text-white rounded-xl h-12 font-bold shadow-md gap-2"
                            >
                                Send Message
                            </ChatButton>
                            <Button
                                onClick={onOpenOfferModal}
                                variant="outline"
                                className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary/5 rounded-xl h-12 font-bold"
                            >
                                Make Offer
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
