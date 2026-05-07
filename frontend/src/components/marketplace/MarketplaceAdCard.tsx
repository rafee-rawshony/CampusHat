import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Package, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export interface MarketplaceListing {
    id: string | number
    title: string
    price: string | number
    price_unit?: string
    images: { image: string }[]
    condition?: string
    post_type: 'buy' | 'rental' | 'service' | 'food'
    category: { name: string } | string
    university_name?: string
    user: {
        first_name: string
        last_name: string
        avatar?: string | null
    }
    created_at: string
    contact_visible: boolean
    remaining_interest?: number
}

interface MarketplaceAdCardProps {
    listing: MarketplaceListing
}

export function MarketplaceAdCard({ listing }: MarketplaceAdCardProps) {
    const imageUrl = listing.images && listing.images.length > 0
        ? listing.images[0].image
        : null

    const timeAgo = formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })
    const isOwnerVerifiedOrContactVisible = listing.contact_visible
    const categoryName = typeof listing.category === 'string' ? listing.category : listing.category?.name || 'Various'

    return (
        <Link href={`/marketplace/listings/${listing.id}`} className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
            {/* Image Area */}
            <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm font-medium">
                        No Image
                    </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
                    {listing.post_type !== 'buy' && (
                        <Badge variant={listing.post_type as 'rental' | 'service' | 'food'} className="uppercase shadow-sm text-[10px] font-extrabold tracking-wider">
                            {listing.post_type}
                        </Badge>
                    )}
                    {listing.condition && (
                        <Badge className="bg-white/90 text-gray-800 backdrop-blur-sm border-white/20 text-[9px] uppercase font-bold shadow-sm">
                            {listing.condition.replace('-', ' ')}
                        </Badge>
                    )}
                </div>

                {/* Stock Overlay */}
                {listing.remaining_interest !== undefined && listing.remaining_interest > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/95 text-gray-800 px-2 py-0.5 rounded-full shadow-sm">
                        <Package className="w-3 h-3 text-brand-primary" />
                        <span className="text-[10px] font-bold">{listing.remaining_interest} left</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
                        {categoryName}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400 shrink-0">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[10px] font-semibold truncate max-w-[80px]">
                            {listing.university_name || 'All Campuses'}
                        </span>
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 leading-snug text-sm sm:text-base line-clamp-2 min-h-[40px] mb-2 group-hover:text-brand-primary transition-colors">
                    {listing.title}
                </h3>

                <div className="flex items-end gap-1 mb-4">
                    <span className="text-lg font-bold text-gray-900 tracking-tight">৳{Number(listing.price).toLocaleString()}</span>
                    {listing.price_unit && (
                        <span className="text-[11px] font-medium text-gray-500 mb-0.5">/{listing.price_unit}</span>
                    )}
                </div>

                {/* Seller Info Row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        {isOwnerVerifiedOrContactVisible ? (
                            <>
                                {listing.user.avatar ? (
                                    <Image src={listing.user.avatar} alt="Seller" width={24} height={24} className="rounded-full object-cover w-6 h-6 border border-gray-200" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                                        <User className="w-3 h-3 text-brand-primary" />
                                    </div>
                                )}
                                <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">
                                    {listing.user.first_name} {listing.user.last_name}
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="w-6 h-6 rounded-full bg-gray-200 blur-[2px]" />
                                <span className="text-xs font-semibold text-gray-400 blur-[3px] select-none">
                                    Hidden User
                                </span>
                            </>
                        )}
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
