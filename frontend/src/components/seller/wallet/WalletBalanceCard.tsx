'use client'

import React from 'react'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WalletBalanceCardProps {
    balance: any
    isLoading: boolean
    onRequestPayout: () => void
}

export function WalletBalanceCard({ balance, isLoading, onRequestPayout }: WalletBalanceCardProps) {
    const available = balance?.available_balance || 0
    const locked = balance?.locked_balance || 0
    const canPayout = available >= 500

    if (isLoading) {
        return <div className="h-[180px] bg-gray-200 rounded-2xl animate-pulse mb-6" />
    }

    return (
        <div className="bg-gradient-to-br from-[#4C3B8A] to-[#2D1B69] rounded-2xl p-6 text-white mb-6 shadow-lg relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 blur-sm" />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-white/70 text-sm font-medium">Available Balance</p>
                    <p className="text-4xl font-black text-white mt-1">৳{Number(available).toLocaleString()}</p>
                    <p className="text-white/60 text-xs mt-1">
                        ৳{Number(locked).toLocaleString()} in escrow
                        <span className="ml-1 cursor-help" title="Held until orders are delivered">ⓘ</span>
                    </p>
                </div>
                <Wallet className="w-10 h-10 text-white/30 mt-1" />
            </div>

            <div className="relative z-10 flex gap-3 mt-5">
                <Button
                    onClick={onRequestPayout}
                    disabled={!canPayout}
                    className="bg-white text-[#4C3B8A] hover:bg-gray-100 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!canPayout ? 'Minimum payout is ৳500' : undefined}
                >
                    Request Payout
                </Button>
                <a href="#transactions">
                    <Button className="bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl text-sm border border-white/20 transition-colors">
                        Transaction History
                    </Button>
                </a>
            </div>
        </div>
    )
}
