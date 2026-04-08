import { Link } from 'react-router-dom'
import { LazyImage } from '@/components/ui/LazyImage'

export function CategoriesSection({ categories }: { categories: any[] }) {
  if (!categories || categories.length === 0) return null

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <Link to="/categories" className="text-brand-primary font-bold hover:underline text-sm md:text-base">
            All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {categories.slice(0, 8).map((cat: any) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl hover:bg-brand-primary/5 hover:border-brand-primary/20 border border-transparent transition-all group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-white rounded-full p-3 shadow-sm group-hover:shadow-md transition-shadow">
                <LazyImage
                  src={cat.icon_url || cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-center text-gray-700 group-hover:text-brand-primary">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
