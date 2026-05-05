'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/formatDate'
import { OrderStatusBadge } from '@/components/seller/OrderStatusBadge'

export function RecentOrdersTable() {
    const { data, isLoading } = useQuery({
        queryKey: ['seller-recent-orders'],
        queryFn: () =>
            api
                .get('/seller/orders/?limit=5&ordering=-created_at')
                .then(r => r.data?.results || r.data || []),
        staleTime: 30_000,
    })

    // Normalize API response: some endpoints return an array, others return
    // a paginated object { results: [] } or wrapper { data: [] }.
    const ordersRaw: any = data || []
    const orders: any[] = Array.isArray(ordersRaw)
        ? ordersRaw
        : Array.isArray(ordersRaw?.results)
        ? ordersRaw.results
        : Array.isArray(ordersRaw?.data)
        ? ordersRaw.data
        : []

    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Recent Orders</h3>
                <Link
                    href="/seller/orders"
                    className="text-[#4C3B8A] text-sm font-semibold hover:underline"
                >
                    View All →
                </Link>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                            <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading
                            ? Array(5).fill(0).map((_, i) => (
                                  <tr key={i} className="border-b border-gray-50">
                                      {Array(5).fill(0).map((_, j) => (
                                          <td key={j} className="px-5 py-4">
                                              <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                                          </td>
                                      ))}
                                  </tr>
                              ))
                            : orders.length === 0
                            ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                                        No orders yet
                                    </td>
                                </tr>
                            )
                            : orders.map((order: any) => (
                                  <tr
                                      key={order.id}
                                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                  >
                                      <td className="px-5 py-4 font-mono text-sm text-gray-700">
                                          #{order.order_number}
                                      </td>
                                      <td className="px-5 py-4">
                                          <div className="flex items-center gap-2">
                                              {order.buyer?.profile_picture ? (
                                                  <img
                                                      src={order.buyer.profile_picture}
                                                      className="w-6 h-6 rounded-full object-cover border border-gray-100"
                                                      alt=""
                                                  />
                                              ) : (
                                                  <div className="w-6 h-6 rounded-full bg-[#4C3B8A]/10 text-[#4C3B8A] flex items-center justify-center text-[10px] font-bold">
                                                      {order.buyer?.full_name?.charAt(0) || '?'}
                                                  </div>
                                              )}
                                              <span className="text-sm text-gray-700">{order.buyer?.full_name || 'Unknown'}</span>
                                          </div>
                                      </td>
                                      <td className="px-5 py-4 font-semibold text-gray-900">
                                          ৳{Number(order.total_amount).toLocaleString()}
                                      </td>
                                      <td className="px-5 py-4">
                                          <OrderStatusBadge status={order.status} />
                                      </td>
                                      <td className="px-5 py-4 text-sm text-gray-500">
                                          {order.created_at ? formatDate(order.created_at) : '—'}
                                      </td>
                                  </tr>
                              ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile: Card list */}
            <div className="md:hidden divide-y divide-gray-50">
                {isLoading
                    ? Array(3).fill(0).map((_, i) => (
                          <div key={i} className="p-4 animate-pulse space-y-2">
                              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                          </div>
                      ))
                    : orders.map((order: any) => (
                          <div key={order.id} className="p-4 flex items-center justify-between gap-3">
                              <div>
                                  <p className="font-mono text-sm font-semibold text-gray-800">#{order.order_number}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{order.buyer?.full_name || 'Unknown'}</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-sm text-gray-900">৳{Number(order.total_amount).toLocaleString()}</p>
                                  <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
                              </div>
                          </div>
                      ))}
            </div>
        </div>
    )
}
