import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin, Package, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Badge } from '@/components/ui/badge'

// Types for a marketplace listing card.
// Exported so pages/sections can type their data properly.
export type MarketplacePostType = 'buy' | 'rental' | 'service' | 'food'

export interface MarketplaceListing {
    id: string | number
    title: string
    price: string | number
    price_unit?: string | null          // e.g. "hour", "day" for services
    post_type: MarketplacePostType
    images?: { image?: string; image_url?: string }[]
    condition?: string | null
    category?: { name: string } | string | null
    university_name?: string | null
    university_short?: string | null
    user?: {
        first_name?: string
        last_name?: string
        full_name?: string
        avatar?: string | null
    } | null
    created_at: string
    // Backend sends false when the viewer is NOT a verified marketplace user.
    // When false, we must hide the seller's identity.
    contact_visible?: boolean
    // Optional stock-style indicator for services/food etc.
    remaining_interest?: number | null
}

interface MarketplaceListingCardProps {
    listing: MarketplaceListing
}

// Badge color + label per post type.
const TYPE_BADGE: Record<MarketplacePostType, { label: string; bg: string }> = {
    buy: { label: 'BUY', bg: 'bg-blue-600' },
    rental: { label: 'RENTAL', bg: 'bg-green-600' },
    service: { label: 'SERVICE', bg: 'bg-purple-600' },
    food: { label: 'FOOD', bg: 'bg-amber-600' },
}

// Gradient shown when the listing has no image.
const FALLBACK_BG: Record<MarketplacePostType, string> = {
    buy: 'bg-gradient-to-br from-blue-500 to-blue-700',
    rental: 'bg-gradient-to-br from-gray-500 to-gray-700',
    service: 'bg-gradient-to-br from-purple-500 to-pink-600',
    food: 'bg-gradient-to-br from-amber-500 to-orange-600',
}

// Default marketplace ad lifetime — used for the "time left" badge.
const LISTING_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// Small helper — how long until the listing expires.
function getTimeLeft(createdAt: string): string | null {
    try {
        const expiresAt = new Date(createdAt).getTime() + LISTING_LIFETIME_MS
        const diffMs = expiresAt - Date.now()
        if (diffMs <= 0) return null
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        if (diffDays > 0) return `${diffDays}d LEFT`
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        return `${diffHours} HRS LEFT`
    } catch {
        return null
    }
}

// "Posted 2 hours ago" style timestamp.
function getTimeAgo(dateStr: string): string {
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
        return 'Recently'
    }
}

// Build the displayed price string.
// Rentals are always monthly. Services may have a price_unit like "hour".
function formatPrice(listing: MarketplaceListing): string {
    const amount = `৳${Number(listing.price || 0).toLocaleString()}`
    if (listing.post_type === 'rental') return `${amount} / month`
    if (listing.post_type === 'service' && listing.price_unit) {
        return `${amount} / ${listing.price_unit}`
    }
    return amount
}

// Pick the best image URL available (backend is inconsistent between
// `image` and `image_url`).
function getImageUrl(listing: MarketplaceListing): string | null {
    const first = listing.images?.[0]
    if (!first) return null
    return first.image_url || first.image || null
}

// Short seller name: "First L." — avoids showing the full last name.
function getSellerLabel(user: MarketplaceListing['user']): string {
    if (!user) return 'Seller'
    if (user.full_name) return user.full_name
    const first = user.first_name || 'Seller'
    const lastInitial = user.last_name ? user.last_name.charAt(0) : ''
    return lastInitial ? `${first} ${lastInitial}.` : first
}

export function MarketplaceListingCard({ listing }: MarketplaceListingCardProps) {
    const postType: MarketplacePostType = listing.post_type || 'buy'
    const imageUrl = getImageUrl(listing)
    const badge = TYPE_BADGE[postType] || TYPE_BADGE.buy

    const categoryName =
        typeof listing.category === 'string'
            ? listing.category
            : listing.category?.name || ''
    const uniShort =
        listing.university_short ||
        listing.university_name?.substring(0, 5)?.toUpperCase() ||
        ''

    const timeLeft = getTimeLeft(listing.created_at)
    const timeAgo = getTimeAgo(listing.created_at)
    const priceLabel = formatPrice(listing)

    // Security: the backend decides visibility. Default to hidden when not sent.
    const contactVisible = listing.contact_visible === true
    const sellerLabel = getSellerLabel(listing.user)

    return (
        <Link
            href={`/marketplace/listings/${listing.id}`}
            className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 overflow-hidden"
        >
            {/* Image Area */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <div
                        className={`w-full h-full ${FALLBACK_BG[postType]} flex items-center justify-center p-4`}
                    >
                        <span className="text-white font-bold text-sm text-center line-clamp-3">
                            {listing.title}
                        </span>
                    </div>
                )}

                {/* Top-left badges: condition + post type */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    {listing.condition && (
                        <Badge className="bg-blue-600 text-white border-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm">
                            {listing.condition.replace(/-/g, ' ')}
                        </Badge>
                    )}
                    {postType !== 'buy' && (
                        <Badge className={`${badge.bg} text-white border-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm`}>
                            {badge.label}
                        </Badge>
                    )}
                </div>

                {/* Bottom-right: either "time left" OR "X left in stock" — not both. */}
                {timeLeft && listing.remaining_interest == null && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm">
                        <Clock className="w-3 h-3" />
                        <span>{timeLeft}</span>
                    </div>
                )}
                {listing.remaining_interest != null && listing.remaining_interest > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/95 text-gray-800 px-2 py-0.5 rounded-full shadow-sm">
                        <Package className="w-3 h-3 text-brand-primary" />
                        <span className="text-[10px] font-bold">
                            {listing.remaining_interest} left
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Category · University row */}
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] uppercase text-gray-400 tracking-wider font-medium truncate">
                        {categoryName || ' '}
                    </span>
                    {uniShort && (
                        <div className="flex items-center gap-1 text-gray-400 shrink-0">
                            <MapPin className="w-3 h-3" />
                            <span className="text-[10px] font-semibold truncate max-w-[80px]">
                                {uniShort}
                            </span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2 min-h-[36px] mb-1.5 group-hover:text-[#4C3B8A] transition-colors">
                    {listing.title}
                </h3>

                {/* Price */}
                <p className="font-bold text-gray-900 text-base mb-3">{priceLabel}</p>

                {/* Seller row + "time ago". Hide identity when contact_visible is false. */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {contactVisible ? (
                            <>
                                {listing.user?.avatar ? (
                                    <Image
                                        src={listing.user.avatar}
                                        alt=""
                                        width={24}
                                        height={24}
                                        className="rounded-full object-cover w-6 h-6 border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                        <User className="w-3 h-3 text-gray-400" />
                                    </div>
                                )}
                                <span className="text-xs text-gray-600 font-medium truncate max-w-[100px]">
                                    {sellerLabel}
                                </span>
                            </>
                        ) : (
                            // Unverified viewer — blur identity instead of leaking it.
                            <>
                                <div className="w-6 h-6 rounded-full bg-gray-200 blur-[2px]" />
                                <span className="text-xs font-semibold text-gray-400 blur-[3px] select-none">
                                    Hidden User
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{timeAgo}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
