'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, LayoutList, LayoutGrid } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface SellerProductTableProps {
    onEdit: (product: any) => void
}

export function SellerProductTable({ onEdit }: SellerProductTableProps) {
    const queryClient = useQueryClient()
    const [deleteTarget, setDeleteTarget] = useState<any>(null)
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

    const { data, isLoading } = useQuery({
        queryKey: ['seller-products'],
        queryFn: () =>
            api.get('/seller/products/').then(r => r.data?.results || r.data || []),
        staleTime: 60_000,
    })

    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
            api.patch(`/mall/products/${id}/`, { is_active }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-products'] })
        },
        onError: () => toast.error('Failed to update product status'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/mall/products/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-products'] })
            toast.success('Product deleted')
            setDeleteTarget(null)
        },
        onError: () => toast.error('Failed to delete product'),
    })

    const products: any[] = data || []

    const StockCell = ({ qty }: { qty: number }) => {
        if (qty === 0) return <span className="text-red-500 font-semibold text-sm">0 <Badge className="bg-red-100 text-red-500 text-[10px] ml-1 py-0 font-bold">Out</Badge></span>
        if (qty <= 5) return <span className="text-orange-500 font-semibold text-sm">{qty} <Badge className="bg-orange-100 text-orange-500 text-[10px] ml-1 py-0 font-bold">Low</Badge></span>
        return <span className="text-green-600 font-medium text-sm">{qty}</span>
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50 animate-pulse">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/5"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-sm">No products yet. Add your first product!</p>
            </div>
        )
    }

    return (
        <>
            {/* View Toggle */}
            <div className="flex justify-end mb-3 gap-1">
                <button
                    onClick={() => setViewMode('table')}
                    className={cn('p-2 rounded-lg transition-colors', viewMode === 'table' ? 'bg-[#4C3B8A]/10 text-[#4C3B8A]' : 'text-gray-400 hover:text-gray-600')}
                >
                    <LayoutList className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setViewMode('grid')}
                    className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-[#4C3B8A]/10 text-[#4C3B8A]' : 'text-gray-400 hover:text-gray-600')}
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
            </div>

            {/* Desktop Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hidden md:block">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100">
                            {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product: any) => {
                            const img = product.images?.[0]?.image || product.images?.[0]?.image_url
                            return (
                                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    {/* Product */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                                {img ? (
                                                    <img src={img} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">
                                                        {product.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm line-clamp-2 max-w-[200px]">{product.name}</p>
                                                {product.sku && <p className="text-xs text-gray-400 font-mono mt-0.5">{product.sku}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    {/* Category */}
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {product.category?.name || '—'}
                                    </td>
                                    {/* Price */}
                                    <td className="px-4 py-3">
                                        {product.discount_price ? (
                                            <>
                                                <p className="font-semibold text-gray-900">৳{Number(product.discount_price).toLocaleString()}</p>
                                                <p className="text-xs text-gray-400 line-through">৳{Number(product.base_price).toLocaleString()}</p>
                                            </>
                                        ) : (
                                            <p className="font-semibold text-gray-900">৳{Number(product.base_price).toLocaleString()}</p>
                                        )}
                                    </td>
                                    {/* Stock */}
                                    <td className="px-4 py-3">
                                        <StockCell qty={product.stock_quantity || 0} />
                                    </td>
                                    {/* Status Toggle */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={product.is_active}
                                                onCheckedChange={(checked) =>
                                                    toggleActiveMutation.mutate({ id: product.id, is_active: checked })
                                                }
                                            />
                                            <span className={cn('text-xs font-medium', product.is_active ? 'text-green-600' : 'text-gray-400')}>
                                                {product.is_active ? 'Active' : 'Draft'}
                                            </span>
                                        </div>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="w-8 h-8 rounded-lg border-gray-200"
                                                onClick={() => onEdit(product)}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="w-8 h-8 rounded-lg border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setDeleteTarget(product)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
                {products.map((product: any) => {
                    const img = product.images?.[0]?.image || product.images?.[0]?.image_url
                    return (
                        <div key={product.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                {img ? (
                                    <img src={img} className="w-full h-full object-cover" alt={product.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-xl">
                                        {product.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{product.category?.name || '—'}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <p className="font-bold text-sm text-gray-900">৳{Number(product.base_price).toLocaleString()}</p>
                                    <StockCell qty={product.stock_quantity || 0} />
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Switch checked={product.is_active} onCheckedChange={(c) => toggleActiveMutation.mutate({ id: product.id, is_active: c })} />
                                <div className="flex gap-1">
                                    <Button size="icon" variant="outline" className="w-7 h-7 rounded-lg" onClick={() => onEdit(product)}>
                                        <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button size="icon" variant="outline" className="w-7 h-7 rounded-lg border-red-100 text-red-400" onClick={() => setDeleteTarget(product)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => deleteMutation.mutate(deleteTarget?.id)}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
