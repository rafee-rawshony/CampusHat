import Image from 'next/image'
import Link from 'next/link'
import {
    Clock, MapPin, Package, User, ShoppingBag, Key, Briefcase,
    UtensilsCrossed, Tag, Truck, Banknote, Timer
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { absoluteMediaUrl } from '@/services/upload.service'

export type MarketplacePostType = 'sell' | 'rent' | 'service' | 'food' | 'buy' | 'rental'
type CanonicalPostType = 'sell' | 'rent' | 'service' | 'food'

export interface MarketplaceListing {
    id: string | number
    title: string
    price: string | number
    price_unit?: string | null
    post_type: MarketplacePostType | string
    images?: Array<{ image?: string; image_url?: string } | string>
    primary_image_url?: string | null
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
    contact_visible?: boolean
    remaining_interest?: number | null
    // Sell extras
    brand?: string | null
    model_name?: string | null
    delivery_option?: string | null
    // Rent extras
    location?: string | null
    deposit_amount?: string | number | null
    // Service extras
    skills?: string | null
    delivery_time?: string | null
    // Food extras
    portion_size?: string | null
    delivery_area?: string | null
    food_delivery_time?: string | null
    is_negotiable?: boolean
}

export interface MarketplaceListingCardProps {
    listing: MarketplaceListing
}

const TYPE_CONFIG: Record<CanonicalPostType, {
    label: string
    badgeBg: string
    accentColor: string
    priceColor: string
    fallbackBg: string
    icon: React.ReactNode
    hoverAccent: string
}> = {
    sell: {
        label: 'BUY',
        badgeBg: 'bg-blue-600',
        accentColor: 'text-blue-600',
        priceColor: 'text-blue-700',
        fallbackBg: 'bg-gradient-to-br from-blue-500 to-indigo-700',
        icon: <ShoppingBag className="w-3 h-3" />,
        hoverAccent: 'group-hover:text-blue-600',
    },
    rent: {
        label: 'RENT',
        badgeBg: 'bg-violet-600',
        accentColor: 'text-violet-600',
        priceColor: 'text-violet-700',
        fallbackBg: 'bg-gradient-to-br from-violet-500 to-purple-700',
        icon: <Key className="w-3 h-3" />,
        hoverAccent: 'group-hover:text-violet-600',
    },
    service: {
        label: 'SERVICE',
        badgeBg: 'bg-emerald-600',
        accentColor: 'text-emerald-600',
        priceColor: 'text-emerald-700',
        fallbackBg: 'bg-gradient-to-br from-emerald-500 to-teal-700',
        icon: <Briefcase className="w-3 h-3" />,
        hoverAccent: 'group-hover:text-emerald-600',
    },
    food: {
        label: 'FOOD',
        badgeBg: 'bg-red-500',
        accentColor: 'text-red-500',
        priceColor: 'text-red-600',
        fallbackBg: 'bg-gradient-to-br from-red-500 to-orange-600',
        icon: <UtensilsCrossed className="w-3 h-3" />,
        hoverAccent: 'group-hover:text-red-500',
    },
}

const LISTING_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000

function normalizePostType(postType: MarketplaceListing['post_type']): CanonicalPostType {
    if (postType === 'buy') return 'sell'
    if (postType === 'rental') return 'rent'
    if (postType === 'rent' || postType === 'service' || postType === 'food') return postType
    return 'sell'
}

function formatPrice(listing: MarketplaceListing, postType: CanonicalPostType): string {
    const amount = `৳${Number(listing.price || 0).toLocaleString()}`
    if (postType === 'rent') return `${amount}/mo`
    if (postType === 'service' && listing.price_unit) return `${amount}/${listing.price_unit}`
    return amount
}

function getImageUrl(listing: MarketplaceListing): string | null {
    const first = listing.images?.[0]
    const firstImage = typeof first === 'string' ? first : first?.image_url || first?.image || null
    return listing.primary_image_url || firstImage || null
}

function getSellerLabel(user: MarketplaceListing['user']): string {
    if (!user) return 'Seller'
    if (user.full_name) return user.full_name
    const first = user.first_name || 'Seller'
    const lastInitial = user.last_name ? user.last_name.charAt(0) : ''
    return lastInitial ? `${first} ${lastInitial}.` : first
}

function getTimeLeft(createdAt: string): string | null {
    try {
        const expiresAt = new Date(createdAt).getTime() + LISTING_LIFETIME_MS
        const diffMs = expiresAt - Date.now()
        if (diffMs <= 0) return null
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        if (diffDays > 0) return `${diffDays}d left`
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        return `${diffHours}h left`
    } catch {
        return null
    }
}

function getTimeAgo(dateStr: string): string {
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
        return 'Recently'
    }
}

function SellMeta({ listing }: { listing: MarketplaceListing }) {
    const chips: React.ReactNode[] = []
    if (listing.brand) {
        chips.push(
            <span key="brand" className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                <Tag className="w-2.5 h-2.5" />{listing.brand}
            </span>
        )
    }
    if (listing.delivery_option) {
        const label = listing.delivery_option === 'meetup' ? 'Meetup' : listing.delivery_option === 'delivery' ? 'Delivery' : 'Meetup+Delivery'
        chips.push(
            <span key="delivery" className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                <Truck className="w-2.5 h-2.5" />{label}
            </span>
        )
    }
    if (chips.length === 0) return null
    return <div className="flex flex-wrap gap-1 mt-1.5">{chips}</div>
}

