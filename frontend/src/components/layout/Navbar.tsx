'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Search,
    Heart,
    ShoppingCart,
    LogOut,
    Package,
    Wallet,
    LayoutDashboard,
    Shield,
    Store,
    Plus,
    UserCircle,
    MapPin,
    CreditCard,
    MessageSquare,
    Star,
    ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { VerificationRequiredCard, VerificationBanner } from '@/components/auth/VerificationRequiredCard'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'
import { CartDrawer } from '@/components/mall/CartDrawer'
import { MobileDrawer } from '@/components/layout/MobileDrawer'
import { MobileSearchOverlay } from '@/components/layout/MobileSearchOverlay'
import { SearchAutocomplete } from '@/components/layout/SearchAutocomplete'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { CampusSwitcher } from '@/components/layout/CampusSwitcher'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { absoluteMediaUrl } from '@/services/upload.service'

export function Navbar() {
    const pathname = usePathname()
    const { user, isAuthenticated, _hasHydrated, logout, isSeller, isAdmin, isModerator, canAccessMarketplace } =
        useAuthStore()
    const { getItemCount, setIsOpen } = useCartStore()
    const isMarketplace = pathname?.startsWith('/marketplace')
    const router = useRouter()

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    // Mobile Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    const [searchQuery, setSearchQuery] = useState('')

    // Verification Modal State
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)

    const handlePostAdClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (!isAuthenticated) {
            router.push('/auth/login?redirect=/marketplace/post')
            return
        }
        // Only verified students/faculty and admins/mods can post
        if (canAccessMarketplace()) {
            router.push('/marketplace/post')
        } else {
            setIsVerificationModalOpen(true)
        }
    }

    return (
        <>
            {/* Show Verification Banner only on Marketplace pages */}
            {isMarketplace && <VerificationBanner />}

            {/* Main Navbar — matches demo Header.tsx */}
            <div className="border-b border-gray-200 bg-white">
                {/* === MOBILE TOP ROW (under sm) === */}
                <div className="sm:hidden px-3 pt-2.5 pb-2 flex items-center gap-2">
                    <MobileDrawer />
                    <Link href="/" className="text-xl font-bold text-gray-800 mr-1 truncate">
                        <span className="text-gray-800">Campus</span><span className="text-[#4C3B8A]">Hat</span>
                    </Link>
                    <div className="ml-auto flex items-center gap-1">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            aria-label="Search"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        {isAuthenticated && <NotificationBell />}
                        {isMarketplace ? (
                            <button
                                onClick={isAuthenticated ? handlePostAdClick : () => router.push('/auth/login')}
                                aria-label="Post ad"
                                className="ml-1 h-9 px-3 inline-flex items-center gap-1 bg-[#4C3B8A] text-white font-bold rounded-full text-xs active:scale-95 transition-transform"
                            >
                                <Plus className="w-3.5 h-3.5" /> Post
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsOpen(true)}
                                aria-label="Cart"
                                className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {getItemCount() > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-[#4C3B8A] text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center ring-2 ring-white">
                                        {getItemCount()}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* === MOBILE SECOND ROW — Mode toggle + campus switcher === */}
                <div className="sm:hidden px-3 pb-2.5 flex items-center gap-2">
                    <div className="relative flex flex-1 items-center rounded-full bg-gray-100 p-1">
                        <div
                            className="absolute top-0 left-0 h-full w-1/2 p-0.5 transition-transform duration-300 ease-in-out"
                            style={{ transform: isMarketplace ? 'translateX(100%)' : 'translateX(0%)' }}
                        >
                            <div className="h-full w-full rounded-full bg-white shadow-sm"></div>
                        </div>
                        <Link
                            href="/"
                            className={cn(
                                'relative z-10 w-1/2 py-1.5 text-center font-semibold rounded-full text-xs transition-colors',
                                !isMarketplace ? 'text-[#4C3B8A]' : 'text-gray-500'
                            )}
                        >
                            Mall
                        </Link>
                        <Link
                            href="/marketplace"
                            className={cn(
                                'relative z-10 w-1/2 py-1.5 text-center font-semibold rounded-full text-xs transition-colors',
                                isMarketplace ? 'text-[#4C3B8A]' : 'text-gray-500'
                            )}
                        >
                            Marketplace
                        </Link>
                    </div>
                    {isMarketplace && (
                        <div className="shrink-0">
                            <CampusSwitcher variant="dark" />
                        </div>
                    )}
                </div>

                {/* === DESKTOP ROW (sm and up) === */}
                <div className="hidden sm:flex container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:flex-nowrap justify-between items-center gap-x-2">
                    {/* Left: Logo + Toggle */}
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl md:text-3xl font-bold text-gray-800 mr-4">
                            <span className="text-gray-800">Campus</span><span className="text-[#4C3B8A]">Hat</span>
                        </Link>

                        {/* Mode Toggle */}
                        <div className="relative flex w-40 md:w-52 items-center rounded-full bg-gray-100 p-1">
                            <div
                                className="absolute top-0 left-0 h-full w-1/2 p-0.5 transition-transform duration-300 ease-in-out"
                                style={{ transform: isMarketplace ? 'translateX(100%)' : 'translateX(0%)' }}
                            >
                                <div className="h-full w-full rounded-full bg-white shadow-md"></div>
                            </div>
                            <Link
                                href="/"
                                className={cn(
                                    'relative z-10 w-1/2 py-1.5 text-center font-semibold rounded-full transition-colors duration-300 text-xs md:text-sm',
                                    !isMarketplace ? 'text-[#4C3B8A]' : 'text-gray-500 hover:text-gray-700'
                                )}
                            >
                                Mall
                            </Link>
                            <Link
                                href="/marketplace"
                                className={cn(
                                    'relative z-10 w-1/2 py-1.5 text-center font-semibold rounded-full transition-colors duration-300 text-xs md:text-sm',
                                    isMarketplace ? 'text-[#4C3B8A]' : 'text-gray-500 hover:text-gray-700'
                                )}
                            >
                                Marketplace
                            </Link>
                        </div>
                    </div>

                    {/* Center: Search (Desktop) */}
                    <div className="order-last md:order-none w-full md:flex-1 md:mx-6 hidden md:block">
                        {isMarketplace ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            router.push(`/marketplace/explorer?q=${encodeURIComponent(searchQuery.trim())}`)
                                        }
                                    }}
                                    placeholder="Search marketplace listings..."
                                    className="w-full border border-gray-300 rounded-md py-2.5 pl-4 pr-12 focus:ring-[#4C3B8A] focus:border-[#4C3B8A] outline-none text-sm"
                                />
                                <button className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <Search className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                        ) : (
                            <SearchAutocomplete />
                        )}
                    </div>

                    {/* Right: Auth + Actions */}
                    <div className="flex items-center space-x-3 md:space-x-6 ml-auto md:ml-0">
                        {/* Skeleton placeholder while Zustand hydrates from localStorage */}
                        {!_hasHydrated ? (
                            <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
                        ) : isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="hidden md:flex items-center gap-2 text-gray-600 hover:text-[#4C3B8A] py-2 group">
                                        <Avatar className="h-8 w-8 md:h-9 md:w-9 border border-gray-200 group-hover:border-[#4C3B8A] transition-colors">
                                            {user?.profile_picture ? (
                                                <AvatarImage
                                                    src={absoluteMediaUrl(user.profile_picture)}
                                                    alt={user.full_name}
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <AvatarFallback className="bg-brand-light text-[#4C3B8A] text-xs font-bold">
                                                    {getInitials(
                                                        (user?.first_name && user?.last_name)
                                                            ? `${user.first_name} ${user.last_name}`
                                                            : user?.full_name || 'U'
                                                    )}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <span className="text-sm hidden lg:inline font-semibold">
                                            {user?.first_name || user?.full_name?.split(' ')[0] || 'User'}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuLabel className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                {user?.profile_picture ? (
                                                    <AvatarImage src={absoluteMediaUrl(user.profile_picture)} alt={user.full_name} className="object-cover" />
                                                ) : (
                                                    <AvatarFallback className="bg-brand-light text-[#4C3B8A] text-sm font-bold">
                                                        {getInitials(user?.full_name || 'U')}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{user?.full_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/account" className="gap-2">
                                            <UserCircle className="h-4 w-4" /> My Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/account/messages" className="gap-2">
                                            <MessageSquare className="h-4 w-4" /> Messages
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/account/orders" className="gap-2">
                                            <Package className="h-4 w-4" /> My Orders
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/account/addresses" className="gap-2">
                                            <MapPin className="h-4 w-4" /> Address Book
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/account/payments" className="gap-2">
                                            <CreditCard className="h-4 w-4" /> Payment Options
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/wishlist" className="gap-2">
                                            <Heart className="h-4 w-4" /> Wishlist
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/account/reviews" className="gap-2">
                                            <Star className="h-4 w-4" /> My Reviews
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/wallet" className="gap-2">
                                            <Wallet className="h-4 w-4" /> Wallet
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {user?.role === 'normal_user' && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/account/verify" className="gap-2 text-amber-700">
                                                <ShieldCheck className="h-4 w-4" /> Verify Student ID
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {isSeller() && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/seller" className="gap-2">
                                                <Store className="h-4 w-4" /> Seller Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {(isAdmin() || isModerator()) && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin" className="gap-2">
                                                {isAdmin() ? (
                                                    <LayoutDashboard className="h-4 w-4" />
                                                ) : (
                                                    <Shield className="h-4 w-4" />
                                                )}
                                                {isAdmin() ? 'Admin Panel' : 'Moderator Panel'}
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="text-destructive gap-2"
                                    >
                                        <LogOut className="h-4 w-4" /> Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-2">
                                {/* Sign In — outlined ghost button */}
                                <Link
                                    href="/auth/login"
                                    className="inline-flex items-center justify-center h-9 md:h-10 px-4 md:px-5 text-sm font-semibold text-gray-700 border border-gray-200 hover:border-[#4C3B8A] hover:text-[#4C3B8A] hover:bg-[#4C3B8A]/5 rounded-full transition-all duration-200"
                                >
                                    Sign In
                                </Link>
                                {/* Register — gradient solid with brand-color glow on hover */}
                                <Link
                                    href="/auth/register"
                                    className="hidden md:inline-flex items-center justify-center h-10 px-5 text-sm font-semibold text-white bg-gradient-to-r from-[#4C3B8A] to-[#5d4ba1] hover:shadow-lg hover:shadow-[#4C3B8A]/30 hover:-translate-y-px rounded-full transition-all duration-200"
                                >
                                    Register
                                </Link>
                            </div>
                        )}

                        {/* Desktop Bell — hidden on small screens */}
                        <div className="hidden md:block">
                            {isAuthenticated && <NotificationBell />}
                        </div>

                        {/* Mall mode: Heart + Cart — circle ghost buttons matching sign-in */}
                        {!isMarketplace ? (
                            <>
                                <Link
                                    href="/wishlist"
                                    aria-label="Wishlist"
                                    className="relative hidden md:inline-flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:text-[#4C3B8A] hover:bg-[#4C3B8A]/5 transition-all"
                                >
                                    <Heart className="w-5 h-5" />
                                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center ring-2 ring-white">0</span>
                                </Link>
                                <button
                                    onClick={() => setIsOpen(true)}
                                    aria-label="Cart"
                                    className="relative hidden md:inline-flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:text-[#4C3B8A] hover:bg-[#4C3B8A]/5 transition-all"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    <span className="absolute -top-0.5 -right-0.5 bg-[#4C3B8A] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center ring-2 ring-white">{getItemCount()}</span>
                                </button>
                            </>
                        ) : (
                            /* Marketplace mode: Post Ad button */
                            <button
                                onClick={isAuthenticated ? handlePostAdClick : () => router.push('/auth/login')}
                                className="hidden md:flex bg-[#4C3B8A] text-white font-bold py-2 px-3 md:px-4 rounded-md hover:bg-[#2D1B69] transition-colors items-center text-xs md:text-sm whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Post Ad
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <VerificationRequiredCard
                isOpen={isVerificationModalOpen}
                onClose={() => setIsVerificationModalOpen(false)}
            />

            <UpgradePrompt
                isOpen={isVerificationModalOpen && isMarketplace}
                onClose={() => setIsVerificationModalOpen(false)}
                title="Verification Required to Post Ads"
            />

            {/* Global Cart Drawer */}
            <CartDrawer />

            {/* Mobile Search Overlay */}
            <MobileSearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    )
}

