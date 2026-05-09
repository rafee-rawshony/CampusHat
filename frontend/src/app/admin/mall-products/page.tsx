'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Search, ChevronLeft, ChevronRight, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

function formatPrice(v: any) {
    return `৳${Number(v || 0).toLocaleString()}`
}

export default function AdminMallProductsPage() {
    const { isAdmin } = useAuthStore()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)

    useEffect(() => {
        if (!isAdmin()) router.replace('/admin/approvals')
    }, [isAdmin, router])

    const { data, isLoading } = useQuery({
        queryKey: ['admin-mall-products', search, page],
        queryFn: () => {
            const params: any = { page, page_size: 20, ordering: '-created_at' }
            if (search) params.search = search
            return api.get('/mall/products/', { params }).then(r => r.data?.data || r.data)
        },
        staleTime: 30_000,
    })

    const products = data?.results || data || []
    const totalPages = data?.total_pages || data?.pagination?.total_pages || Math.ceil((data?.count || 0) / 20) || 1

    const { mutate: toggleProduct, isPending: toggling } = useMutation({
        mutationFn: (id: string) => api.patch(`/mall/products/${id}/admin-toggle/`),
        onSuccess: (res, id) => {
            const isActive = res.data?.data?.is_active
            toast.success(`Product ${isActive ? 'activated' : 'deactivated'}`)
            queryClient.invalidateQueries({ queryKey: ['admin-mall-products'] })
            if (selectedProduct?.id === id) {
                setSelectedProduct((p: any) => ({ ...p, is_active: isActive }))
            }
        },
        onError: () => toast.error('Failed to update product status'),
    })

    if (!isAdmin()) return null

    return (
        <div className="space-y-5 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Mall Products</h1>
                    <p className="text-sm text-gray-400 mt-0.5">All products listed in CampusHat Mall</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search products..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        className="pl-9 text-sm"
                    />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-50 text-left">
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Product</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Store</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Price</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Stock</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array(8).fill(null).map((_, i) => (
                                <tr key={i}>{Array(6).fill(null).map((_, j) => (
                                    <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 animate-pulse rounded w-20" /></td>
                                ))}</tr>
                            ))
                        ) : products.length === 0 ? (
                            <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />No products found
                            </td></tr>
                        ) : (
                            products.map((product: any) => (
                                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            {product.primary_image_url || product.thumbnail ? (
                                                <img src={product.primary_image_url || product.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Package className="w-4 h-4 text-gray-300" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{product.name}</p>
                                                <p className="text-[11px] text-gray-400">{product.category_name || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600 text-xs">{product.store?.store_name || product.store_name || '—'}</td>
                                    <td className="px-5 py-3.5 font-semibold text-gray-900">{formatPrice(product.current_price || product.base_price)}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-medium ${(product.stock_quantity || 0) <= 5 ? 'text-orange-600' : 'text-gray-600'}`}>
                                            {product.stock_quantity ?? 0}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full ${product.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="ghost" className="h-8 px-2 text-gray-500" onClick={() => setSelectedProduct(product)}>
                                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className={`h-8 px-2 text-xs font-bold ${product.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                disabled={toggling}
                                                onClick={() => toggleProduct(product.id)}
                                            >
                                                {product.is_active ? <ToggleRight className="w-3.5 h-3.5 mr-1" /> : <ToggleLeft className="w-3.5 h-3.5 mr-1" />}
                                                {product.is_active ? 'Disable' : 'Enable'}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {isLoading ? (
                    Array(5).fill(null).map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)
                ) : products.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No products found</p>
                    </div>
                ) : (
                    products.map((product: any) => (
                        <div key={product.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                            {product.primary_image_url || product.thumbnail ? (
                                <img src={product.primary_image_url || product.thumbnail} alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0" />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-gray-300" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-400">{product.store?.store_name || product.store_name || '—'}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm font-bold text-gray-900">{formatPrice(product.current_price || product.base_price)}</span>
                                    <span className={`text-xs ${(product.stock_quantity || 0) <= 5 ? 'text-orange-600' : 'text-gray-400'}`}>Stock: {product.stock_quantity ?? 0}</span>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedProduct(product)}>
                                <Eye className="w-4 h-4 text-gray-400" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500 px-3">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Product Detail Modal */}
            <Dialog open={!!selectedProduct} onOpenChange={open => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-lg rounded-2xl">
                    <DialogHeader><DialogTitle>Product Details</DialogTitle></DialogHeader>
                    {selectedProduct && (
                        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                            {(selectedProduct.primary_image_url || selectedProduct.thumbnail) && (
                                <img src={selectedProduct.primary_image_url || selectedProduct.thumbnail} alt={selectedProduct.name}
                                    className="w-full h-44 object-cover rounded-xl border border-gray-100" />
                            )}
                            <div>
                                <p className="font-bold text-gray-900 text-lg">{selectedProduct.name}</p>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedProduct.slug}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Store</span><span className="font-semibold">{selectedProduct.store?.store_name || selectedProduct.store_name || '—'}</span></div>
                                <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Category</span><span className="font-semibold">{selectedProduct.category_name || '—'}</span></div>
                                <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Price</span><span className="font-semibold">{formatPrice(selectedProduct.current_price || selectedProduct.base_price)}</span></div>
                                <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Stock</span><span className={`font-semibold ${(selectedProduct.stock_quantity || 0) <= 5 ? 'text-orange-600' : ''}`}>{selectedProduct.stock_quantity ?? 0} units</span></div>
                                <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Status</span>
                                    <span className={`font-semibold ${selectedProduct.is_active ? 'text-green-600' : 'text-gray-500'}`}>{selectedProduct.is_active ? 'Active' : 'Inactive'}</span></div>
                                <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Rating</span><span className="font-semibold">★ {Number(selectedProduct.rating_avg || 0).toFixed(1)} ({selectedProduct.review_count || 0})</span></div>
                                {selectedProduct.sku && <div className="col-span-2 bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">SKU</span><span className="font-semibold font-mono">{selectedProduct.sku}</span></div>}
                                {selectedProduct.created_at && <div className="col-span-2 bg-gray-50 rounded-lg p-2"><span className="text-gray-400 text-xs block">Listed</span><span className="font-semibold">{format(new Date(selectedProduct.created_at), 'MMM d, yyyy')}</span></div>}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSelectedProduct(null)}>Close</Button>
                        {selectedProduct && (
                            <Button
                                className={selectedProduct.is_active ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                                disabled={toggling}
                                onClick={() => toggleProduct(selectedProduct.id)}
                            >
                                {selectedProduct.is_active ? 'Disable Product' : 'Enable Product'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
