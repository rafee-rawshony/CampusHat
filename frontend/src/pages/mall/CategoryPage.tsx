import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { ProductsGrid } from './components/ProductsGrid'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  
  const { data: categories } = useQuery({ 
    queryKey: ['mall-categories'], 
    queryFn: () => api.get('/mall/categories/').then(r => r.data.data), 
    staleTime: 300_000 
  })
  
  const { data: products, isLoading } = useQuery({ 
    queryKey: ['category-products', slug], 
    queryFn: () => api.get(`/mall/products/?category=${slug}`).then(r => r.data.data), 
    enabled: !!slug 
  })

  const activeCategory = categories?.find((c: any) => c.slug === slug)

  return (
    <>
      <Helmet><title>{activeCategory ? `${activeCategory.name} | CampusHat` : 'Category | CampusHat'}</title></Helmet>
      
      <div className="bg-gray-50 py-8 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-24">
              <h3 className="font-bold text-lg mb-4 text-gray-900 border-b pb-2">Categories</h3>
              <ul className="space-y-2">
                {categories?.map((cat: any) => (
                  <li key={cat.id}>
                    <Link
                      to={`/categories/${cat.slug}`}
                      className={`block py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        slug === cat.slug 
                          ? 'bg-brand-primary/10 text-brand-primary' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeCategory ? activeCategory.name : 'Category Products'}
              </h1>
              {activeCategory?.description && (
                <p className="text-gray-500 mt-2">{activeCategory.description}</p>
              )}
            </div>

            <ProductsGrid products={products?.results || []} isLoading={isLoading} title="" />
          </main>
        </div>
      </div>
    </>
  )
}
