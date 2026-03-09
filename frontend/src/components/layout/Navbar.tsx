'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
import { CartDrawer } from '@/components/mall/CartDrawer'
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
    const { user, isAuthenticated, logout, isSeller, isAdmin, isModerator, isVerifiedStudent } =
        useAuthStore()
    const { getItemCount, setIsOpen } = useCartStore()
    const isMarketplace = pathname?.startsWith('/marketplace')

    // Verification Modal State
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)

    const handlePostAdClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (!isAuthenticated) return // Could handle login redirect but let's assume middleware catches it

        // If they are admin, mod, seller, or verified, they can post
        if (isAdmin() || isModerator() || isSeller() || isVerifiedStudent()) {
            // navigate to post ad (not built yet)
            console.log("Navigate to /marketplace/post")
        } else {
            // Normal unverified user
            setIsVerificationModalOpen(true)
        }
    }

    return (
        <>
            {/* Show Verification Banner only on Marketplace pages */}
            {isMarketplace && <VerificationBanner />}

            <nav className="bg-white shadow-nav sticky top-0 z-40">
                <div className="container mx-auto px-4">
                    {/* Top Row */}
                    <div className="flex items-center gap-4 h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center shrink-0 mr-4">
                            <span className="text-2xl md:text-3xl font-bold text-gray-800">Campus</span>
                            <span className="text-2xl md:text-3xl font-bold text-brand-primary">Hat</span>
                        </Link>

                        {/* Mode Toggle */}
                        <div className="relative flex w-40 md:w-52 items-center rounded-full bg-gray-100 p-1 shrink-0">
                            <div
                                className="absolute top-0 left-0 h-full w-1/2 p-0.5 transition-transform duration-300 ease-in-out"
                                style={{ transform: isMarketplace ? 'translateX(100%)' : 'translateX(0%)' }}
                            >
                                <div className="h-full w-full rounded-full bg-white shadow-sm"></div>
                            </div>
                            <Link
                                href="/"
                                className={cn(
                                    'relative z-10 w-1/2 py-1.5 text-center font-semibold rounded-full transition-colors duration-300 text-xs md:text-sm',
                                    !isMarketplace ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                                )}
                            >
                                Mall
                            </Link>
                            <Link
                                href="/marketplace"
                                className={cn(
                                    'relative z-10 w-1/2 py-1.5 text-center font-semibold rounded-full transition-colors duration-300 text-xs md:text-sm',
                                    isMarketplace ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                                )}
                            >
                                Marketplace
                            </Link>
                        </div>

                        {/* Search */}
                        <div className="flex-1 max-w-xl hidden md:block">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products, categories or brands..."
                                    className="pl-10 bg-surface-muted border-none"
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2 ml-auto">
                            {!isAuthenticated ? (
                                <Link href="/auth/login">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <User className="h-4 w-4" />
                                        <span className="hidden sm:inline">Sign In</span>
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    {isMarketplace && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="hidden md:flex gap-2 mr-2 bg-brand-primary hover:bg-brand-dark"
                                            onClick={handlePostAdClick}
                                        >
                                            <Plus className="h-4 w-4" /> Post Ad
                                        </Button>
                                    )}

                                    <Button variant="ghost" size="icon" className="relative">
                                        <Heart className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(true)}>
                                        <ShoppingCart className="h-5 w-5" />
                                        {getItemCount() > 0 && (
                                            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-600 border-white">
                                                {getItemCount()}
                                            </Badge>
                                        )}
                                    </Button>

                                    {/* User Menu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                <Avatar className="h-8 w-8">
                                                    {user?.profile_picture && (
                                                        <AvatarImage src={user.profile_picture} alt={user.full_name} />
                                                    )}
                                                    <AvatarFallback>
                                                        {user ? getInitials(user.full_name) : 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
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
                                                    <Link href="/seller/dashboard" className="gap-2">
                                                        <Store className="h-4 w-4" /> Seller Dashboard
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            {(isAdmin() || isModerator()) && (
                                                <DropdownMenuItem asChild>
                                                    <Link href="/admin/dashboard" className="gap-2">
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
                                                onClick={() => logout()}
                                                className="text-destructive gap-2"
                                            >
                                                <LogOut className="h-4 w-4" /> Logout
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <VerificationRequiredCard
                    isOpen={isVerificationModalOpen}
                    onClose={() => setIsVerificationModalOpen(false)}
                />

                {/* Global Cart Drawer */}
                <CartDrawer />
            </nav>
        </>
    )
}
