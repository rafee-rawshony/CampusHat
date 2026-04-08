import { Link } from 'react-router-dom'
import { LazyImage } from '@/components/ui/LazyImage'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

interface ProductsGridProps {
  products: any[]
  isLoading: boolean
  title?: string
}

export function ProductsGrid({ products, isLoading, title = "Recommended for You" }: ProductsGridProps) {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 border-t pt-6">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          ) : !products || products.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              No products found.
            </div>
          ) : (
            products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="group flex flex-col bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 relative h-[320px]"
              >
                <div className="w-full h-48 bg-gray-50 relative overflow-hidden shrink-0">
                  <LazyImage
                    src={product.images?.[0]?.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Badge */}
                  {product.is_active && product.stock > 0 && product.price < product.regular_price && (
                     <div className="absolute top-2 left-2 bg-red-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">
                       Sale
                     </div>
                  )}
                </div>
                
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight mb-1 flex-1">
                    {product.name}
                  </h3>
                  
                  <div className="mt-auto">
                    <p className="text-xs text-brand-primary font-medium mb-1 line-clamp-1">{product.store?.store_name}</p>
                    <div className="flex items-end gap-1.5">
                      <CurrencyDisplay amount={product.price} className="font-bold text-brand-primary" />
                      {product.price < product.regular_price && (
                        <CurrencyDisplay amount={product.regular_price} className="text-xs text-gray-400 line-through pb-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
