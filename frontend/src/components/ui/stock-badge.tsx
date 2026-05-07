import { cn } from '@/lib/utils'

interface StockBadgeProps {
    stock: number
    className?: string
}

export function StockBadge({ stock, className }: StockBadgeProps) {
    if (stock <= 0) {
        return (
            <span className={cn('text-xs font-medium text-muted-foreground', className)}>
                Out of Stock
            </span>
        )
    }
    if (stock <= 5) {
        return (
            <span className={cn('text-xs font-medium text-badge-lowstock', className)}>
                Only {stock} left
            </span>
        )
    }
    return (
        <span className={cn('text-xs font-medium text-badge-instock', className)}>
            In Stock
        </span>
    )
}
