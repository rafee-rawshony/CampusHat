import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { X, Package, Clock, CheckCircle2, Search, Truck, AlertCircle } from 'lucide-react'

// Simple specific Status Modal rather than full shadcn Dialog
function ShipOrderModal({ isOpen, onClose, order, onSuccess }: any) {
  const [trackingNo, setTrackingNo] = useState('')
  const [courier, setCourier] = useState('Campus Dropoff')
  const [loading, setLoading] = useState(false)

  const handleShip = async () => {
    setLoading(true)
    try {
      await api.patch(`/seller/orders/${order.id}/`, {
        status: 'shipped',
        tracking_number: trackingNo,
        courier: courier
      })
      onSuccess()
    } catch (err) {
      console.error(err)
      alert("Failed to ship order")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Truck className="text-brand-primary" /> Ship Order #{order.order_number?.slice(-4) || order.id}
        </h2>
        <p className="text-sm text-gray-500 mb-6">Enter tracking details to notify the buyer.</p>

        <div className="space-y-4 mb-8">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Courier Service</label>
             <select className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary bg-white" value={courier} onChange={e => setCourier(e.target.value)}>
                <option value="Campus Dropoff">Campus Direct Dropoff</option>
                <option value="Pathao">Pathao / Courier</option>
                <option value="Other">Other</option>
             </select>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number / Meetup Location</label>
             <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand-primary" placeholder="e.g. Suhrawardy Hall Gate" value={trackingNo} onChange={e => setTrackingNo(e.target.value)} />
           </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
           <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
           <Button onClick={handleShip} disabled={loading}>{loading ? 'Updating...' : 'Confirm Shipment'}</Button>
        </div>
      </div>
    </div>
  )
}

export default function SellerOrdersPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('all')
  const [shippingOrder, setShippingOrder] = useState<any>(null)

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['seller-orders', activeTab],
    queryFn: () => {
       const statusParam = activeTab !== 'all' ? `&status=${activeTab}` : ''
       return api.get(`/seller/orders/?limit=50${statusParam}`).then(r => r.data.data)
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => api.patch(`/seller/orders/${id}/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
    }
  })

  // Format date
  const formatTime = (isoString?: string) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'To Ship' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ]

  return (
    <>
      <Helmet><title>Orders | Seller Center</title></Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-500 mt-1">Track and update the status of your customer orders.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
           <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
           <input type="text" placeholder="Search order ID..." className="w-full pl-10 pr-3 py-2 border rounded-lg focus:border-brand-primary outline-none text-sm" />
        </div>
      </div>

      {/* Horizontal Scroll Status Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar bg-white p-1 border rounded-xl shadow-sm">
         {tabs.map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition-colors ${
               activeTab === tab.id ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-sm' : 'text-gray-500 hover:bg-gray-50'
             }`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
         {isLoading ? (
            Array.from({length: 4}).map((_, i) => <div key={i} className="h-32 bg-white border border-gray-100 shadow-sm animate-pulse rounded-2xl" />)
         ) : !ordersData?.results || ordersData.results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
               <Package size={40} className="mx-auto text-gray-300 mb-3" />
               <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Found</h3>
               <p className="text-gray-500">You don't have any orders matching this status.</p>
            </div>
         ) : (
            ordersData.results.map((order: any) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                 
                 {/* Left details grid */}
                 <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
                         <h3 className="font-bold text-gray-900 text-base md:text-lg">Order #{order.order_number || order.id?.split('-')[0]}</h3>
                         <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md flex items-center gap-1.5 ${
                            order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-700 bg-opacity-70' :
                            'bg-gray-100 text-gray-600'
                         }`}>
                           {order.status === 'delivered' ? <CheckCircle2 size={12}/> : order.status === 'pending' ? <Clock size={12}/> : <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
                           {order.status}
                         </span>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-2 text-sm">
                         <div>
                           <p className="text-gray-500 text-xs uppercase mb-0.5 font-semibold tracking-wider">Date</p>
                           <p className="font-medium text-gray-900">{formatTime(order.created_at)}</p>
                         </div>
                         <div>
                           <p className="text-gray-500 text-xs uppercase mb-0.5 font-semibold tracking-wider">Customer</p>
                           <p className="font-medium text-gray-900 max-w-[120px] truncate">{order.user?.full_name || 'Guest'}</p>
                         </div>
                         <div>
                           <p className="text-gray-500 text-xs uppercase mb-0.5 font-semibold tracking-wider">Items</p>
                           <div className="flex -space-x-2 mt-1">
                             {order.items?.map((item: any, idx: number) => (
                               <img key={idx} src={item.product?.images?.[0]?.image_url || '/placeholder.png'} className="w-6 h-6 rounded-full border border-white ring-1 ring-gray-100 bg-gray-50 object-cover relative z-10" alt="" title={item.product?.name} />
                             ))}
                             <span className="text-xs font-bold text-gray-500 pl-4">{order.items?.length || 0}</span>
                           </div>
                         </div>
                         <div className="col-span-2 lg:col-span-3">
                           <p className="text-gray-500 text-xs uppercase mb-0.5 font-semibold tracking-wider flex items-center gap-1"><AlertCircle size={12}/> Delivery Address</p>
                           <p className="text-gray-800 font-medium truncate">{order.shipping_address || 'No address provided'}</p>
                           {order.contact_phone && <p className="text-gray-500 mt-1">📞 {order.contact_phone}</p>}
                         </div>
                      </div>
                    </div>
                 </div>

                 {/* Right action pane */}
                 <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 p-5 md:p-6 md:w-64 flex flex-col justify-center gap-4 shrink-0">
                    <div className="text-center md:text-right">
                       <p className="text-gray-500 text-sm mb-1 font-medium">Order Total</p>
                       <CurrencyDisplay amount={order.total_amount} className="text-2xl font-extrabold text-brand-primary" />
                    </div>

                    <div className="flex flex-col gap-2 mt-auto">
                       {order.status === 'pending' && (
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'processing' })}
                          >
                            Accept Order
                          </Button>
                       )}
                       {order.status === 'processing' && (
                          <Button 
                            className="w-full shadow-sm"
                            onClick={() => setShippingOrder(order)}
                          >
                            <Truck className="mr-2" size={16} /> Mark as Shipped
                          </Button>
                       )}
                       {order.status === 'shipped' && (
                          <Button 
                            variant="outline" 
                            className="w-full border-brand-primary text-brand-primary shadow-sm"
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'delivered' })}
                          >
                            Confirm Delivery
                          </Button>
                       )}
                       
                       {(order.status === 'pending' || order.status === 'processing') && (
                          <button 
                             className="text-xs text-red-600 font-bold py-2 hover:underline disabled:opacity-50 mt-1"
                             disabled={updateStatusMutation.isPending}
                             onClick={() => {
                               if (window.confirm('Cancel this order?')) {
                                 updateStatusMutation.mutate({ id: order.id, status: 'cancelled' })
                               }
                             }}
                          >
                             Cancel Order
                          </button>
                       )}
                    </div>
                 </div>
              </div>
            ))
         )}
      </div>

      <ShipOrderModal 
        isOpen={!!shippingOrder} 
        onClose={() => setShippingOrder(null)} 
        order={shippingOrder}
        onSuccess={() => {
           setShippingOrder(null)
           queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
        }}
      />
    </>
  )
}
