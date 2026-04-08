import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { Package, Clock, CheckCircle2, ChevronRight, XCircle } from 'lucide-react'

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/').then(r => r.data.data)
  })

  // Format date correctly
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get status badge UI
  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'delivered':
        return <span className="flex items-center gap-1 bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-md text-xs"><CheckCircle2 size={14}/> Delivered</span>
      case 'processing':
        return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-md text-xs"><Clock size={14}/> Processing</span>
      case 'shipped':
        return <span className="flex items-center gap-1 bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-md text-xs"><Package size={14}/> Shipped</span>
      case 'cancelled':
        return <span className="flex items-center gap-1 bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-md text-xs"><XCircle size={14}/> Cancelled</span>
      default:
        return <span className="flex items-center gap-1 bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-md text-xs"><Clock size={14}/> Pending</span>
    }
  }

  return (
    <>
      <Helmet><title>My Orders | CampusHat</title></Helmet>
      
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="text-brand-primary" /> My Orders
          </h1>

          {isLoading ? (
            <div className="space-y-4">
               {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />)}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border shadow-sm text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6">Looks like you haven't placed an order yet.</p>
              <Link to="/shop" className="bg-brand-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 block hover:shadow-md transition-shadow group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
                     <div>
                       <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-gray-900">Order #{order.order_number || order.id}</span>
                          {getStatusBadge(order.status)}
                       </div>
                       <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
                     </div>
                     <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                       <span className="text-sm text-gray-500 hidden sm:block">Total Amount</span>
                       <CurrencyDisplay amount={order.total_amount} className="font-bold text-lg text-gray-900" />
                     </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Show preview images */}
                      <div className="flex -space-x-3">
                        {order.items?.slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden ring-1 ring-gray-200 z-10">
                            <img src={item.product?.images?.[0]?.image_url || '/placeholder.png'} className="w-full h-full object-cover" alt="" />
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 ring-1 ring-gray-200 z-0">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {order.items?.length || 0} items
                      </span>
                    </div>

                    <div className="text-brand-primary font-bold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                      View Details <ChevronRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
