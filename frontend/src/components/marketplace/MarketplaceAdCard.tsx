import { MarketplaceListingCard, MarketplaceListing } from './MarketplaceListingCard'

export type { MarketplaceListing }

export interface MarketplaceAdCardProps {
    listing: MarketplaceListing
}

export function MarketplaceAdCard({ listing }: MarketplaceAdCardProps) {
    return <MarketplaceListingCard listing={listing} />
}
