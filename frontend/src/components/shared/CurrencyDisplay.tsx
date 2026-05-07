import { cn } from '@/lib/utils'

interface CurrencyDisplayProps {
    amount: string | number
    className?: string
    strikethrough?: boolean
}

export function CurrencyDisplay({ amount, className, strikethrough }: CurrencyDisplayProps) {
    const formattedAmount = parseFloat(amount.toString()).toLocaleString()

    return (
        <span className={cn(
            "font-bold text-gray-900",
            strikethrough && "text-gray-400 line-through font-normal text-xs ml-2",
            className
        )}>
            ৳{formattedAmount}
        </span>
    )
}
