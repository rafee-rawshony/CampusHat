'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Printer, ArrowLeft, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

export default function BuyerInvoicePage() {
    const { id } = useParams()
    const router = useRouter()

    const { data: order, isLoading } = useQuery({
        queryKey: ['order-invoice', id],
        queryFn: async () => {
            const res = await api.get(`/orders/${id}/`)
            return res.data?.data || res.data
        },
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#4C3B8A] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Order not found.</p>
            </div>
        )
    }

    const items = order.items || order.items_preview || []
    const addr = order.delivery_address_snapshot || {}

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Print Controls (hidden in print) */}
            <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-4 h-4" /> Back to Order
                    </button>
                    <Button onClick={() => window.print()} className="bg-[#4C3B8A] hover:bg-[#3b2c6b] text-white font-semibold rounded-xl">
                        <Printer className="w-4 h-4 mr-2" /> Print Invoice
                    </Button>
                </div>
            </div>

            {/* Invoice Content */}
            <div className="max-w-3xl mx-auto py-8 px-4 print:p-0 print:max-w-none">
                <div className="bg-white rounded-2xl print:rounded-none shadow-sm border border-gray-100 print:border-0 print:shadow-none p-8 md:p-12">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">INVOICE</h1>
                            <p className="text-sm text-gray-500 mt-1">#{order.invoice?.invoice_number || order.order_number}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-black text-[#4C3B8A]">CampusHat</h2>
                            <p className="text-xs text-gray-500 mt-1">Campus E-Commerce Platform</p>
                            <p className="text-xs text-gray-400">campushat.com</p>
                        </div>
                    </div>

                    {/* Billing + Order Info */}
                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
                            <p className="text-sm font-bold text-gray-900">{addr.full_name || 'Customer'}</p>
                            {addr.phone && <p className="text-sm text-gray-600">{addr.phone}</p>}
                            {addr.campus_building && <p className="text-sm text-gray-600">{addr.campus_building}, Room {addr.room_number}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order Info</p>
                            <p className="text-sm text-gray-700"><span className="text-gray-500">Order #:</span> {order.order_number}</p>
                            <p className="text-sm text-gray-700"><span className="text-gray-500">Date:</span> {new Date(order.created_at).toLocaleDateString('en-BD', { dateStyle: 'long' })}</p>
                            <p className="text-sm text-gray-700"><span className="text-gray-500">Status:</span> <span className="capitalize">{order.order_status}</span></p>
                            <p className="text-sm text-gray-700"><span className="text-gray-500">Payment:</span> <span className="capitalize">{order.payment_status}</span></p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-gray-900">
                                <th className="text-left text-[10px] font-bold text-gray-900 uppercase tracking-widest py-3 w-[50%]">Item</th>
                                <th className="text-center text-[10px] font-bold text-gray-900 uppercase tracking-widest py-3">Qty</th>
                                <th className="text-right text-[10px] font-bold text-gray-900 uppercase tracking-widest py-3">Price</th>
                                <th className="text-right text-[10px] font-bold text-gray-900 uppercase tracking-widest py-3">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-3 text-sm text-gray-900 font-medium">{item.product_name_snapshot || item.product_name || item.name}</td>
                                    <td className="py-3 text-sm text-gray-700 text-center">{item.quantity}</td>
                                    <td className="py-3 text-sm text-gray-700 text-right">৳{parseFloat(item.unit_price || '0').toLocaleString()}</td>
                                    <td className="py-3 text-sm text-gray-900 font-semibold text-right">৳{parseFloat(item.line_total || String(item.quantity * parseFloat(item.unit_price || '0'))).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-semibold text-gray-900">৳{parseFloat(order.subtotal || '0').toLocaleString()}</span>
                            </div>
                            {parseFloat(order.discount_amount || '0') > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>Discount</span>
                                    <span className="font-semibold">-৳{parseFloat(order.discount_amount).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Delivery Fee</span>
                                <span className="font-semibold text-gray-900">৳{parseFloat(order.delivery_fee || '0').toLocaleString()}</span>
                            </div>
                            <div className="border-t-2 border-gray-900 pt-2 flex justify-between">
                                <span className="font-black text-gray-900">Total</span>
                                <span className="text-xl font-black text-gray-900">৳{parseFloat(order.total_amount || '0').toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-400">This is a computer generated invoice. No signature required.</p>
                        <p className="text-xs text-gray-400 mt-1">CampusHat — Campus E-Commerce Platform for Bangladesh</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
