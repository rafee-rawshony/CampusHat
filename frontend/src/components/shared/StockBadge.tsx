import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StockBadgeProps {
    quantity: number
    className?: string
}

export function StockBadge({ quantity, className }: StockBadgeProps) {
    if (quantity <= 0) {
        return (
            <Badge variant="outline" className={cn("text-red-500 border-red-200 bg-red-50 font-medium", className)}>
                Out of Stock
            </Badge>
        )
    }

    if (quantity <= 5) {
        return (
            <Badge variant="outline" className={cn("text-orange-500 border-orange-200 bg-orange-50 font-medium", className)}>
                Only {quantity} Left
            </Badge>
        )
    }

    return (
        <Badge variant="outline" className={cn("text-emerald-600 border-emerald-100 bg-emerald-50 font-medium", className)}>
            In Stock
        </Badge>
    )
}
