import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { useCampusStore } from '@/stores/campus.store'
import { Helmet } from 'react-helmet-async'
import { Plus, ShoppingCart, Key, Briefcase, UtensilsCrossed } from 'lucide-react'
import { VerificationRequiredCard } from './components/VerificationRequiredCard'
import { LazyImage } from '@/components/ui/LazyImage'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

function MarketplaceSection({ title, type, campusId, icon: Icon }: { title: string, type: string, campusId: string | null, icon: any }) {
  const { data: listings, isLoading } = useQuery({
    queryKey: ['marketplace-recent', type, campusId],
    queryFn: () => api.get('/marketplace/listings/', { params: { post_type: type, university: campusId || undefined } }).then(r => r.data.data.results),
  })

  // If we have loaded and found nothing, don't show the section.
  if (!isLoading && (!listings || listings.length === 0)) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-900">
          <span className="p-1.5 bg-brand-primary/10 text-brand-primary rounded-lg shrink-0"><Icon size={20} /></span>
          {title}
        </h2>
        <Link to={`/marketplace/${type}`} className="text-brand-primary font-bold hover:underline text-sm md:text-base">
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          listings?.slice(0, 5).map((item: any) => (
            <Link key={item.id} to={`/marketplace/listings/${item.slug || item.id}`} className="group bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-full aspect-square bg-gray-50 relative overflow-hidden">
                <LazyImage src={item.images?.[0]?.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {item.condition || 'New'}
                </div>
              </div>
              <div className="p-3 flex flex-col">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px] mb-2">{item.title}</h3>
                <CurrencyDisplay amount={item.price} className="font-bold text-brand-primary text-lg" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const { canAccessMarketplace } = useAuthStore()
  const { selectedCampus } = useCampusStore()
  const [showVerCard, setShowVerCard] = useState(false)
  const navigate = useNavigate()

  const categories = [
    { title: 'Buy & Sell', icon: ShoppingCart, type: 'buy', color: 'bg-purple-100 text-purple-600' },
    { title: 'Rentals', icon: Key, type: 'rental', color: 'bg-green-100 text-green-600' },
    { title: 'Services', icon: Briefcase, type: 'service', color: 'bg-blue-100 text-blue-600' },
    { title: 'Food', icon: UtensilsCrossed, type: 'food', color: 'bg-orange-100 text-orange-600' },
  ]

  return (
    <>
      <Helmet><title>Campus Marketplace | CampusHat</title></Helmet>

      <div className="bg-gray-50 min-h-screen pb-20 sm:pb-8">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-brand-primary to-purple-800 text-white py-12 md:py-16 px-4 relative overflow-hidden">
           <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 drop-shadow-md">Buy, Trade, and Connect.</h1>
                <p className="text-lg md:text-xl text-white/90 max-w-xl">
                  The exclusive student-to-student marketplace for notes, tech, rentals, and more.
                </p>
              </div>
              
              <div className="w-full md:w-auto mt-6 md:mt-0 flex gap-4 w-full md:w-auto">
                 <button 
                   onClick={() => {
                     if (!canAccessMarketplace()) { setShowVerCard(true); return }
                     navigate('/marketplace/post')
                   }}
                   className="hidden sm:flex items-center gap-2 px-6 py-3.5 bg-white text-brand-primary font-bold rounded-xl shadow-lg hover:bg-gray-50 hover:shadow-xl transition-all"
                 >
                   <Plus size={20} /> Post an Ad
                 </button>
                 <Link to="/marketplace/explorer" className="flex-1 md:flex-none text-center px-6 py-3.5 bg-brand-primary-700/50 backdrop-blur-md border border-white/20 text-white font-bold rounded-xl hover:bg-brand-primary-700 transition-all">
                   Explore Map
                 </Link>
              </div>
           </div>
           {/* Abstract BG */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
           
           {/* Categories Wrapper */}
           <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 mb-12 flex items-center justify-between overflow-x-auto no-scrollbar gap-4 sm:gap-6">
              {categories.map(cat => (
                <Link key={cat.type} to={`/marketplace/${cat.type}`} className="flex flex-col items-center gap-3 group min-w-[80px]">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform duration-300 shadow-sm border border-transparent group-hover:border-current/20`}>
                     <cat.icon size={24} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-900">{cat.title}</span>
                </Link>
              ))}
           </div>

           {/* Sections mapping to endpoints */}
           <MarketplaceSection title="Fresh Listings" type="buy" campusId={selectedCampus} icon={ShoppingCart} />
           <MarketplaceSection title="Student Housing & Rentals" type="rental" campusId={selectedCampus} icon={Key} />
           <MarketplaceSection title="Campus Services" type="service" campusId={selectedCampus} icon={Briefcase} />
           <MarketplaceSection title="Late Night Food" type="food" campusId={selectedCampus} icon={UtensilsCrossed} />
           
        </div>

        {/* Mobile FAB — sm:hidden */}
        <button onClick={() => {
            if (!canAccessMarketplace()) { setShowVerCard(true); return }
            navigate('/marketplace/post')
          }}
          className='fixed sm:hidden z-40 right-4 bottom-[76px]
                     w-14 h-14 rounded-full bg-brand-primary text-white
                     shadow-lg shadow-brand-primary/40 flex items-center justify-center active:scale-95 transition-transform'>
          <Plus className='w-7 h-7' />
        </button>

        {showVerCard && <VerificationRequiredCard onDismiss={() => setShowVerCard(false)} />}
      </div>
    </>
  )
}
