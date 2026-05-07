import { cn, formatCurrency, getDiscountPercentage } from '@/lib/utils'

interface CurrencyDisplayProps {
    amount: number
    originalAmount?: number
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function CurrencyDisplay({
    amount,
    originalAmount,
    size = 'md',
    className,
}: CurrencyDisplayProps) {
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl',
    }

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <span className={cn('font-bold text-currency', sizeClasses[size])}>
                {formatCurrency(amount)}
            </span>
            {originalAmount && originalAmount > amount && (
                <>
                    <span className="text-muted-foreground line-through text-sm">
                        {formatCurrency(originalAmount)}
                    </span>
                    <span className="text-badge-discount text-xs font-semibold">
                        -{getDiscountPercentage(originalAmount, amount)}%
                    </span>
                </>
            )}
        </div>
    )
}
