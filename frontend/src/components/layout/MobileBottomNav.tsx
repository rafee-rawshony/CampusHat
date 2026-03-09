'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Store, ShoppingBag, ShoppingCart, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const items = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Mall', href: '/shop', icon: Store },
    { label: 'Market', href: '/marketplace', icon: ShoppingBag },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: true },
    { label: 'Profile', href: '/profile', icon: User },
]

export function MobileBottomNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-surface-border sm:hidden">
            <nav className="flex items-center justify-around h-16">
                {items.map((item) => {
                    const Icon = item.icon
                    const isActive =
                        item.href === '/'
                            ? pathname === '/'
                            : pathname?.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-1 py-2 px-3 transition-colors relative',
                                isActive
                                    ? 'text-brand-primary'
                                    : 'text-muted-foreground'
                            )}
                        >
                            <div className="relative">
                                <Icon className="h-5 w-5" />
                                {item.badge && (
                                    <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[9px]">
                                        0
                                    </Badge>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
