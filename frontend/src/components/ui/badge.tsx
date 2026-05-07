import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
    'inline-flex items-center rounded-badge px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'bg-brand-primary text-white',
                secondary: 'bg-secondary text-secondary-foreground',
                destructive: 'bg-destructive text-destructive-foreground',
                outline: 'text-foreground border border-surface-border',
                discount: 'bg-badge-discount text-white shadow-sm font-bold text-[10px] px-2 py-1 rounded-lg uppercase',
                instock: 'bg-green-50 text-green-700 border border-green-200 font-bold text-[10px] px-2 py-0.5 rounded-full',
                lowstock: 'bg-orange-100 text-orange-700 border border-orange-200 font-bold text-[10px] px-2 py-0.5 rounded-full',
                pending: 'bg-badge-pending text-black',
                rental: 'bg-badge-rental text-white',
                service: 'bg-badge-service text-white',
                food: 'bg-badge-food text-white',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
