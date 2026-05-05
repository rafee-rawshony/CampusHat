'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
    TrendingUp, TrendingDown, Loader2, Package, DollarSign,
    BarChart3, ShoppingBag,
} from 'lucide-react'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { normalizeListResponse } from '@/lib/response'

interface TopProduct {
    product__id: string
    product__name: string
    product__slug: string
    sold_count: number
    total_revenue: string
    base_price?: string
    stock_quantity?: number
}

export default function TopProductsPage() {
    const [tab, setTab] = useState<'best' | 'slow'>('best')

    const { data: bestSellers = [], isLoading: loadingBest } = useQuery<TopProduct[]>({
        queryKey: ['seller-top-products', 'best'],
        queryFn: () =>
            api.get('/analytics/seller/products/top/', { params: { type: 'best' } })
                .then(r => normalizeListResponse<TopProduct>(r.data?.data ?? r.data)),
    })

    const { data: slowMovers = [], isLoading: loadingSlow } = useQuery<TopProduct[]>({
        queryKey: ['seller-top-products', 'slow'],
        queryFn: () =>
            api.get('/analytics/seller/products/top/', { params: { type: 'slow' } })
                .then(r => normalizeListResponse<TopProduct>(r.data?.data ?? r.data)),
    })

    const isLoading = tab === 'best' ? loadingBest : loadingSlow
    const products = tab === 'best' ? bestSellers : slowMovers

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#4C3B8A]" />
                        Top Products
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        See your best sellers and slow movers at a glance
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setTab('best')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        tab === 'best'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Best Sellers
                </button>
                <button
                    onClick={() => setTab('slow')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        tab === 'slow'
                            ? 'bg-white text-amber-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    <TrendingDown className="w-4 h-4" />
                    Slow Movers
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-[#4C3B8A]" />
                </div>
            )}

            {/* Empty state */}
            {!isLoading && products.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                        {tab === 'best' ? 'No sales data yet' : 'All products are selling well!'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Sales data will appear here once orders come in
                    </p>
                </div>
            )}

            {/* Product list */}
            {!isLoading && products.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600 w-10">#</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Product</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-600">
                                        <span className="flex items-center justify-end gap-1">
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            Sold
                                        </span>
                                    </th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-600">
                                        <span className="flex items-center justify-end gap-1">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            Revenue
                                        </span>
                                    </th>
                                    {tab === 'slow' && (
                                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Stock</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product, idx) => (
                                    <tr
                                        key={product.product__id}
                                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                tab === 'best'
                                                    ? idx < 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                                    : idx < 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link
                                                href={`/seller/products`}
                                                className="font-medium text-gray-900 hover:text-[#4C3B8A] transition-colors line-clamp-1"
                                            >
                                                {product.product__name}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                                tab === 'best'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : product.sold_count === 0
                                                        ? 'bg-red-50 text-red-600'
                                                        : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                {product.sold_count} units
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-700">
                                            ৳{parseFloat(product.total_revenue || '0').toLocaleString()}
                                        </td>
                                        {tab === 'slow' && (
                                            <td className="py-3 px-4 text-right text-gray-500">
                                                {product.stock_quantity ?? '-'}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Insights card */}
            {!isLoading && products.length > 0 && (
                <div className={`rounded-xl border p-4 ${
                    tab === 'best'
                        ? 'bg-emerald-50/50 border-emerald-100'
                        : 'bg-amber-50/50 border-amber-100'
                }`}>
                    <h3 className={`text-sm font-semibold mb-1 ${
                        tab === 'best' ? 'text-emerald-800' : 'text-amber-800'
                    }`}>
                        {tab === 'best' ? '💡 Best Sellers Insight' : '⚠️ Action Needed'}
                    </h3>
                    <p className={`text-xs ${tab === 'best' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {tab === 'best'
                            ? `Your top ${Math.min(3, products.length)} products are driving most of your revenue. Consider restocking and promoting them further.`
                            : `These products have low or zero sales. Consider adjusting pricing, improving descriptions, or running promotions to boost visibility.`
                        }
                    </p>
                </div>
            )}
        </div>
    )
}
