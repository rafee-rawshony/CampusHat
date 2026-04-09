'use client'

import { useMemo, useState } from 'react'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { api, extractPaginatedArray, PaginatedResult } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface OrderRow {
    id: string
    order_number: string
    store_name?: string
    total_amount: number
    payment_status: string
    order_status: string
    item_count?: number
    created_at: string
}

interface ApiErrorPayload {
    message?: string
    data?: {
        message?: string
    }
}

const statusClass = (status: string) => {
    switch (status) {
        case 'delivered':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'shipped':
            return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'packed':
        case 'confirmed':
            return 'bg-purple-50 text-purple-700 border-purple-200'
        case 'placed':
            return 'bg-amber-50 text-amber-700 border-amber-200'
        case 'cancelled':
            return 'bg-red-50 text-red-700 border-red-200'
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200'
    }
}

const paymentClass = (status: string) => {
    switch (status) {
        case 'paid':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'refunded':
            return 'bg-orange-50 text-orange-700 border-orange-200'
        case 'failed':
            return 'bg-red-50 text-red-700 border-red-200'
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200'
    }
}

const getVisiblePages = (current: number, total: number) => {
    const maxButtons = 5
    if (total <= maxButtons) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const half = Math.floor(maxButtons / 2)
    let start = Math.max(1, current - half)
    let end = Math.min(total, start + maxButtons - 1)

    if (end - start + 1 < maxButtons) {
        start = Math.max(1, end - maxButtons + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function MyOrdersPage() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 8

    const { data, isLoading } = useQuery({
        queryKey: ['account-orders', page],
        queryFn: () =>
            api
                .get('/orders/', { params: { page, page_size: PAGE_SIZE } })
                .then((r): PaginatedResult<OrderRow> => extractPaginatedArray<OrderRow>(r.data)),
        staleTime: 30_000,
    })

    const cancelOrder = useMutation({
        mutationFn: (orderId: string) => api.patch(`/orders/${orderId}/cancel/`, { reason: 'Cancelled by buyer from account panel.' }),
        onSuccess: () => {
            toast.success('Order cancelled successfully.')
            queryClient.invalidateQueries({ queryKey: ['account-orders'] })
        },
        onError: (error: unknown) => {
            const message = axios.isAxiosError(error)
                ? ((error.response?.data as ApiErrorPayload | undefined)?.message
                    || (error.response?.data as ApiErrorPayload | undefined)?.data?.message)
                : undefined
            toast.error(message || 'Could not cancel this order.')
        },
    })

    const orders = useMemo(() => data?.items || [], [data])
    const totalPages = Math.max(1, Number(data?.totalPages || 1))
    const currentPage = Math.min(Math.max(1, Number(data?.currentPage || page)), totalPages)
    const totalCount = Number(data?.count || 0)
    const pageNumbers = useMemo(() => getVisiblePages(currentPage, totalPages), [currentPage, totalPages])

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                <span className="text-sm text-gray-500">Total: {totalCount}</span>
            </div>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {Array(4).fill(null).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-gray-100" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                    <p>You have not placed any orders yet.</p>
                    <p className="text-sm mt-1">Your order history will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/40 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-sm text-gray-500">Order No</p>
                                    <p className="font-bold text-gray-900">{order.order_number}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {order.store_name || 'CampusHat Store'} • {order.item_count || 0} items • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                    <Badge variant="outline" className={statusClass(order.order_status)}>
                                        {order.order_status}
                                    </Badge>
                                    <Badge variant="outline" className={paymentClass(order.payment_status)}>
                                        {order.payment_status}
                                    </Badge>
                                    <span className="font-extrabold text-gray-900 ml-1">৳{Number(order.total_amount || 0).toLocaleString()}</span>
                                    {order.order_status === 'placed' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => cancelOrder.mutate(order.id)}
                                            disabled={cancelOrder.isPending}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-gray-500">
                            Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            >
                                Previous
                            </Button>
                            {pageNumbers.map((pageNo) => (
                                <Button
                                    key={pageNo}
                                    type="button"
                                    variant={pageNo === currentPage ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPage(pageNo)}
                                >
                                    {pageNo}
                                </Button>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
