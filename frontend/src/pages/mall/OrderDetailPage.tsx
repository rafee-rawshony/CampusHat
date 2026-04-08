import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { Package, ArrowLeft, MapPin, Phone, CreditCard } from 'lucide-react'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}/`).then(r => r.data.data),
    enabled: !!id
  })

  if (isLoading) return <div className="min-h-screen py-20 text-center">Loading order details...</div>
  if (!order) return <div className="min-h-screen py-20 text-center">Order not found</div>

  const timelineSteps = [
    { status: 'pending', label: 'Order Placed' },
    { status: 'processing', label: 'Processing' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' }
  ]

  const currentStatusIndex = timelineSteps.findIndex(s => s.status === order.status?.toLowerCase())

  return (
    <>
      <Helmet><title>Order #{order.order_number || order.id} | CampusHat</title></Helmet>
      
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          
          <Link to="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-primary font-medium mb-6">
            <ArrowLeft size={18} /> Back to Orders
          </Link>

          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Left: Main Details */}
            <div className="flex-[2] space-y-6">
              
              {/* Header & Status Timeline */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between border-b pb-4 mb-6">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Order #{order.order_number || order.id}</h1>
                    <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-md text-sm uppercase tracking-wider">
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Timeline UI */}
                {order.status !== 'cancelled' && (
                  <div className="relative pt-4 pb-2">
                     <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full mx-6 md:mx-12 hidden md:block" />
                     <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 relative z-10">
                        {timelineSteps.map((step, idx) => {
                           const isCompleted = currentStatusIndex >= idx
                           const isCurrent = currentStatusIndex === idx
                           
                           return (
                             <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-2">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 outline outline-4 outline-white ${
                                 isCompleted ? 'bg-brand-primary border-brand-primary text-white' : 'bg-gray-200 border-gray-200 text-gray-400'
                               }`}>
                                 {isCompleted && <Package size={14} />}
                               </div>
                               <div className="md:text-center">
                                 <p className={`font-bold text-sm ${isCurrent ? 'text-brand-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                   {step.label}
                                 </p>
                                 {isCurrent && <p className="text-xs text-brand-primary mt-0.5">Current Status</p>}
                               </div>
                             </div>
                           )
                        })}
                     </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4 border-b pb-3">Items in your order</h2>
                <div className="space-y-4">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-50 border rounded-lg overflow-hidden shrink-0">
                        <img src={item.product?.images?.[0]?.image_url || '/placeholder.png'} className="w-full h-full object-cover" alt={item.product?.name} />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-2 pr-4">{item.product?.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <CurrencyDisplay amount={item.price} className="font-bold text-gray-900" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right: Summary & Info */}
            <div className="flex-1 space-y-6">
               
               {/* Order Summary */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold mb-4 border-b pb-3">Order Summary</h2>
                  <div className="space-y-3 pt-2 pb-4 border-b text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <CurrencyDisplay amount={order.total_amount - (order.shipping_fee || 50)} />
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping Fee</span>
                      <CurrencyDisplay amount={order.shipping_fee || 50} />
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-4 text-gray-900">
                    <span>Total</span>
                    <CurrencyDisplay amount={order.total_amount} />
                  </div>
               </div>

               {/* Delivery Info */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold mb-4 border-b pb-3">Delivery Info</h2>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3 text-gray-700">
                      <MapPin size={18} className="text-gray-400 shrink-0" />
                      <span>{order.shipping_address}</span>
                    </div>
                    <div className="flex gap-3 text-gray-700">
                      <Phone size={18} className="text-gray-400 shrink-0" />
                      <span>{order.contact_phone}</span>
                    </div>
                  </div>
               </div>

               {/* Payment Info */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold mb-4 border-b pb-3">Payment Details</h2>
                  <div className="flex items-center gap-3 text-gray-700 text-sm">
                    <CreditCard size={18} className="text-gray-400" />
                    <div>
                      <span className="uppercase font-semibold">{order.payment_method}</span>
                      <p className="text-green-600 font-medium text-xs mt-0.5">
                        {order.payment_status === 'paid' ? 'Paid Successfully' : 'Payment Pending'}
                      </p>
                    </div>
                  </div>
               </div>

            </div>
          </div>

        </div>
      </div>
    </>
  )
}
