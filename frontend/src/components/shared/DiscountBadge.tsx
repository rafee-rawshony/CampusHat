import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DiscountBadgeProps {
    originalPrice?: string | number
    discountPrice?: string | number
    percentage?: number
    className?: string
}

export function DiscountBadge({ originalPrice, discountPrice, percentage, className }: DiscountBadgeProps) {
    let displayPercentage = percentage

    if (displayPercentage === undefined && originalPrice && discountPrice) {
        const original = parseFloat(originalPrice.toString())
        const discount = parseFloat(discountPrice.toString())
        if (original && discount && discount < original) {
            displayPercentage = Math.round(((original - discount) / original) * 100)
        }
    }

    if (displayPercentage === undefined || displayPercentage <= 0) return null

    return (
        <Badge className={cn("bg-red-500 hover:bg-red-600 text-white border-none font-bold", className)}>
            -{displayPercentage}%
        </Badge>
    )
}
