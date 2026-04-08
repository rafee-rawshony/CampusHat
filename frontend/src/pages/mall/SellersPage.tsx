import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { LazyImage } from '@/components/ui/LazyImage'
import { Store, Star, MapPin } from 'lucide-react'

export default function SellersPage() {
  // We'll fetch featured sellers and maybe paginated sellers later
  const { data: featured, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['featured-sellers'],
    queryFn: () => api.get('/sellers/featured/').then(r => r.data.data),
    staleTime: 300_000
  })

  // For this initial slice, we'll duplicate the featured list to represent "All Sellers". 
  // In a real Phase 05, this would hit `/sellers/stores/` with pagination.
  const sellersList = featured?.results || []

  return (
    <>
      <Helmet><title>Campus Sellers | CampusHat</title></Helmet>
      
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Discover Campus Stores</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Support your fellow students by shopping from verified student-run businesses across different campuses.
            </p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="text-brand-primary" /> All Registered Sellers
            </h2>
            <div className="flex gap-2">
              <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-brand-primary bg-white cursor-pointer shadow-sm">
                <option>All Campuses</option>
                <option>My Campus</option>
              </select>
            </div>
          </div>

          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-2xl" />)}
            </div>
          ) : !sellersList || sellersList.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border text-center text-gray-500">
              No sellers found currently active.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sellersList.map((seller: any) => (
                <Link
                  key={seller.id}
                  to={`/sellers/${seller.slug}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-brand-primary/30 transition-all p-6 group flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-white shadow-sm overflow-hidden mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300">
                    {seller.logo_url ? (
                      <LazyImage src={seller.logo_url} alt={seller.store_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-300 bg-gray-100">
                         {seller.store_name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand-primary transition-colors mb-1 truncate w-full">
                    {seller.store_name}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-3 justify-center w-full truncate">
                    <MapPin size={14} className="shrink-0" /> {seller.campus_name || 'Verified Seller'}
                  </div>

                  <div className="flex items-center gap-3 text-sm mt-auto">
                    <span className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-50 px-2 py-0.5 rounded-md">
                      <Star size={14} fill="currentColor" /> {seller.rating?.toFixed(1) || '4.5'}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600 font-medium">{seller.total_products || 0} Products</span>
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
