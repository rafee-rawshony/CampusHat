'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/formatDate'
import { cn } from '@/lib/utils'

const TYPE_MAP: Record<string, { label: string; className: string }> = {
    credit_sale:    { label: 'Sale',      className: 'bg-green-100 text-green-700' },
    debit_payout:   { label: 'Payout',    className: 'bg-blue-100 text-blue-700' },
    credit_topup:   { label: 'Top Up',    className: 'bg-teal-100 text-teal-700' },
    debit_purchase: { label: 'Purchase',  className: 'bg-gray-100 text-gray-600' },
    lock_escrow:    { label: 'Escrow',    className: 'bg-yellow-100 text-yellow-700' },
    release_escrow: { label: 'Released',  className: 'bg-green-100 text-green-600' },
}

const CREDIT_TYPES = ['credit_sale', 'credit_topup', 'release_escrow']

export function TransactionTable() {
    const [filter, setFilter] = useState<'all' | 'credits' | 'debits'>('all')
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ['seller-transactions', filter, page],
        queryFn: () =>
            api.get(`/wallet/transactions/?page=${page}&page_size=15&ordering=-created_at`).then(r => r.data),
        staleTime: 60_000,
    })

    const transactions: any[] = (data?.results || data || []).filter((t: any) => {
        if (filter === 'credits') return CREDIT_TYPES.includes(t.type)
        if (filter === 'debits') return !CREDIT_TYPES.includes(t.type)
        return true
    })

    const totalPages = Math.ceil((data?.count || 0) / 15)

    return (
        <div id="transactions">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Transaction History</h3>

                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {(['all', 'credits', 'debits'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1) }}
                            className={cn(
                                'px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors',
                                filter === f ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hidden md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                            {['Date', 'Type', 'Description', 'Amount', 'Balance After'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading
                            ? Array(5).fill(0).map((_, i) => (
                                  <tr key={i} className="border-b border-gray-50">
                                      {Array(5).fill(0).map((_, j) => (
                                          <td key={j} className="px-4 py-4">
                                              <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                                          </td>
                                      ))}
                                  </tr>
                              ))
                            : transactions.length === 0
                            ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                                        No transactions found
                                    </td>
                                </tr>
                            )
                            : transactions.map((tx: any) => {
                                  const isCredit = CREDIT_TYPES.includes(tx.type)
                                  const typeInfo = TYPE_MAP[tx.type] || { label: tx.type, className: 'bg-gray-100 text-gray-500' }
                                  return (
                                      <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                          <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(tx.created_at)}</td>
                                          <td className="px-4 py-3">
                                              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', typeInfo.className)}>
                                                  {typeInfo.label}
                                              </span>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-600 line-clamp-1 max-w-[200px]">{tx.description || '—'}</td>
                                          <td className={cn('px-4 py-3 font-semibold text-sm', isCredit ? 'text-green-600' : 'text-red-500')}>
                                              {isCredit ? '+' : '-'}৳{Number(tx.amount).toLocaleString()}
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                                              ৳{Number(tx.balance_after || 0).toLocaleString()}
                                          </td>
                                      </tr>
                                  )
                              })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
                {transactions.map((tx: any) => {
                    const isCredit = CREDIT_TYPES.includes(tx.type)
                    const typeInfo = TYPE_MAP[tx.type] || { label: tx.type, className: 'bg-gray-100 text-gray-500' }
                    return (
                        <div key={tx.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-3">
                            <div>
                                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', typeInfo.className)}>
                                    {typeInfo.label}
                                </span>
                                <p className="text-xs text-gray-400 mt-1">{formatDateTime(tx.created_at)}</p>
                            </div>
                            <span className={cn('font-bold text-sm', isCredit ? 'text-green-600' : 'text-red-500')}>
                                {isCredit ? '+' : '-'}৳{Number(tx.amount).toLocaleString()}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-1 mt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={cn(
                                'w-8 h-8 rounded-lg text-xs font-semibold transition-colors',
                                page === p ? 'bg-[#4C3B8A] text-white' : 'text-gray-500 hover:bg-gray-100'
                            )}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
