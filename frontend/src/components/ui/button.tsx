import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-btn text-sm font-bold ring-offset-background transition-all hover:shadow-md transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:transform-none disabled:shadow-none',
    {
        variants: {
            variant: {
                default: 'bg-brand-primary text-white hover:bg-brand-dark',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-surface-border bg-white hover:bg-surface-muted hover:text-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-surface-muted hover:text-foreground',
                link: 'text-brand-primary underline-offset-4 hover:underline',
                accent: 'bg-brand-accent text-white hover:bg-brand-accent/90',
            },
            size: {
                default: 'h-11 px-6 py-2.5',
                sm: 'h-9 rounded-md px-4',
                lg: 'h-12 rounded-xl px-8',
                icon: 'h-11 w-11',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button'
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
