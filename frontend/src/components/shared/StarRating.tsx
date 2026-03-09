import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
    rating: number
    count?: number
    className?: string
    showCount?: boolean
}

export function StarRating({ rating, count, className, showCount = true }: StarRatingProps) {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                    if (i < fullStars) {
                        return <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    }
                    if (i === fullStars && hasHalfStar) {
                        return <StarHalf key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    }
                    return <Star key={i} className="h-3 w-3 text-gray-300" />
                })}
            </div>
            {showCount && count !== undefined && (
                <span className="text-[10px] text-gray-400 font-medium">({count})</span>
            )}
        </div>
    )
}
