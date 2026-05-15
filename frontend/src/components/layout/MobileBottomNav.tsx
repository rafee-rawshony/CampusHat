'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, MessageSquare, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'

const items = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Wishlist', href: '/wishlist', icon: Heart },
    { label: 'Messages', href: '/marketplace/chat', icon: MessageSquare },
    { label: 'Cart', href: '#cart', icon: ShoppingCart, badge: true },
    { label: 'Profile', href: '/account', icon: User },
]

export function MobileBottomNav() {
    const pathname = usePathname()
    const { getItemCount, setIsOpen } = useCartStore()
    const cartCount = getItemCount()

    const isItemActive = (href: string) => {
        if (href === '/') return pathname === '/'
        if (href === '/account') return pathname === '/account'
        return pathname?.startsWith(href) ?? false
    }

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bottom-nav"
            style={{
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'saturate(180%) blur(12px)',
                WebkitBackdropFilter: 'saturate(180%) blur(12px)',
                borderTop: '1px solid rgb(0 0 0 / 0.06)',
                boxShadow: '0 -4px 16px -8px rgb(0 0 0 / 0.08)',
            }}
        >
            <nav className="flex items-stretch justify-around h-[60px] px-1">
                {items.map((item) => {
                    const Icon = item.icon
                    const isCart = item.label === 'Cart'
                    const isActive = !isCart && isItemActive(item.href)

                    const content = (
                        <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full relative">
                            {/* Active pill background */}
                            {isActive && (
                                <span
                                    className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-7 rounded-full bg-brand-primary/10"
                                    aria-hidden="true"
                                />
                            )}
                            <div className="relative z-10">
                                <Icon
                                    className={cn(
                                        'transition-all duration-200',
                                        isActive ? 'w-[22px] h-[22px]' : 'w-[20px] h-[20px]'
                                    )}
                                    strokeWidth={isActive ? 2.4 : 2}
                                />
                                {item.badge && cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center text-[9px] font-bold text-white bg-brand-primary rounded-full ring-2 ring-white">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-[10px] leading-none transition-all duration-200 z-10',
                                    isActive ? 'font-bold' : 'font-medium'
                                )}
                            >
                                {item.label}
                            </span>
                        </div>
                    )

                    if (isCart) {
                        return (
                            <button
                                key={item.label}
                                onClick={() => setIsOpen(true)}
                                aria-label="Open cart"
                                className="flex-1 flex items-center justify-center text-gray-500 active:scale-95 transition-transform"
                            >
                                {content}
                            </button>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            className={cn(
                                'flex-1 flex items-center justify-center active:scale-95 transition-all',
                                isActive ? 'text-brand-primary' : 'text-gray-500'
                            )}
                        >
                            {content}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
