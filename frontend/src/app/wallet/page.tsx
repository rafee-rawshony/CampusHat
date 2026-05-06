'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { TransactionTable } from '@/components/seller/wallet/TransactionTable'
import { Wallet, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function WalletPage() {
    const router = useRouter()
    const { isSeller, isAdmin, isModerator, _hasHydrated } = useAuthStore()

    // Sellers have a dedicated wallet page with payout features
    useEffect(() => {
        if (!_hasHydrated) return
        if (isSeller() || isAdmin() || isModerator()) {
            router.replace('/dashboard/seller/wallet')
        }
    }, [_hasHydrated, isSeller, isAdmin, isModerator, router])

    const { data: balance, isLoading } = useQuery({
        queryKey: ['wallet-balance'],
        queryFn: () => api.get('/wallet/balance/').then(r => r.data?.data || r.data),
        staleTime: 30_000,
    })

    // Don't render wallet UI while redirecting sellers
    if (!_hasHydrated || isSeller() || isAdmin() || isModerator()) return null

    const available = Number(balance?.available_balance || 0)
    const locked = Number(balance?.locked_balance || 0)

    return (
        <div className="min-h-screen bg-[#F5F5F5]">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                {/* Page header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
                    <p className="text-sm text-gray-500 mt-1">Your CampusHat balance and transaction history</p>
                </div>

                {/* Balance card */}
                {isLoading ? (
                    <div className="h-[160px] bg-gray-200 rounded-2xl animate-pulse" />
                ) : (
                    <div className="bg-gradient-to-br from-[#4C3B8A] to-[#2D1B69] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 blur-sm" />

                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-white/70 text-sm font-medium">Available Balance</p>
                                <p className="text-4xl font-black text-white mt-1">
                                    ৳{available.toLocaleString()}
                                </p>
                                {locked > 0 && (
                                    <p className="text-white/60 text-xs mt-1">
                                        ৳{locked.toLocaleString()} held in escrow
                                    </p>
                                )}
                            </div>
                            <Wallet className="w-10 h-10 text-white/30 mt-1" />
                        </div>

                        <div className="relative z-10 mt-5">
                            <a href="#transactions">
                                <Button className="bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl text-sm border border-white/20 transition-colors">
                                    <Plus className="w-4 h-4 mr-2" /> Transaction History
                                </Button>
                            </a>
                        </div>
                    </div>
                )}

                {/* Transaction history */}
                <TransactionTable />
            </div>
        </div>
    )
}
