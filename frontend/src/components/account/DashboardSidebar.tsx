'use client'

/**
 * Daraz-style sidebar navigation for the user dashboard.
 *
 * Renders grouped sections: Manage My Account, My Orders, Reviews,
 * Wishlist & Followed Stores. Each item highlights when its route
 * matches the current pathname.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'

// One entry in the sidebar — "My Profile", "Address Book", etc.
type Item = { label: string; href: string; icon: React.ElementType }

// Section group with a heading and a list of items.
type Section = { title: string; icon: React.ElementType; items: Item[] }

const SECTIONS: Section[] = [
    {
        title: 'Manage My Account',
        icon: UserIcon,
        items: [
            { label: 'My Profile', href: '/account', icon: UserIcon },
            { label: 'Address Book', href: '/account/addresses', icon: MapPin },
            { label: 'My Payment Options', href: '/account/payments', icon: CreditCard },
        ],
    },
    {
        title: 'My Orders',
        icon: Package,
        items: [
            { label: 'My Orders', href: '/account/orders', icon: Package },
            { label: 'My Returns', href: '/account/returns', icon: RotateCcw },
            { label: 'My Cancellations', href: '/account/cancellations', icon: XCircle },
        ],
    },
    {
        title: 'My Reviews',
        icon: Star,
        items: [
            { label: 'My Reviews', href: '/account/reviews', icon: Star },
        ],
    },
    {
        title: 'Wishlist & Followed Stores',
        icon: Heart,
        items: [
            { label: 'My Wishlist', href: '/wishlist', icon: Heart },
            { label: 'Followed Stores', href: '/account/followed-stores', icon: Store },
        ],
    },
]

// Marketplace-related extras shown only when relevant
const MARKETPLACE_SECTION: Section = {
    title: 'Marketplace',
    icon: Grid,
    items: [
        { label: 'My Listings', href: '/account/listings', icon: Grid },
        { label: 'Verification', href: '/account/verify', icon: ShieldCheck },
    ],
}

export function DashboardSidebar() {
    const pathname = usePathname() || ''
    const router = useRouter()
    const { user, logout } = useAuthStore()

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
        // Highlight a sidebar item when the user is on its route or a child route.
        const Icon = item.icon
        const isActive = pathname === item.href ||
            (item.href !== '/account' && pathname.startsWith(item.href + '/'))
        return (
            <Link
                key={item.href}
                href={item.href}
                className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors',
                    isActive
                        ? 'bg-brand-light text-brand-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
            >
                <Icon className="h-4 w-4" />
                {item.label}
            </Link>
        )
    }

    return (
        <aside className="w-full md:w-[260px] shrink-0 space-y-4">
            {/* User card with avatar + completion */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 border border-gray-100 shadow-sm">
                        {user.profile_picture ? (
                            <AvatarImage src={user.profile_picture} alt={displayName} className="object-cover" />
                        ) : (
                            <AvatarFallback className="bg-brand-light text-brand-primary text-base font-bold">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500">Hello,</p>
                        <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                    </div>
                </div>

                {/* Profile completion bar — only when below 100% */}
                {completion < 100 && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Profile completion</span>
                            <span className="font-semibold text-brand-primary">{completion}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-primary transition-all"
                                style={{ width: `${completion}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Sections */}
            {SECTIONS.map((section) => {
                const SectionIcon = section.icon
                return (
                    <div
                        key={section.title}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
                            <SectionIcon className="h-4 w-4 text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-800">{section.title}</h3>
                        </div>
                        <nav className="p-2">
                            {section.items.map(renderItem)}
                        </nav>
                    </div>
                )
            })}

            {/* Marketplace block */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
                    <MARKETPLACE_SECTION.icon className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-800">{MARKETPLACE_SECTION.title}</h3>
                </div>
                <nav className="p-2">
                    {MARKETPLACE_SECTION.items.map(renderItem)}
                </nav>
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3 flex items-center gap-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
                <LogOut className="h-4 w-4" />
                Logout
            </button>
        </aside>
    )
}
