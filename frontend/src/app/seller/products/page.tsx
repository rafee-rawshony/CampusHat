'use client'

import React, { useState, useEffect } from 'react'
import {
    Plus, Search, Edit2, Trash2, Image as ImageIcon,
    MoreHorizontal, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

export default function SellerProductsPage() {
    const queryClient = useQueryClient()
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isAddMode, setIsAddMode] = useState(false)
    const [categories, setCategories] = useState<any[]>([])

    // Form State for Add/Edit
    const [formData, setFormData] = useState({
        name: '', brand: '', category_id: '', sku: '',
        base_price: '', original_price: '', stock_quantity: '0',
        status: 'In Stock', image_url: '', short_description: '', description: ''
    })

    useEffect(() => {
        // Mock API Fetch for Products & Categories
        // API: GET /api/v1/seller/products/
        // API: GET /api/v1/mall/categories/
        setTimeout(() => {
            setProducts([
                { id: '1', image: 'https://placehold.co/80x80/purple/white', name: 'Campus Backpack 2024', brand: 'Jansport', category: 'Accessories', price: 1500, stock: 45, status: 'In Stock' },
                { id: '2', image: 'https://placehold.co/80x80/blue/white', name: 'Mechanical Keyboard', brand: 'Logitech', category: 'Electronics', price: 4200, stock: 12, status: 'In Stock' },
                { id: '3', image: 'https://placehold.co/80x80/gray/white', name: 'University Hoodie (L)', brand: 'Campus Apparel', category: 'Clothing', price: 850, stock: 0, status: 'Out of Stock' }
            ])
            setCategories([
                { id: 'cat1', name: 'Electronics' },
                { id: 'cat2', name: 'Clothing' },
                { id: 'cat3', name: 'Accessories' },
                { id: 'cat4', name: 'Books' }
            ])
            setIsLoading(false)
        }, 500)
    }, [])

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // API: POST /api/v1/mall/products/
        if (!formData.name || !formData.category_id || !formData.base_price) {
            toast.error("Please fill all required fields")
            return
        }

        // Mock Save
        const newProd = {
            id: Date.now().toString(),
            name: formData.name,
            brand: formData.brand,
            category: categories.find(c => c.id === formData.category_id)?.name || 'Misc',
            price: Number(formData.base_price),
            stock: Number(formData.stock_quantity),
            status: formData.status,
            image: formData.image_url || null
        }
        setProducts([newProd, ...products])
        toast.success("Product saved successfully")
        setIsAddMode(false)
    }

    const openEditForm = (prod: any) => {
        setFormData({
            name: prod.name, brand: prod.brand, category_id: categories.find(c => c.name === prod.category)?.id || '',
            sku: `SKU-${prod.id}`, base_price: prod.price.toString(), original_price: '',
            stock_quantity: prod.stock.toString(), status: prod.status, image_url: prod.image || '',
            short_description: '', description: ''
        })
        setIsAddMode(true)
    }

    const deleteProduct = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
            try {
                await api.delete(`/mall/products/${id}/`)
                setProducts(prev => prev.filter(p => p.id !== id)) // local feedback assuming mock mixed with API
                queryClient.invalidateQueries({ queryKey: ['seller-products'] })
                toast.success("Product deleted successfully")
            } catch (error) {
                toast.error("Failed to delete product")
            }
        }
    }

    if (isLoading) {
        return <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
    }

    // Savings Calculation helper (TEST S5.3)
    let savingsText = null
    const baseP = parseFloat(formData.base_price)
    const origP = parseFloat(formData.original_price)
    if (!isNaN(baseP) && !isNaN(origP) && origP > baseP) {
        const savings = origP - baseP
        const percentage = Math.round((savings / origP) * 100)
        savingsText = <span className="text-emerald-600 font-bold text-xs ml-2">({percentage}% OFF - Save ৳{savings})</span>
    }

    if (isAddMode) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden max-w-4xl">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                    <button onClick={() => setIsAddMode(false)} className="text-gray-500 hover:text-gray-900 border border-gray-200 bg-white p-2 rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 leading-none">Add New Product</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">Fill out the details below to list a new item</p>
                    </div>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 sm:p-8 space-y-8 flex-1 overflow-y-auto">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">Product Name *</Label>
                            <Input placeholder="e.g. Sony Wireless Headphones" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-gray-50 border-gray-200" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">Brand</Label>
                            <Input placeholder="e.g. Sony" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="bg-gray-50 border-gray-200" />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">SKU (Stock Keeping Unit)</Label>
                            <Input placeholder="Leave blank to auto-generate" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="bg-gray-50 border-gray-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">Category *</Label>
                            <Select value={formData.category_id} onValueChange={v => setFormData({ ...formData, category_id: v })} required>
                                <SelectTrigger className="bg-gray-50 border-gray-200">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold flex items-center">
                                Price (৳) * {savingsText}
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                                <Input type="number" placeholder="0.00" value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })} className="pl-7 bg-gray-50 border-gray-200 font-medium" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold flex items-center justify-between">
                                Original Price (৳)
                                <span className="text-[10px] text-gray-400 font-normal">Before-discount price</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                                <Input type="number" placeholder="0.00" value={formData.original_price} onChange={e => setFormData({ ...formData, original_price: e.target.value })} className="pl-7 bg-gray-50 border-gray-200 font-medium" />
                            </div>
                        </div>
                    </div>

                    {/* Row 4 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">Stock Level *</Label>
                            <Input type="number" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} className="bg-gray-50 border-gray-200" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700 font-bold">Status *</Label>
                            <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                                <SelectTrigger className="bg-gray-50 border-gray-200">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="In Stock">In Stock</SelectItem>
                                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-700 font-bold">Image URL *</Label>
                        <Input placeholder="https://example.com/product-image.jpg" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="bg-gray-50 border-gray-200" required />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-700 font-bold">Short Description</Label>
                        <Textarea placeholder="A brief summary for the product card..." value={formData.short_description} onChange={e => setFormData({ ...formData, short_description: e.target.value })} className="bg-gray-50 border-gray-200 min-h-[60px]" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-700 font-bold">Long Description</Label>
                        <Textarea placeholder="Full product details, specifications, and warranty info..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-gray-50 border-gray-200 min-h-[120px]" />
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 mt-8">
                        <Button type="button" variant="outline" onClick={() => setIsAddMode(false)} className="border-gray-300 text-gray-700 font-bold px-6">Cancel</Button>
                        <Button type="submit" className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-8 shadow-md">Add Product</Button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Inventory Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Update prices, stock levels, and product details</p>
                </div>
                <Button onClick={() => {
                    setFormData({
                        name: '', brand: '', category_id: '', sku: '',
                        base_price: '', original_price: '', stock_quantity: '0',
                        status: 'In Stock', image_url: '', short_description: '', description: ''
                    })
                    setIsAddMode(true)
                }} className="bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-xl shadow-sm">
                    <Plus className="w-5 h-5 mr-2" /> New Product
                </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center bg-gray-50/50">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search products by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white border-gray-200"
                        />
                    </div>
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                <th className="py-4 px-6">Image</th>
                                <th className="py-4 px-6">Name</th>
                                <th className="py-4 px-6">Brand</th>
                                <th className="py-4 px-6">Category</th>
                                <th className="py-4 px-6 text-right">Price</th>
                                <th className="py-4 px-6 text-right">Stock</th>
                                <th className="py-4 px-6 text-center">Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-3 px-6">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                                            {p.image ? (
                                                <Image src={p.image} alt={p.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-gray-300" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-6">
                                        <p className="font-bold text-gray-900 text-sm group-hover:text-brand-primary transition-colors">{p.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">SKU-{p.id}</p>
                                    </td>
                                    <td className="py-3 px-6 text-xs font-medium text-gray-600">{p.brand}</td>
                                    <td className="py-3 px-6 text-xs font-medium text-gray-600">{p.category}</td>
                                    <td className="py-3 px-6 text-right font-black text-gray-900">৳{p.price.toLocaleString()}</td>
                                    <td className="py-3 px-6 text-right">
                                        <span className={`text-sm font-bold ${p.stock < 5 ? 'text-red-500' : 'text-gray-900'}`}>{p.stock}</span>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <Badge variant="outline" className={`text-[10px] px-2 py-0 shadow-sm
                                            ${p.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                            ${p.status === 'Out of Stock' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                            ${p.status === 'Draft' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                                        `}>
                                            {p.status}
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm">
                                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                <DropdownMenuItem onClick={() => openEditForm(p)} className="font-medium text-gray-700 cursor-pointer">
                                                    <Edit2 className="w-4 h-4 mr-2 text-blue-500" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => deleteProduct(p.id, p.name)} className="font-medium text-red-600 focus:text-red-700 cursor-pointer">
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Search className="w-6 h-6 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-bold mb-1">No products found</h3>
                            <p className="text-sm text-gray-500">Try adjusting your search terms.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
