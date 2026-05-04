'use client'

/**
 * Printable invoice for a seller order.
 *
 * Bare-bones HTML page styled for paper. Triggers window.print() once
 * data loads so the browser print dialog opens automatically. The
 * @media print rules hide the action bar and tighten margins for paper.
 */

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { api } from '@/lib/api'

interface OrderItem {
    id: string
    product_name_snapshot: string
    variant_name?: string | null
    unit_price: string
    quantity: number
    line_total: string
}

interface InvoiceData {
    id: string
    order_number: string
    buyer_email?: string
    delivery_address_snapshot?: Record<string, string | undefined>
    subtotal: string
    discount_amount: string
    delivery_fee: string
    total_amount: string
    items: OrderItem[]
    created_at: string
}

export default function SellerOrderInvoicePage() {
    const params = useParams()
    const orderId = params?.id as string

    const { data, isLoading } = useQuery<InvoiceData>({
        queryKey: ['seller-order-invoice', orderId],
        queryFn: () => api.get(`/seller/orders/${orderId}/`).then(r => r.data?.data || r.data),
        enabled: !!orderId,
    })

    // Auto-trigger the browser's print dialog once the data is on screen.
    useEffect(() => {
        if (data) {
            const t = setTimeout(() => window.print(), 400)
            return () => clearTimeout(t)
        }
    }, [data])

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
    }
    if (!data) return <p className="p-8 text-center text-gray-500">Order not found.</p>

    const addr = data.delivery_address_snapshot || {}

    return (
        <>
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    @page { margin: 0.6in; size: A4; }
                }
            `}</style>

            {/* Action bar — only visible on screen */}
            <div className="no-print sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <Link href={`/seller/orders/${orderId}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-primary">
                    <ArrowLeft className="h-4 w-4" /> Back to order
                </Link>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-brand-dark"
                >
                    <Printer className="h-4 w-4" /> Print
                </button>
            </div>

            {/* Invoice paper */}
            <div className="max-w-[800px] mx-auto bg-white p-10 my-8 print:my-0 print:p-0">
                {/* Header */}
                <div className="flex items-start justify-between border-b-2 border-gray-200 pb-5 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">CampusHat</h1>
                        <p className="text-xs text-gray-500 mt-1">Campus marketplace · Bangladesh</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">INVOICE</p>
                        <p className="text-sm text-gray-600 mt-1 font-mono">#{data.order_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Date: {new Date(data.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Bill to */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bill To</p>
                        {addr.recipient_name ? (
                            <div className="text-sm text-gray-700 leading-relaxed">
                                <p className="font-bold text-gray-900">{addr.recipient_name}</p>
                                {addr.recipient_phone && <p>{addr.recipient_phone}</p>}
                                <p>{addr.address_line1}</p>
                                {addr.area && <p>{addr.area}</p>}
                                <p>{[addr.city, addr.district, addr.division].filter(Boolean).join(', ')}{addr.postal_code ? ` - ${addr.postal_code}` : ''}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">{data.buyer_email}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment</p>
                        <p className="text-sm text-gray-700">
                            <span className="font-bold">Email:</span> {data.buyer_email || '—'}
                        </p>
                    </div>
                </div>

                {/* Items table */}
                <table className="w-full mb-8 border-t border-gray-200">
                    <thead>
                        <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                            <th className="text-left py-3 font-semibold">Item</th>
                            <th className="text-right py-3 font-semibold">Unit Price</th>
                            <th className="text-right py-3 font-semibold">Qty</th>
                            <th className="text-right py-3 font-semibold">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((it) => (
                            <tr key={it.id} className="border-b border-gray-100">
                                <td className="py-3 text-sm text-gray-700">
                                    {it.product_name_snapshot}
                                    {it.variant_name && (
                                        <span className="text-gray-400 text-xs ml-1">({it.variant_name})</span>
                                    )}
                                </td>
                                <td className="text-right py-3 text-sm text-gray-700">৳{Number(it.unit_price).toLocaleString()}</td>
                                <td className="text-right py-3 text-sm text-gray-700">{it.quantity}</td>
                                <td className="text-right py-3 text-sm text-gray-900 font-semibold">৳{Number(it.line_total).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-72 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>৳{Number(data.subtotal).toLocaleString()}</span>
                        </div>
                        {Number(data.discount_amount) > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Discount</span>
                                <span>-৳{Number(data.discount_amount).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                            <span>Delivery</span>
                            <span>৳{Number(data.delivery_fee).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-300">
                            <span>Total</span>
                            <span>৳{Number(data.total_amount).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-400 mt-12 pt-4 border-t border-gray-100">
                    <p>Thank you for shopping with CampusHat.</p>
                    <p className="mt-1">For support, contact your seller via the order page.</p>
                </div>
            </div>
        </>
    )
}
