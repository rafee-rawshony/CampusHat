import { cn } from '@/lib/utils'

interface DiscountBadgeProps {
    percentage: number
    className?: string
}

export function DiscountBadge({ percentage, className }: DiscountBadgeProps) {
    return (
        <span
            className={cn(
                'absolute top-2 left-2 z-10 bg-badge-discount text-white text-xs font-bold px-2 py-0.5 rounded-badge',
                className
            )}
        >
            {percentage}% OFF
        </span>
    )
}
