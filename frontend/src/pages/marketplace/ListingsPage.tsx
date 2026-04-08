import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useCampusStore } from '@/stores/campus.store'
import { Helmet } from 'react-helmet-async'
import { LazyImage } from '@/components/ui/LazyImage'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { ArrowLeft, Search, Filter } from 'lucide-react'

export default function ListingsPage() {
  const { type } = useParams<{ type: string }>()  // buy/rental/service/food
  const { selectedCampus } = useCampusStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const searchQuery = searchParams.get('q') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace-listings', type, selectedCampus, searchParams.toString()],
    queryFn: () => api.get('/marketplace/listings/', { 
       params: {
         post_type: type,
         university: selectedCampus || undefined,
         search: searchParams.get('q') || undefined,
       }
    }).then(r => r.data.data),
  })

  // Format title
  const titleMap: Record<string, string> = {
    'buy': 'Buy & Sell',
    'rental': 'Student Rentals',
    'service': 'Services',
    'food': 'Food & Snacks'
  }
  const pageTitle = type ? titleMap[type] || 'Listings' : 'Listings'

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get('q') as string
    
    const current = new URLSearchParams(searchParams.toString())
    if (q) current.set('q', q)
    else current.delete('q')
    
    setSearchParams(current)
  }

  return (
    <>
      <Helmet><title>{pageTitle} | Campus Marketplace</title></Helmet>
      
      <div className="bg-gray-50 min-h-screen py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link to="/marketplace" className="p-2 bg-white border rounded-lg text-gray-500 hover:text-brand-primary transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input 
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search listings..." 
                  className="w-full pl-10 pr-3 py-2 bg-white border rounded-lg focus:border-brand-primary outline-none shadow-sm"
                />
              </div>
              <button type="button" className="p-2.5 bg-white border rounded-lg text-gray-600 hover:text-brand-primary shadow-sm hidden sm:block">
                <Filter size={18} />
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
             <span>Showing {data?.count || 0} listings {searchQuery ? `for "${searchQuery}"` : ''}</span>
             {selectedCampus && <span className="bg-brand-primary/10 text-brand-primary px-2 py-1 rounded font-medium">Campus Filtered</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
            ) : !data?.results || data.results.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white border rounded-xl shadow-sm">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Search size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-1">No listings found</h3>
                 <p className="text-gray-500">Try adjusting your search or campus filter.</p>
              </div>
            ) : (
              data.results.map((item: any) => (
                <Link key={item.id} to={`/marketplace/listings/${item.slug || item.id}`} className="group bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col h-[280px]">
                  <div className="w-full h-40 bg-gray-50 relative overflow-hidden shrink-0">
                    <LazyImage src={item.images?.[0]?.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {item.condition || 'New'}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-2 grow">{item.title}</h3>
                    <div className="mt-auto">
                      <CurrencyDisplay amount={item.price} className="font-bold text-brand-primary text-lg" />
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{item.university?.name || 'All Campuses'}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  )
}
