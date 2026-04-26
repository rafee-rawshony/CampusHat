'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Search,
    Heart,
    ShoppingCart,
    User,
    LogOut,
    Package,
    Wallet,
    LayoutDashboard,
    Shield,
    Store,
    Plus,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { VerificationRequiredCard, VerificationBanner } from '@/components/auth/VerificationRequiredCard'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'
import { CartDrawer } from '@/components/mall/CartDrawer'
import { MobileDrawer } from '@/components/layout/MobileDrawer'
import { MobileSearchOverlay } from '@/components/layout/MobileSearchOverlay'
import { Input } from '@/components/ui/input'
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

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
        if ('key' in e && e.key !== 'Enter') return
        if (!searchQuery.trim()) return

        if (isMarketplace) {
            router.push(`/marketplace/explorer?q=${encodeURIComponent(searchQuery.trim())}`)
        } else {
            router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

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
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap md:flex-nowrap justify-between items-center gap-y-4">
                    {/* Left: Logo + Toggle */}
                    <div className="flex items-center">
                        <MobileDrawer />

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

                    {/* Center: Search */}
                    <div className="order-last md:order-none w-full md:flex-1 md:mx-6">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                placeholder="Search for products, categories or brands..."
                                className="w-full border border-gray-300 rounded-md py-2.5 pl-4 pr-12 focus:ring-[#4C3B8A] focus:border-[#4C3B8A] outline-none text-sm"
                            />
                            <button onClick={handleSearch} className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <Search className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        {/* Mobile search icon only */}
                        <Button variant="ghost" size="icon" className="md:hidden absolute right-16 top-4" onClick={() => setIsSearchOpen(true)}>
                            <Search className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Right: Auth + Actions */}
                    <div className="flex items-center space-x-3 md:space-x-6 ml-auto md:ml-0">
                        {/* Skeleton placeholder while Zustand hydrates from localStorage */}
                        {!_hasHydrated ? (
                            <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
                        ) : isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center text-gray-600 hover:text-[#4C3B8A] py-2">
                                        <User className="w-6 h-6 md:w-7 md:h-7" />
                                        <span className="text-sm ml-2 hidden lg:inline font-semibold">
                                            Hi, {user?.full_name?.split(' ')[0] || 'User'}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <p className="font-medium">{user?.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/orders" className="gap-2">
                                            <Package className="h-4 w-4" /> My Orders
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/wallet" className="gap-2">
                                            <Wallet className="h-4 w-4" /> Wallet
                                        </Link>
                                    </DropdownMenuItem>
                                    {isSeller() && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/seller" className="gap-2">
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
                            <Link
                                href="/auth/login"
                                className="flex items-center text-gray-600 hover:text-[#4C3B8A]"
                            >
                                <User className="w-6 h-6 md:w-7 md:h-7" />
                                <span className="text-sm ml-2 hidden lg:inline font-semibold">Sign In</span>
                            </Link>
                        )}

                        {/* Mall mode: Heart + Cart */}
                        {!isMarketplace ? (
                            <>
                                <Link href="/wishlist" className="relative text-gray-600 hover:text-[#4C3B8A]">
                                    <Heart className="w-6 h-6 md:w-7 md:h-7" />
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">0</span>
                                </Link>
                                <button onClick={() => setIsOpen(true)} className="relative flex items-center text-gray-600 hover:text-[#4C3B8A]">
                                    <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
                                    <span className="absolute -top-1 -right-2 bg-[#4C3B8A] text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">{getItemCount()}</span>
                                </button>
                            </>
                        ) : (
                            /* Marketplace mode: Post Ad button */
                            <button
                                onClick={isAuthenticated ? handlePostAdClick : () => router.push('/auth/login')}
                                className="bg-[#4C3B8A] text-white font-bold py-2 px-3 md:px-4 rounded-md hover:bg-[#2D1B69] transition-colors flex items-center text-xs md:text-sm whitespace-nowrap"
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

