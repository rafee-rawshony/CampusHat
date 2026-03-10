'use client'

import React, { useState, useEffect } from 'react'
import {
    Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, AlertCircle, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth.store'

export default function SellerWalletPage() {
    const { user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)

    // Wallet State
    const [balanceData, setBalanceData] = useState({ available: 0, escrow: 0, total_withdrawn: 0 })
    const [transactions, setTransactions] = useState<any[]>([])
    const [payouts, setPayouts] = useState<any[]>([])

    // Payout Modal State
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
    const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'bkash', account: (user as any)?.phone_number || '' })

    useEffect(() => {
        // Mock API Fetch
        setTimeout(() => {
            setBalanceData({
                available: 45000,
                escrow: 12500, // Locked in pending/shipped orders
                total_withdrawn: 105000
            })

            setTransactions([
                { id: 'TXN-005', type: 'credit', desc: 'Order ORD-100230 Cleared', amount: 105000, date: '2024-06-25 10:30' },
                { id: 'TXN-004', type: 'debit', desc: 'Withdrawal to bKash', amount: 50000, date: '2024-06-20 14:15' },
                { id: 'TXN-003', type: 'credit', desc: 'Order ORD-100225 Cleared', amount: 450, date: '2024-06-18 09:00' },
                { id: 'TXN-002', type: 'debit', desc: 'Platform Fee (ORD-100225)', amount: 22, date: '2024-06-18 09:00' },
            ])

            setPayouts([
                { id: 'PAY-004', method: 'bKash', account: '01711***111', amount: 50000, status: 'completed', date: '2024-06-20 14:15' },
                { id: 'PAY-003', method: 'Nagad', account: '01822***222', amount: 25000, status: 'completed', date: '2024-06-01 10:00' },
                { id: 'PAY-002', method: 'Bank Transfer', account: 'DBBL ***444', amount: 30000, status: 'rejected', date: '2024-05-15 16:30', note: 'Invalid account routing' }
            ])

            setIsLoading(false)
        }, 600)
    }, [])

    const handlePayoutRequest = () => {
        const amount = Number(payoutForm.amount)
        if (!amount || amount < 500) {
            toast.error("Minimum withdrawal amount is ৳500")
            return
        }
        if (amount > balanceData.available) {
            toast.error("Withdrawal amount exceeds available balance")
            return
        }
        if (!payoutForm.account) {
            toast.error("Please provide the account number")
            return
        }

        // Mock Submission
        setBalanceData(prev => ({ ...prev, available: prev.available - amount }))
        setPayouts([{
            id: `PAY-00${payouts.length + 5}`, method: payoutForm.method, account: payoutForm.account,
            amount: amount, status: 'pending', date: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }, ...payouts])

        toast.success(`৳${amount} payout requested successfully!`)
        setIsPayoutModalOpen(false)
        setPayoutForm({ ...payoutForm, amount: '' })
    }

    if (isLoading) {
        return <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="h-96 bg-gray-200 rounded-2xl" /><div className="h-96 bg-gray-200 rounded-2xl" /></div>
        </div>
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900">Wallet & Finance</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your store earnings, payouts, and transaction history.</p>
            </div>

            {/* Balance Overview Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Available Balance (Primary) */}
                <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#2D1B69] to-[#634C9F] rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl shadow-brand-primary/20 flex flex-col justify-between min-h-[220px]">
                    {/* Decorative Elements */}
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

                {/* Secondary Balances */}
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

            {/* Split View: Transactions | Payouts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transaction History */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
                        <h2 className="text-lg font-black text-gray-900">Recent Transactions</h2>
                        <Button variant="outline" size="sm" className="font-bold text-gray-500 border-gray-200">Export PDF</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {transactions.map(txn => (
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
                        <div className="p-5 text-center">
                            <Button variant="ghost" className="text-brand-primary font-bold text-sm w-full">Load More Transactions</Button>
                        </div>
                    </div>
                </div>

                {/* Payout History */}
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
                                        {payout.method === 'Bank Transfer' ? <Building2 className="w-5 h-5 text-gray-500" /> : <Wallet className="w-5 h-5 text-brand-primary" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm flex gap-2 items-center">
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

            {/* Request Payout Modal */}
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
                                        <SelectItem value="bKash">bKash Mobile Banking</SelectItem>
                                        <SelectItem value="Nagad">Nagad Mobile Banking</SelectItem>
                                        <SelectItem value="Rocket">Rocket Mobile Banking</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer (EFTN)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Account / Wallet Number <span className="text-red-500">*</span></Label>
                                <Input
                                    value={payoutForm.account}
                                    onChange={e => setPayoutForm({ ...payoutForm, account: e.target.value })}
                                    className="h-12 bg-gray-50 focus-visible:bg-white"
                                />
                                <p className="text-xs text-gray-500">Ensure this account is in your name matching your business profile.</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 flex-col sm:flex-col gap-3">
                        <Button
                            onClick={handlePayoutRequest}
                            disabled={!payoutForm.amount || Number(payoutForm.amount) > balanceData.available || !payoutForm.account}
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
