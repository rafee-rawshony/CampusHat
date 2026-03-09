import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
    rating: number
    count?: number
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function StarRating({ rating, count, size = 'sm', className }: StarRatingProps) {
    const sizeMap = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }
    const iconSize = sizeMap[size]
    const fullStars = Math.floor(rating)
    const hasHalf = rating - fullStars >= 0.5
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            {Array.from({ length: fullStars }).map((_, i) => (
                <Star key={`full-${i}`} className={cn(iconSize, 'fill-badge-pending text-badge-pending')} />
            ))}
            {hasHalf && <StarHalf className={cn(iconSize, 'fill-badge-pending text-badge-pending')} />}
            {Array.from({ length: emptyStars }).map((_, i) => (
                <Star key={`empty-${i}`} className={cn(iconSize, 'text-surface-border')} />
            ))}
            {count !== undefined && (
                <span className="text-xs text-muted-foreground ml-1">({count})</span>
            )}
        </div>
    )
}
