import Image from 'next/image'
import Link from 'next/link'
import { Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MarketplaceListingCardProps {
    listing: any
}

const TYPE_BADGE: Record<string, { label: string; bg: string }> = {
    buy: { label: 'BUY', bg: 'bg-blue-600' },
    rental: { label: 'RENTAL', bg: 'bg-green-600' },
    service: { label: 'SERVICE', bg: 'bg-purple-600' },
    food: { label: 'FOOD', bg: 'bg-amber-600' },
}

const FALLBACK_BG: Record<string, string> = {
    buy: 'bg-gradient-to-br from-blue-500 to-blue-700',
    rental: 'bg-gradient-to-br from-gray-500 to-gray-700',
    service: 'bg-gradient-to-br from-purple-500 to-pink-600',
    food: 'bg-gradient-to-br from-amber-500 to-orange-600',
}

function getTimeLeft(createdAt: string): string | null {
    try {
        const created = new Date(createdAt)
        const expiresAt = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days default
        const now = new Date()
        const diffMs = expiresAt.getTime() - now.getTime()
        if (diffMs <= 0) return null
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        if (diffDays > 0) return `${diffDays}d LEFT`
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        return `${diffHours} HRS LEFT`
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

export function MarketplaceListingCard({ listing }: MarketplaceListingCardProps) {
    const postType = listing.post_type || 'buy'
    const imageUrl = listing.images?.[0]?.image || listing.images?.[0]?.image_url || null
    const badge = TYPE_BADGE[postType] || TYPE_BADGE.buy
    const categoryName = typeof listing.category === 'string' ? listing.category : listing.category?.name || ''
    const uniShort = listing.university_short || listing.university_name?.substring(0, 5)?.toUpperCase() || ''
    const condition = listing.condition

    const timeLeft = getTimeLeft(listing.created_at)
    const timeAgo = getTimeAgo(listing.created_at)

    const priceLabel = (() => {
        const price = `৳${Number(listing.price || 0).toLocaleString()}`
        if (postType === 'rental') return `${price} / month`
        if (postType === 'service' && listing.price_unit) return `${price} / ${listing.price_unit}`
        return price
    })()

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
                    <div className={`w-full h-full ${FALLBACK_BG[postType]} flex items-center justify-center p-4`}>
                        <span className="text-white font-bold text-sm text-center line-clamp-3">{listing.title}</span>
                    </div>
                )}

                {/* Top-Left Badge */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {condition && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm">
                            {condition.replace(/-/g, ' ')}
                        </span>
                    )}
                    {postType !== 'buy' && (
                        <span className={`${badge.bg} text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-sm`}>
                            {badge.label}
                        </span>
                    )}
                </div>

                {/* Bottom-Right Time Left */}
                {timeLeft && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm">
                        <Clock className="w-3 h-3" />
                        <span>{timeLeft}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Category · University */}
                {(categoryName || uniShort) && (
                    <p className="text-[10px] uppercase text-gray-400 tracking-wider font-medium mb-1 truncate">
                        {categoryName}{categoryName && uniShort ? ' · ' : ''}{uniShort}
                    </p>
                )}

                {/* Title */}
                <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2 min-h-[36px] mb-1.5 group-hover:text-[#634C9F] transition-colors">
                    {listing.title}
                </h3>

                {/* Price */}
                <p className="font-bold text-gray-900 text-base mb-3">{priceLabel}</p>

                {/* Seller Info + Time */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
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
                        <span className="text-xs text-gray-600 font-medium truncate max-w-[90px]">
                            {listing.user?.first_name || 'Seller'} {listing.user?.last_name?.charAt(0) || ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{timeAgo}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
