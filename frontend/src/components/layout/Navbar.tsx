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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function Navbar() {
    const pathname = usePathname()
    const { user, isAuthenticated, logout, isSeller, isAdmin, isModerator } =
        useAuthStore()
    const isMarketplace = pathname?.startsWith('/marketplace')

    return (
        <nav className="bg-white shadow-nav sticky top-0 z-40">
            <div className="container mx-auto px-4">
                {/* Top Row */}
                <div className="flex items-center gap-4 h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center shrink-0">
                        <span className="text-xl font-bold text-brand-primary">Campus</span>
                        <span className="text-xl font-bold text-brand-accent">Hat</span>
                    </Link>

                    {/* Mode Toggle */}
                    <div className="hidden sm:flex items-center bg-brand-primary rounded-btn p-1 shrink-0">
                        <Link
                            href="/"
                            className={cn(
                                'px-4 py-1.5 rounded-sm text-sm font-medium transition-all',
                                !isMarketplace
                                    ? 'bg-white text-brand-primary shadow-sm'
                                    : 'text-white/80 hover:text-white'
                            )}
                        >
                            Mall
                        </Link>
                        <Link
                            href="/marketplace"
                            className={cn(
                                'px-4 py-1.5 rounded-sm text-sm font-medium transition-all',
                                isMarketplace
                                    ? 'bg-white text-brand-primary shadow-sm'
                                    : 'text-white/80 hover:text-white'
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
                                <Button variant="ghost" size="icon" className="relative">
                                    <Heart className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="relative">
                                    <ShoppingCart className="h-5 w-5" />
                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                                        0
                                    </Badge>
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
        </nav>
    )
}
