'use client'

import React, { useMemo, useState } from 'react'
import {
    Search, CheckCircle2, Truck, Package as PackageIcon, ShoppingBag, Box
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

type OrderStatus = 'all' | 'placed' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled'

const unwrapData = (payload: any) => payload?.data ?? payload

const toArray = (payload: any) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.results)) return payload.results
    if (Array.isArray(payload?.data)) return payload.data
    return []
}

export default function SellerOrdersPage() {
    const queryClient = useQueryClient()
    const [currentTab, setCurrentTab] = useState<OrderStatus>('all')
    const [searchTerm, setSearchTerm] = useState('')

    // Modals
    const [isShipModalOpen, setIsShipModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [shipData, setShipData] = useState({ courier: '', tracking_code: '' })

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['seller-orders-all'],
        queryFn: () =>
            api.get('/seller/orders/', { params: { page_size: 100 } }).then((r) => {
                const data = unwrapData(r.data) || {}
                return toArray(data.results)
            }),
    })

    const orders = useMemo(() => ordersData || [], [ordersData])

    const counts = useMemo(() => {
        const base = {
            all: orders.length,
            placed: 0,
            confirmed: 0,
            packed: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
        }
        for (const o of orders) {
            const key = o.order_status as keyof typeof base
            if (key in base) base[key] += 1
        }
        return base
    }, [orders])

    const filteredOrders = useMemo(() => {
        const byTab = currentTab === 'all'
            ? orders
            : orders.filter((o: any) => o.order_status === currentTab)

        const term = searchTerm.trim().toLowerCase()
        if (!term) return byTab

        return byTab.filter((o: any) => {
            const orderNo = String(o.order_number || '').toLowerCase()
            const buyer = String(o.buyer_email || '').toLowerCase()
            return orderNo.includes(term) || buyer.includes(term)
        })
    }, [orders, currentTab, searchTerm])

    const tabs = [
        { id: 'all', label: 'All Orders' },
        { id: 'placed', label: 'Pending' },
        { id: 'confirmed', label: 'Confirmed' },
        { id: 'packed', label: 'Packed' },
        { id: 'shipped', label: 'Shipped' },
        { id: 'delivered', label: 'Delivered' },
        { id: 'cancelled', label: 'Cancelled' },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'placed': return 'bg-amber-50 text-amber-700 border-amber-200'
            case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'packed': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
            case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200'
            case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const { mutateAsync: updateStatus } = useMutation({
        mutationFn: ({ id, status }: { id: string, status: 'confirmed' | 'packed' }) => {
            const path = status === 'confirmed' ? 'confirm' : 'pack'
            return api.patch(`/seller/orders/${id}/${path}/`, {})
        },
        onSuccess: (_result, variables) => {
            toast.success(`Order marked as ${variables.status}`)
            queryClient.invalidateQueries({ queryKey: ['seller-orders-all'] })
        }
    })

    const updateOrderStatus = (id: string, newStatus: 'confirmed' | 'packed') => {
        updateStatus({ id, status: newStatus }).catch(() => toast.error('Failed to update status'))
    }

    const openShipModal = (order: any) => {
        setSelectedOrder(order)
        setShipData({ courier: '', tracking_code: '' })
        setIsShipModalOpen(true)
    }

    const { mutateAsync: shipOrder } = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => api.patch(`/seller/orders/${id}/ship/`, data),
        onSuccess: () => {
            toast.success('Order marked as shipped')
            setIsShipModalOpen(false)
            setSelectedOrder(null)
            queryClient.invalidateQueries({ queryKey: ['seller-orders-all'] })
        }
    })

    const handleShipOrder = () => {
        if (!shipData.courier || !shipData.tracking_code) {
            toast.error("Please provide both courier and tracking code")
            return
        }
        shipOrder({ id: selectedOrder.id, data: shipData }).catch(() => toast.error('Failed to dispatch order'))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900">Orders Management</h1>
                <p className="text-gray-500 text-sm mt-1">Review, process, and track your store orders.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm font-bold text-gray-500 mb-1">To Confirm</p>
                    <p className="text-2xl font-black text-amber-600">{counts.placed}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm font-bold text-gray-500 mb-1">To Pack</p>
                    <p className="text-2xl font-black text-blue-600">{counts.confirmed}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm font-bold text-gray-500 mb-1">To Ship</p>
                    <p className="text-2xl font-black text-indigo-600">{counts.packed}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm font-bold text-gray-500 mb-1">In Transit</p>
                    <p className="text-2xl font-black text-purple-600">{counts.shipped}</p>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => {
                        const count = counts[tab.id as keyof typeof counts] || 0
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setCurrentTab(tab.id as OrderStatus)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors
                                    ${currentTab === tab.id
                                        ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${currentTab === tab.id ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
                <div className="p-4 flex gap-4 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search Order ID or Buyer Name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-10 pl-9 bg-white border-gray-200"
                        />
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500 animate-pulse font-bold bg-white rounded-xl border border-gray-200">Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <PackageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-bold text-gray-900">No orders found</p>
                        <p className="text-sm text-gray-500 mt-1">There are no orders matching this status or search.</p>
                    </div>
                ) : filteredOrders.map((order: any) => (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-gray-300">
                        {/* Summary Header */}
                        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                                    <ShoppingBag className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-black text-gray-900">{order.order_number}</h3>
                                        <Badge variant="outline" className={`uppercase tracking-wider text-[10px] font-bold ${getStatusColor(order.order_status)}`}>
                                            {order.order_status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {order.buyer_email} • {order.item_count || 0} items • {order.created_at ? formatDistanceToNow(new Date(order.created_at), { addSuffix: true }) : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:items-end md:ml-auto">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Amount</p>
                                <p className="font-black text-gray-900 sm:text-lg">৳{Number(order.total_amount || 0).toLocaleString()}</p>
                            </div>

                            {/* Action Buttons based on status */}
                            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                                {order.order_status === 'placed' && (
                                    <Button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9">
                                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirm Order
                                    </Button>
                                )}
                                {order.order_status === 'confirmed' && (
                                    <Button onClick={() => updateOrderStatus(order.id, 'packed')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9">
                                        <Box className="w-4 h-4 mr-1.5" /> Mark as Packed
                                    </Button>
                                )}
                                {order.order_status === 'packed' && (
                                    <Button onClick={() => openShipModal(order)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-9">
                                        <Truck className="w-4 h-4 mr-1.5" /> Ship Order
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Courier Ship Modal */}
            <Dialog open={isShipModalOpen} onOpenChange={setIsShipModalOpen}>
                <DialogContent>
                    <DialogTitle className="font-black text-xl">Ship Order {selectedOrder?.order_number}</DialogTitle>
                    <div className="space-y-4 py-4">
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex gap-4">
                            <Truck className="w-6 h-6 text-brand-primary shrink-0" />
                            <div>
                                <p className="font-bold text-brand-primary text-sm">Ready to Ship</p>
                                <p className="text-xs text-purple-700/70 mt-1">Provide the courier tracking details. The customer will be notified via email automatically.</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-left">
                            <Label className="font-bold">Courier Service <span className="text-red-500">*</span></Label>
                            <Select value={shipData.courier} onValueChange={v => setShipData({ ...shipData, courier: v })}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select courier..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pathao">Pathao Courier</SelectItem>
                                    <SelectItem value="RedX">RedX Logistics</SelectItem>
                                    <SelectItem value="Steadfast">Steadfast Courier</SelectItem>
                                    <SelectItem value="Sundarban">Sundarban Courier</SelectItem>
                                    <SelectItem value="Self_Delivery">Self / Campus Delivery</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 text-left">
                            <Label className="font-bold">Tracking Code / Package ID <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="e.g. PTH-123456"
                                value={shipData.tracking_code}
                                onChange={e => setShipData({ ...shipData, tracking_code: e.target.value })}
                                className="h-11 font-medium"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsShipModalOpen(false)} className="font-bold">Cancel</Button>
                        <Button onClick={handleShipOrder} className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold">
                            <Truck className="w-4 h-4 mr-2" /> Dispatch Package
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