function RentMeta({ listing }: { listing: MarketplaceListing }) {
    const hasAny = listing.location || (listing.deposit_amount && Number(listing.deposit_amount) > 0)
    if (!hasAny) return null
    return (
        <div className="mt-1.5 space-y-0.5">
            {listing.location && (
                <div className="flex items-center gap-1 text-[10px] text-violet-600 font-medium truncate">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />{listing.location}
                </div>
            )}
            {listing.deposit_amount && Number(listing.deposit_amount) > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                    <Banknote className="w-2.5 h-2.5 shrink-0" />Deposit: ৳{Number(listing.deposit_amount).toLocaleString()}
                </div>
            )}
        </div>
    )
}

function ServiceMeta({ listing }: { listing: MarketplaceListing }) {
    const chips: React.ReactNode[] = []
    if (listing.skills) {
        listing.skills.split(',').slice(0, 2).map(s => s.trim()).filter(Boolean).forEach((s, i) => {
            chips.push(
                <span key={`skill-${i}`} className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {s}
                </span>
            )
        })
    }
    if (listing.delivery_time) {
        chips.push(
            <span key="dt" className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                <Timer className="w-2.5 h-2.5" />{listing.delivery_time}
            </span>
        )
    }
    if (chips.length === 0) return null
    return <div className="flex flex-wrap gap-1 mt-1.5">{chips}</div>
}

function FoodMeta({ listing }: { listing: MarketplaceListing }) {
    const chips: React.ReactNode[] = []
    if (listing.portion_size) {
        const label = listing.portion_size.charAt(0).toUpperCase() + listing.portion_size.slice(1)
        chips.push(
            <span key="portion" className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                <Package className="w-2.5 h-2.5" />{label}
            </span>
        )
    }
    if (listing.food_delivery_time) {
        chips.push(
            <span key="fdt" className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                <Timer className="w-2.5 h-2.5" />{listing.food_delivery_time}
            </span>
        )
    }
    if (listing.delivery_area) {
        chips.push(
            <span key="area" className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                <MapPin className="w-2.5 h-2.5 shrink-0" />{listing.delivery_area}
            </span>
        )
    }
    if (chips.length === 0) return null
    return <div className="flex flex-wrap gap-1 mt-1.5">{chips}</div>
}

export function MarketplaceListingCard({ listing }: MarketplaceListingCardProps) {
    const postType = normalizePostType(listing.post_type)
    const imageUrl = absoluteMediaUrl(getImageUrl(listing))
    const cfg = TYPE_CONFIG[postType]

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
    const priceLabel = formatPrice(listing, postType)

    const contactVisible = listing.contact_visible === true
    const sellerLabel = getSellerLabel(listing.user)

    return (
        <Link
            href={`/marketplace/listings/${listing.id}`}
            className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.015] transition-all duration-300 overflow-hidden"
        >
            {/* Image Area */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={listing.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                ) : (
                    <div className={`w-full h-full ${cfg.fallbackBg} flex items-center justify-center p-4`}>
                        <span className="text-white font-bold text-sm text-center line-clamp-3">
                            {listing.title}
                        </span>
                    </div>
                )}

                {/* Top-left: type badge */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <Badge className={`${cfg.badgeBg} text-white border-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1`}>
                        {cfg.icon}
                        {cfg.label}
                    </Badge>
                    {listing.condition && postType === 'sell' && (
                        <Badge className="bg-white/90 text-gray-800 border-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                            {listing.condition.replace(/_/g, ' ')}
                        </Badge>
                    )}
                </div>

                {/* Top-right: negotiable tag for sell */}
                {postType === 'sell' && listing.is_negotiable && (
                    <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-500 text-white border-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                            Negotiable
                        </Badge>
                    </div>
                )}

                {/* Bottom overlay — price + time left */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2 pt-6">
                    <div className="flex items-end justify-between">
                        <span className="font-extrabold text-white text-base drop-shadow-md">
                            {priceLabel}
                        </span>
                        {timeLeft && (
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[9px] font-medium">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{timeLeft}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Category + University */}
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold truncate ${cfg.accentColor}`}>
                        {categoryName || ' '}
                    </span>
                    {uniShort && (
                        <div className="flex items-center gap-0.5 text-gray-400 shrink-0">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-semibold truncate max-w-[70px]">{uniShort}</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className={`font-semibold text-sm text-gray-900 leading-snug line-clamp-2 min-h-[36px] mb-1 ${cfg.hoverAccent} transition-colors`}>
                    {listing.title}
                </h3>

                {/* Type-specific meta chips */}
                {postType === 'sell' && <SellMeta listing={listing} />}
                {postType === 'rent' && <RentMeta listing={listing} />}
                {postType === 'service' && <ServiceMeta listing={listing} />}
                {postType === 'food' && <FoodMeta listing={listing} />}

                {/* Seller row */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {contactVisible ? (
                            <>
                                {listing.user?.avatar ? (
                                    <Image
                                        src={absoluteMediaUrl(listing.user.avatar)}
                                        alt=""
                                        width={22}
                                        height={22}
                                        unoptimized
                                        className="rounded-full object-cover w-[22px] h-[22px] border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-[22px] h-[22px] rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                        <User className="w-2.5 h-2.5 text-gray-400" />
                                    </div>
                                )}
                                <span className="text-[11px] text-gray-600 font-medium truncate max-w-[90px]">
                                    {sellerLabel}
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="w-[22px] h-[22px] rounded-full bg-gray-200 blur-[2px]" />
                                <span className="text-[11px] font-semibold text-gray-400 blur-[3px] select-none">
                                    Hidden
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-0.5 text-gray-400 shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-medium">{timeAgo}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
