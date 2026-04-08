import { Link } from 'react-router-dom'
import { LazyImage } from '@/components/ui/LazyImage'
import { Store } from 'lucide-react'

export function BestSellersSection({ sellers }: { sellers: any[] }) {
  if (!sellers || sellers.length === 0) return null

  return (
    <div className="py-12 bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="text-brand-primary" /> Campus Top Sellers
          </h2>
          <Link to="/sellers" className="text-brand-primary font-bold hover:underline text-sm md:text-base">
            View All Stores →
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-6 no-scrollbar snap-x">
          {sellers.map((seller: any) => (
            <Link
              key={seller.id}
              to={`/sellers/${seller.slug}`}
              className="snap-start shrink-0 w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-5 flex items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border">
                {seller.logo_url ? (
                  <LazyImage
                    src={seller.logo_url}
                    alt={seller.store_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 font-bold">
                    {seller.store_name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-gray-900 truncate group-hover:text-brand-primary transition-colors">
                  {seller.store_name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {seller.campus_name || 'Verified Seller'}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ★ {seller.rating?.toFixed(1) || '4.5'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
