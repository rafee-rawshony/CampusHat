import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { Package, ShoppingBag, Eye, TrendingUp, Calendar, ChevronRight, Wallet } from 'lucide-react'

export default function SellerDashboardPage() {
  const [period, setPeriod] = useState<'10d'|'1m'>('10d')

  // Real API fetching
  const { data: stats, isLoading: statsLoading } = useQuery({ 
    queryKey: ['seller-stats'], 
    queryFn: () => api.get('/seller/dashboard/stats/').then(r => r.data.data),
    refetchInterval: 30_000 // Refetch every 30s
  })

  const { data: revenue, isLoading: revenueLoading } = useQuery({ 
    queryKey: ['seller-revenue', period], 
    queryFn: () => api.get(`/seller/analytics/revenue/?period=${period}`).then(r => r.data.data) 
  })

  // We only fetch 5 for dashboard
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({ 
    queryKey: ['seller-recent-orders'], 
    queryFn: () => api.get('/seller/orders/?limit=5&ordering=-created_at').then(r => r.data.data.results) 
  })

  // Recharts tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-brand-primary font-bold">৳{payload[0].value}</span>
            <span className="text-gray-500 text-xs">Revenue</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Dashboard KPI Card
  const StatCard = ({ title, value, icon: Icon, trend, prefix }: any) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 flex items-end gap-2">
           {prefix === 'BDT' ? <CurrencyDisplay amount={value || 0} /> : value || 0}
           {trend && <span className="text-xs text-green-500 font-semibold mb-1 flex items-center"><TrendingUp size={12} className="mr-0.5" /> +{trend}%</span>}
        </h3>
      </div>
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-brand-primary">
         <Icon size={24} />
      </div>
    </div>
  )

  return (
    <>
      <Helmet><title>Dashboard | Seller Center</title></Helmet>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Store Overview</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your store today.</p>
      </div>

      {statsLoading ? (
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-white border border-gray-100 shadow-sm animate-pulse rounded-2xl" />)}
         </div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
           <StatCard title="Total Revenue" value={stats?.total_revenue} prefix="BDT" icon={Wallet} trend={12} />
           <StatCard title="Active Orders" value={stats?.active_orders} icon={ShoppingBag} />
           <StatCard title="Store Views" value={stats?.store_views || 1024} icon={Eye} trend={4} />
         </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
           <div>
             <h2 className="text-lg font-bold text-gray-900">Revenue Analytics</h2>
             <p className="text-sm text-gray-500">Track your sales performance over time.</p>
           </div>
           
           <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border">
              <button 
                onClick={() => setPeriod('10d')} 
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === '10d' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-900'}`}
              >
                10 Days
              </button>
              <button 
                onClick={() => setPeriod('1m')} 
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${period === '1m' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500 hover:text-gray-900'}`}
              >
                1 Month
              </button>
           </div>
         </div>

         <div className="h-[300px] w-full">
            {revenueLoading ? (
               <div className="w-full h-full bg-gray-50 animate-pulse rounded-xl" />
            ) : !revenue || revenue.length === 0 ? (
               <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Calendar size={32} className="mb-2 opacity-50" />
                  <p>No revenue data for this period.</p>
               </div>
            ) : (
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                       dataKey="date" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#9ca3af', fontSize: 12 }}
                       dy={10}
                    />
                    <YAxis 
                       hide 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                       type="monotone" 
                       dataKey="value" 
                       stroke="#8b5cf6" 
                       strokeWidth={3}
                       fillOpacity={1} 
                       fill="url(#colorValue)" 
                    />
                  </AreaChart>
               </ResponsiveContainer>
            )}
         </div>
      </div>

      {/* Recent Orders */}
      <div>
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
           <Link to="/seller/orders" className="text-brand-primary font-medium hover:underline text-sm flex items-center gap-1">
             View All <ChevronRight size={16} />
           </Link>
         </div>
         
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {ordersLoading ? (
               <div className="p-6 text-center text-gray-400">Loading orders...</div>
            ) : !recentOrders || recentOrders.length === 0 ? (
               <div className="p-8 text-center text-gray-500">
                  <Package size={32} className="mx-auto text-gray-300 mb-2" />
                  <p>You have no recent orders.</p>
               </div>
            ) : (
               <div className="divide-y">
                 {recentOrders.map((order: any) => (
                   <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center font-bold">
                            #{order.order_number?.slice(-4) || order.id}
                         </div>
                         <div>
                            <p className="font-bold text-gray-900 line-clamp-1">{order.items?.[0]?.product?.name || 'Multiple Items'}</p>
                            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                         <CurrencyDisplay amount={order.total_amount} className="font-bold text-gray-900" />
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 uppercase ${
                           order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                           order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                           order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                           order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                           'bg-gray-100 text-gray-700'
                         }`}>
                           {order.status}
                         </span>
                      </div>
                   </div>
                 ))}
               </div>
            )}
         </div>
      </div>
    </>
  )
}
