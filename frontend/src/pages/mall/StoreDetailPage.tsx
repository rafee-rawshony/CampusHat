import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { ProductsGrid } from './components/ProductsGrid'
import { LazyImage } from '@/components/ui/LazyImage'
import { MapPin, Star, CalendarDays } from 'lucide-react'

export default function StoreDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: store, isLoading: isStoreLoading } = useQuery({
    queryKey: ['store', slug],
    // Hitting sellers endpoint based on Phase 05 design, fallback to featured 
    queryFn: () => api.get(`/sellers/featured/`).then(r => {
       const found = r.data.data.results.find((s: any) => s.slug === slug)
       return found
    }),
    enabled: !!slug
  })

  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ['store-products', slug],
    queryFn: () => api.get(`/mall/products/?store=${slug}`).then(r => r.data.data),
    enabled: !!slug
  })

  if (isStoreLoading) return <div className="min-h-screen py-20 text-center">Loading store profile...</div>
  if (!store) return <div className="min-h-screen py-20 text-center">Store not found</div>

  return (
    <>
      <Helmet><title>{store.store_name} | CampusHat</title></Helmet>
      
      <div className="bg-gray-50 min-h-screen pb-12">
        
        {/* Store Banner & Profile */}
        <div className="bg-white border-b shadow-sm relative mb-8">
          {/* Banner */}
          <div className="h-32 md:h-48 bg-gradient-to-r from-brand-primary/80 to-purple-800 w-full relative">
             <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 pb-8 sm:pb-6 relative">
             <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-end -mt-16 sm:-mt-12 relative z-10">
                {/* Logo */}
                <div className="w-32 h-32 rounded-xl bg-white border-4 border-white shadow-md overflow-hidden shrink-0">
                  {store.logo_url ? (
                     <LazyImage src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300 bg-gray-100">
                        {store.store_name?.charAt(0)}
                     </div>
                  )}
                </div>

                {/* Info Text */}
                <div className="flex-1 text-center sm:text-left mb-2">
                   <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center sm:justify-start gap-2">
                     {store.store_name} <span className="text-xs bg-brand-primary text-white px-2 py-0.5 rounded-full font-medium align-middle">Verified</span>
                   </h1>
                   <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-600">
                     <span className="flex items-center gap-1"><MapPin size={16}/> {store.campus_name || 'Global Campus'}</span>
                     <span className="flex items-center gap-1 text-yellow-600 font-medium"><Star size={16} fill="currentColor"/> {store.rating || '4.5'} Rating</span>
                     <span className="flex items-center gap-1"><CalendarDays size={16}/> Joined {new Date().getFullYear()}</span>
                   </div>
                </div>
             </div>
             
             {store.description && (
               <div className="mt-6 max-w-3xl text-gray-600 text-center sm:text-left text-sm bg-gray-50 p-4 rounded-xl border">
                 <p>{store.description}</p>
               </div>
             )}
          </div>
        </div>

        {/* Store Products */}
        <div className="max-w-7xl mx-auto px-4">
           <ProductsGrid products={products?.results || []} isLoading={isProductsLoading} title={`All Products from ${store.store_name}`} />
        </div>

      </div>
    </>
  )
}
