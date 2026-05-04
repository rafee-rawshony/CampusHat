'use client'

/**
 * Inventory page (Daraz-style).
 *
 * Lists every product with its current stock level. Highlights low-stock
 * (≤5) and out-of-stock items at the top. Supports inline stock edits
 * via the existing PATCH /mall/products/{id}/ endpoint.
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Search, AlertTriangle, Box, Package, Loader2,
    CheckCircle2, Pencil, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { absoluteMediaUrl } from '@/services/upload.service'

interface Product {
    id: string
    name: string
    slug: string
    sku?: string
    base_price: string
    stock_quantity: number
    is_active: boolean
    is_in_stock?: boolean
    primary_image_url?: string | null
}

const LOW_STOCK_THRESHOLD = 5

export default function InventoryPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'in_stock'>('all')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editStock, setEditStock] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: ['seller-inventory'],
        queryFn: () => api.get('/seller/products/').then(
            // Endpoint returns { success, message, data: [...] }; tolerate raw arrays too.
            r => r.data?.data || r.data?.results || (Array.isArray(r.data) ? r.data : []),
        ),
    })

    const products: Product[] = (data as Product[]) || []

    // Stock update mutation — PATCHes only the stock_quantity. Note: the
    // mall product viewset uses slug as its lookup, not UUID.
    const updateStockMutation = useMutation({
        mutationFn: async ({ slug, stock }: { slug: string; stock: number }) => {
            const { data } = await api.patch(`/mall/products/${slug}/`, { stock_quantity: stock })
            return data
        },
        onSuccess: () => {
            toast.success('Stock updated.')
            queryClient.invalidateQueries({ queryKey: ['seller-inventory'] })
            queryClient.invalidateQueries({ queryKey: ['seller-stats'] })
            setEditingId(null)
        },
        onError: (err: unknown) => {
            const e = err as { response?: { data?: { message?: string } } }
            toast.error(e.response?.data?.message || 'Failed to update stock.')
        },
    })

    // Apply filter + search.
    const filtered = useMemo(() => {
        let list = products
        if (filter === 'low') list = list.filter(p => p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_THRESHOLD)
        if (filter === 'out') list = list.filter(p => p.stock_quantity === 0)
        if (filter === 'in_stock') list = list.filter(p => p.stock_quantity > LOW_STOCK_THRESHOLD)
        const q = search.trim().toLowerCase()
        if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
        return list
    }, [products, filter, search])

    const counts = useMemo(() => ({
        all: products.length,
        out: products.filter(p => p.stock_quantity === 0).length,
        low: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_THRESHOLD).length,
        in_stock: products.filter(p => p.stock_quantity > LOW_STOCK_THRESHOLD).length,
    }), [products])

    const startEdit = (p: Product) => {
        setEditingId(p.id)
        setEditStock(String(p.stock_quantity))
    }

    const saveEdit = (slug: string) => {
        const n = parseInt(editStock, 10)
        if (isNaN(n) || n < 0) {
            toast.error('Enter a valid stock number.')
            return
        }
        updateStockMutation.mutate({ slug, stock: n })
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-bold text-2xl text-gray-900">Inventory</h1>
                <p className="text-sm text-gray-500 mt-1">Track and update stock levels for all your products.</p>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {[
                    { key: 'all',      label: 'All',          count: counts.all,      color: 'bg-white border border-gray-200 text-gray-700' },
                    { key: 'out',      label: 'Out of Stock', count: counts.out,      color: 'bg-red-50 border border-red-200 text-red-700' },
                    { key: 'low',      label: 'Low Stock',    count: counts.low,      color: 'bg-amber-50 border border-amber-200 text-amber-700' },
                    { key: 'in_stock', label: 'In Stock',     count: counts.in_stock, color: 'bg-emerald-50 border border-emerald-200 text-emerald-700' },
                ].map((chip) => (
                    <button
                        key={chip.key}
                        onClick={() => setFilter(chip.key as typeof filter)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                            filter === chip.key
                                ? 'bg-brand-primary text-white border border-brand-primary'
                                : chip.color + ' hover:border-brand-primary'
                        }`}
                    >
                        {chip.label} <span className="ml-1 opacity-70">({chip.count})</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by product name or SKU"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 pl-10 bg-gray-50"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No products match this filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-3 font-semibold">Product</th>
                                    <th className="px-5 py-3 font-semibold">SKU</th>
                                    <th className="px-5 py-3 font-semibold">Price</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold text-right">Stock</th>
                                    <th className="px-5 py-3 font-semibold text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((p) => {
                                    const stock = p.stock_quantity
                                    const stockColor = stock === 0
                                        ? 'text-red-600'
                                        : stock <= LOW_STOCK_THRESHOLD
                                            ? 'text-amber-600'
                                            : 'text-gray-900'
                                    const stockIcon = stock === 0
                                        ? <Box className="h-3.5 w-3.5 text-red-500" />
                                        : stock <= LOW_STOCK_THRESHOLD
                                            ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                            : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    const img = absoluteMediaUrl(p.primary_image_url || '')
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                                        {img ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={img} alt={p.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="h-4 w-4 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <Link
                                                        href={`/seller/products?edit=${p.id}`}
                                                        className="font-medium text-gray-900 hover:text-brand-primary truncate max-w-[260px]"
                                                    >
                                                        {p.name}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 font-mono text-xs">{p.sku || '—'}</td>
                                            <td className="px-5 py-3 text-gray-700">৳{Number(p.base_price).toLocaleString()}</td>
                                            <td className="px-5 py-3">
                                                <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                                                    p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {p.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {editingId === p.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            value={editStock}
                                                            onChange={(e) => setEditStock(e.target.value)}
                                                            className="w-20 h-8 text-sm"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => saveEdit(p.slug)}
                                                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                                                            disabled={updateStockMutation.isPending}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 font-bold ${stockColor}`}>
                                                        {stockIcon}
                                                        {stock}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {editingId !== p.id && (
                                                    <button
                                                        onClick={() => startEdit(p)}
                                                        className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1 ml-auto"
                                                    >
                                                        <Pencil className="h-3 w-3" /> Edit Stock
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <Link href="/seller/products">
                    <Button className="bg-brand-primary hover:bg-brand-dark">
                        Manage Products
                    </Button>
                </Link>
            </div>
        </div>
    )
}
