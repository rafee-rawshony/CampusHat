'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { WalletBalanceCard } from '@/components/seller/wallet/WalletBalanceCard'
import { PayoutModal } from '@/components/seller/wallet/PayoutModal'
import { TransactionTable } from '@/components/seller/wallet/TransactionTable'

export default function SellerWalletPage() {
    const [showPayout, setShowPayout] = useState(false)

    const { data: balance, isLoading } = useQuery({
        queryKey: ['seller-wallet'],
        queryFn: () => api.get('/wallet/balance/').then(r => r.data?.data || r.data),
        staleTime: 30_000,
    })

    return (
        <div>
            <h1 className="font-bold text-xl text-gray-900 mb-6">Wallet & Payouts</h1>

            <WalletBalanceCard
                balance={balance}
                isLoading={isLoading}
                onRequestPayout={() => setShowPayout(true)}
            />

            <TransactionTable />

            <PayoutModal
                open={showPayout}
                onClose={() => setShowPayout(false)}
                availableBalance={balance?.available_balance || 0}
            />
        </div>
    )
}
