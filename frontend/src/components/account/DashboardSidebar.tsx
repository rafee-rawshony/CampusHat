'use client'

/**
 * Daraz-style sidebar navigation for the user dashboard.
 *
 * Renders grouped sections: Manage My Account, My Orders, Reviews,
 * Wishlist & Followed Stores. Each item highlights when its route
 * matches the current pathname.
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    User as UserIcon,
    MapPin,
    CreditCard,
    Package,
    RotateCcw,
    XCircle,
    Star,
    Heart,
    Store,
    Grid,
    ShieldCheck,
    LogOut,
    ShoppingCart,
    ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { absoluteMediaUrl } from '@/services/upload.service'

// One entry in the sidebar — "My Profile", "Address Book", etc.
type Item = { label: string; href: string; icon: React.ElementType }

// Section group with a heading and a list of items.
type Section = { title: string; items: Item[] }

const SECTIONS: Section[] = [
    {
        title: 'Manage My Account',
        items: [
            { label: 'My Profile', href: '/account', icon: UserIcon },
            { label: 'Address Book', href: '/account/addresses', icon: MapPin },
            { label: 'My Payment Options', href: '/account/payments', icon: CreditCard },
        ],
    },
    {
        title: 'My Orders',
        items: [
            { label: 'My Orders', href: '/account/orders', icon: Package },
            { label: 'My Returns', href: '/account/returns', icon: RotateCcw },
            { label: 'My Cancellations', href: '/account/cancellations', icon: XCircle },
        ],
    },
    {
        title: 'My Reviews',
        items: [
            { label: 'My Reviews', href: '/account/reviews', icon: Star },
        ],
    },
    {
        title: 'Wishlist & Followed Stores',
        items: [
            { label: 'My Wishlist', href: '/wishlist', icon: Heart },
            { label: 'Followed Stores', href: '/account/followed-stores', icon: Store },
        ],
    },
]

// Marketplace block — only relevant for users who can post / want to verify.
const MARKETPLACE_SECTION: Section = {
    title: 'Marketplace',
    items: [
        { label: 'My Listings', href: '/account/listings', icon: Grid },
        { label: 'Verification', href: '/account/verify', icon: ShieldCheck },
    ],
}

export function DashboardSidebar() {
    const pathname = usePathname() || ''
    const router = useRouter()
    const { user, logout } = useAuthStore()
    const { setIsOpen: setCartOpen, getItemCount } = useCartStore()
    const cartCount = getItemCount()

    if (!user) return null

    // Profile completion percentage drives the progress ring at the top.
    const completion = user.profile_completion_percent ?? 0
    const displayName =
        (user.first_name && user.last_name)
            ? `${user.first_name} ${user.last_name}`
            : user.full_name

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    const renderItem = (item: Item) => {
        // Highlight an item when the user is on its route or a child route.
        const Icon = item.icon
        const isActive = pathname === item.href ||
            (item.href !== '/account' && pathname.startsWith(item.href + '/'))
        return (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors group',
                    isActive
                        ? 'text-brand-primary font-bold bg-brand-light/40 border-l-2 border-brand-primary -ml-px'
                        : 'text-gray-600 hover:text-brand-primary border-l-2 border-transparent -ml-px',
                )}
            >
                <Icon className={cn(
                    'h-4 w-4',
                    isActive ? 'text-brand-primary' : 'text-gray-400 group-hover:text-brand-primary',
                )} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-brand-primary" />}
            </Link>
        )
    }

    return (
        <aside className="w-full md:w-[280px] shrink-0 space-y-4">
            {/* User card with avatar + completion */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <Link href="/account" className="flex items-center gap-3 group">
                    <Avatar className="h-14 w-14 border-2 border-white ring-2 ring-brand-light shadow-sm group-hover:ring-brand-primary/30 transition-all">
                        {user.profile_picture ? (
                            <AvatarImage src={absoluteMediaUrl(user.profile_picture)} alt={displayName} className="object-cover" />
                        ) : (
                            <AvatarFallback className="bg-gradient-to-br from-brand-primary to-brand-dark text-white text-base font-bold">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">Hello,</p>
                        <p className="font-semibold text-gray-900 truncate group-hover:text-brand-primary transition-colors">
                            {displayName}
                        </p>
                        <Link
                            href="/account"
                            className="text-[11px] text-brand-primary hover:underline font-medium"
                        >
                            Edit Profile
                        </Link>
                    </div>
                </Link>

                {/* Profile completion bar */}
                {completion < 100 && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-500">Profile completion</span>
                            <span className="font-bold text-brand-primary">{completion}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand-primary to-brand-dark transition-all"
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick action: cart — opens the existing cart drawer */}
            <button
                onClick={() => setCartOpen(true)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3.5 hover:border-brand-primary/30 hover:shadow-md transition-all group"
            >
                <div className="h-9 w-9 rounded-lg bg-brand-light flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-brand-primary" />
                </div>
                <span className="text-sm font-semibold text-gray-700 flex-1 text-left">My Cart</span>
                {cartCount > 0 && (
                    <span className="bg-brand-primary text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                        {cartCount}
                    </span>
                )}
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-brand-primary transition-colors" />
            </button>

            {/* Sections */}
            {SECTIONS.map((section) => (
                <div
                    key={section.title}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    <h3 className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                        {section.title}
                    </h3>
                    <nav className="pb-2">
                        {section.items.map(renderItem)}
                    </nav>
                </div>
            ))}

            {/* Marketplace block */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h3 className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    {MARKETPLACE_SECTION.title}
                </h3>
                <nav className="pb-2">
                    {MARKETPLACE_SECTION.items.map(renderItem)}
                </nav>
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3.5 flex items-center gap-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
            >
                <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <LogOut className="h-4 w-4 text-red-500" />
                </div>
                Logout
            </button>
        </aside>
    )
}
