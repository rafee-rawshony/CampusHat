import { Link } from 'react-router-dom'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { LazyImage } from '@/components/ui/LazyImage'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'

export function FlashSaleSection({ data }: { data: any }) {
  if (!data || !data.items || data.items.length === 0) return null

  return (
    <div className="bg-gray-50 py-8 border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-2xl font-bold">{data.title || 'Flash Sale'}</h2>
            {data.end_time && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Ends in:</span>
                <CountdownTimer targetDate={data.end_time} />
              </div>
            )}
          </div>
          <Link to="/flash-sales" className="text-brand-primary font-bold hover:underline text-sm md:text-base">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.items.slice(0, 5).map((item: any) => (
            <Link key={item.id} to={`/products/${item.product.slug}`} className="group drop-shadow-sm bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all border block relative">
              <div className="w-full aspect-square relative bg-gray-50">
                 <LazyImage src={item.product.images?.[0]?.image_url} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                 {item.discount_percentage && (
                   <div className="absolute top-2 left-2 bg-red-500 text-white font-bold text-xs px-2 py-1 rounded">
                     -{item.discount_percentage}%
                   </div>
                 )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px] mb-2">{item.product.name}</h3>
                <div className="flex flex-col gap-0.5">
                  <CurrencyDisplay amount={item.price} className="font-bold text-lg text-brand-primary" />
                  <CurrencyDisplay amount={item.product.regular_price} className="text-xs text-gray-400 line-through" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
