'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SellerProductTable } from '@/components/seller/products/SellerProductTable'
import { ProductFormPanel } from '@/components/seller/products/ProductFormPanel'
import { normalizeListResponse } from '@/lib/response'

export default function SellerProductsPage() {
    const [showForm, setShowForm] = useState(false)
    const [editProduct, setEditProduct] = useState<any | null>(null)

    const { data } = useQuery({
        queryKey: ['seller-products'],
        queryFn: () => api.get('/seller/products/').then(r => r.data),
        staleTime: 60_000,
    })

    const products: any[] = normalizeListResponse(data)

    const handleEdit = (product: any) => {
        setEditProduct(product)
        setShowForm(true)
    }

    const handleClose = () => {
        setShowForm(false)
        setEditProduct(null)
    }

    return (
        <div>
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-bold text-xl text-gray-900">Inventory Management</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''}</p>
                </div>
                <Button
                    onClick={() => { setEditProduct(null); setShowForm(true) }}
                    className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold gap-2 flex items-center"
                >
                    <Plus className="w-4 h-4" /> New Product
                </Button>
            </div>

            {/* Inline Form */}
            {showForm && (
                <ProductFormPanel editProduct={editProduct} onClose={handleClose} />
            )}

            {/* Product Table */}
            <SellerProductTable onEdit={handleEdit} />
        </div>
    )
}
