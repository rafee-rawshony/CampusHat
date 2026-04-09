'use client'

import React, { useMemo, useState } from 'react'
import {
    Wallet, ArrowUpRight, ArrowDownLeft, Clock, AlertCircle, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const unwrapData = (payload: any) => payload?.data ?? payload

const toArray = (payload: any) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.results)) return payload.results
    if (Array.isArray(payload?.data)) return payload.data
    return []
}

interface WalletTransactionRow {
    id: string
    type: string
    desc: string
    amount: number
    date: string
}

interface WalletPayoutRow {
    id: string
    method: string
    account: string
    amount: number
    status: string
    date: string
    note?: string
}

export default function SellerWalletPage() {
    const queryClient = useQueryClient()

    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
    const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'bkash' })

    const { data: walletData, isLoading: walletLoading } = useQuery({
        queryKey: ['seller-wallet-balance'],
        queryFn: () => api.get('/wallet/balance/').then((r) => unwrapData(r.data) || {}),
    })

    const { data: transactionsData, isLoading: txLoading } = useQuery({
        queryKey: ['seller-wallet-transactions'],
        queryFn: () =>
            api.get('/wallet/transactions/', { params: { page_size: 20 } }).then((r) => {
                const data = unwrapData(r.data) || {}
                return toArray(data.results)
            }),
    })

    const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
        queryKey: ['seller-payouts'],
        queryFn: () => api.get('/sellers/payouts/').then((r) => toArray(unwrapData(r.data))),
    })

    const balanceData = useMemo(() => {
        const available = Number(walletData?.balance || 0)
        const escrow = Number(walletData?.locked_balance || 0)
        const payouts = payoutsData || []
        const totalWithdrawn = payouts
            .filter((p: any) => p.status === 'completed')
            .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

        return {
            available,
            escrow,
            total_withdrawn: totalWithdrawn,
        }
    }, [walletData, payoutsData])

    const transactions = useMemo<WalletTransactionRow[]>(() => {
        return (transactionsData || []).map((txn: any) => ({
            id: txn.id,
            type: txn.transaction_type,
            desc: txn.description || txn.reason || 'Wallet transaction',
            amount: Number(txn.amount || 0),
            date: txn.created_at ? new Date(txn.created_at).toLocaleString() : '-',
        }))
    }, [transactionsData])

    const payouts = useMemo<WalletPayoutRow[]>(() => {
        return (payoutsData || []).map((payout: any) => {
            const accountSnapshot = payout.account_details_snapshot || {}
            const accountLabel =
                accountSnapshot.number ||
                accountSnapshot.account_number ||
                accountSnapshot.bank_account ||
                'Saved seller account'

            return {
                id: payout.id,
                method: payout.method,
                account: accountLabel,
                amount: Number(payout.amount || 0),
                status: payout.status,
                date: payout.created_at ? new Date(payout.created_at).toLocaleString() : '-',
                note: payout.note,
            }
        })
    }, [payoutsData])

    const isLoading = walletLoading || txLoading || payoutsLoading

    const { mutateAsync: requestPayout } = useMutation({
        mutationFn: (data: any) => api.post('/sellers/payouts/request/', data),
        onSuccess: () => {
            toast.success('Payout request submitted. Processing in 2-3 business days.')
            setIsPayoutModalOpen(false)
            setPayoutForm((prev) => ({ ...prev, amount: '' }))
            queryClient.invalidateQueries({ queryKey: ['seller-wallet-balance'] })
            queryClient.invalidateQueries({ queryKey: ['seller-payouts'] })
            queryClient.invalidateQueries({ queryKey: ['seller-wallet-transactions'] })
        },
    })

    const handlePayoutRequest = () => {
        const amount = Number(payoutForm.amount)
        if (!amount || amount < 500) {
            toast.error('Minimum withdrawal amount is ৳500')
            return
        }
        if (amount > balanceData.available) {
            toast.error('Withdrawal amount exceeds available balance')
            return
        }

        requestPayout({ amount, method: payoutForm.method }).catch(() => toast.error('Failed to request payout'))
    }

    if (isLoading) {
        return <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="h-96 bg-gray-200 rounded-2xl" /><div className="h-96 bg-gray-200 rounded-2xl" /></div>
        </div>
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Wallet & Finance</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your store earnings, payouts, and transaction history.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#2D1B69] to-[#634C9F] rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl shadow-brand-primary/20 flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 filter blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400 opacity-20 rounded-full translate-y-1/3 -translate-x-1/4 filter blur-3xl" />

                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <Wallet className="w-5 h-5" />
                                <span className="font-bold uppercase tracking-wider text-sm">Available Balance</span>
                            </div>
                            <div className="text-5xl sm:text-6xl font-black tracking-tight mb-2">
                                ৳{balanceData.available.toLocaleString()}
                            </div>
                            <p className="text-sm font-medium text-white/80 max-w-sm">Funds available for immediate withdrawal to your preferred payment method.</p>
                        </div>
                        <Button
                            onClick={() => setIsPayoutModalOpen(true)}
                            className="bg-white text-brand-primary hover:bg-gray-100 font-extrabold h-14 px-8 rounded-2xl shadow-lg w-full sm:w-auto shrink-0 transition-transform active:scale-95"
                        >
                            Request Payout
                        </Button>
                    </div>
                </div>

                <div className="col-span-1 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full" />
                        <Clock className="w-6 h-6 text-amber-500 mb-2 relative z-10" />
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider relative z-10">Locked in Escrow</p>
                        <p className="text-2xl font-black text-gray-900 mt-1 relative z-10">৳{balanceData.escrow.toLocaleString()}</p>
                        <p className="text-[11px] font-medium text-gray-400 mt-2 relative z-10">Clears once orders are delivered</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full" />
                        <ArrowUpRight className="w-6 h-6 text-emerald-500 mb-2 relative z-10" />
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider relative z-10">Total Withdrawn</p>
                        <p className="text-2xl font-black text-gray-900 mt-1 relative z-10">৳{balanceData.total_withdrawn.toLocaleString()}</p>
                        <p className="text-[11px] font-medium text-gray-400 mt-2 relative z-10">Lifetime earnings transferred</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
                        <h2 className="text-lg font-black text-gray-900">Recent Transactions</h2>
                        <Button variant="outline" size="sm" className="font-bold text-gray-500 border-gray-200">Latest 20</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {transactions.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No transactions found.</div>
                        ) : transactions.map(txn => (
                            <div key={txn.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${txn.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        {txn.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm max-w-[200px] sm:max-w-xs truncate">{txn.desc}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{txn.id} • {txn.date}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <p className={`font-black ${txn.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                        {txn.type === 'credit' ? '+' : '-'}৳{txn.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
                        <h2 className="text-lg font-black text-gray-900">Payout Requests</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {payouts.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No payout requests found.</div>
                        ) : payouts.map(payout => (
                            <div key={payout.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                        {payout.method === 'bank' ? <Building2 className="w-5 h-5 text-gray-500" /> : <Wallet className="w-5 h-5 text-brand-primary" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm flex gap-2 items-center capitalize">
                                            {payout.method}
                                            <Badge variant="outline" className={`h-5 text-[10px] uppercase font-bold tracking-wider
                                                ${payout.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                ${payout.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                ${payout.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                            `}>
                                                {payout.status}
                                            </Badge>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{payout.account} • {payout.date}</p>
                                        {payout.note && <p className="text-xs text-red-500 mt-1 font-medium">{payout.note}</p>}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-black text-gray-900">৳{payout.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogTitle className="font-black text-xl text-center">Withdraw Funds</DialogTitle>
                    <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 my-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-brand-primary uppercase tracking-wider">Available Balance</span>
                        <span className="font-black text-xl text-brand-primary">৳{balanceData.available.toLocaleString()}</span>
                    </div>

                    <div className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label className="font-bold">Withdrawal Amount (৳) <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                placeholder="Min 500"
                                value={payoutForm.amount}
                                onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                className="h-12 font-black text-lg bg-gray-50 focus-visible:bg-white"
                            />
                            {Number(payoutForm.amount) > balanceData.available && (
                                <p className="text-xs text-red-500 font-bold flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> Amount exceeds available balance.</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold">Payment Method <span className="text-red-500">*</span></Label>
                                <Select value={payoutForm.method} onValueChange={v => setPayoutForm({ ...payoutForm, method: v })}>
                                    <SelectTrigger className="h-12 bg-gray-50 focus:bg-white">
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bkash">bKash Mobile Banking</SelectItem>
                                        <SelectItem value="nagad">Nagad Mobile Banking</SelectItem>
                                        <SelectItem value="rocket">Rocket Mobile Banking</SelectItem>
                                        <SelectItem value="bank">Bank Transfer (EFTN)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-gray-500">
                                Payout will be sent to your seller profile payment details. Update those details in seller profile if needed.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 flex-col sm:flex-col gap-3">
                        <Button
                            onClick={handlePayoutRequest}
                            disabled={!payoutForm.amount || Number(payoutForm.amount) > balanceData.available}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold h-12 w-full text-base shadow-lg shadow-brand-primary/20"
                        >
                            Request ৳{payoutForm.amount || '0'} Payout
                        </Button>
                        <Button variant="ghost" onClick={() => setIsPayoutModalOpen(false)} className="font-bold text-gray-500 w-full hover:bg-transparent hover:text-gray-900">
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
