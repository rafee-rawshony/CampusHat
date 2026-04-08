import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { Filter } from 'lucide-react'
import { ProductsGrid } from './components/ProductsGrid'
import { FilterBottomSheet } from '@/components/layout/FilterBottomSheet'

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filters = {
    search:   searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    min_price:searchParams.get('min') || '',
    max_price:searchParams.get('max') || '',
    brand:    searchParams.get('brand') || '',
    ordering: searchParams.get('sort') || '-created_at',
    page:     searchParams.get('page') || '1',
  }

  const { data, isLoading } = useQuery({ 
    queryKey: ['shop-products', filters], 
    queryFn: () => api.get('/mall/products/', { params: filters }).then(r => r.data.data) 
  })

  const { data: categories } = useQuery({ 
    queryKey: ['mall-categories'], 
    queryFn: () => api.get('/mall/categories/').then(r => r.data.data), 
    staleTime: 300_000 
  })

  const updateFilter = (key: string, value: string) => {
    const current = new URLSearchParams(searchParams.toString())
    if (value) current.set(key, value)
    else current.delete(key)
    
    // Reset page if filtering changes
    if (key !== 'page') current.delete('page')
    
    setSearchParams(current)
  }

  return (
    <>
      <Helmet><title>Shop | CampusHat</title></Helmet>
      
      <div className="bg-gray-50 py-8 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border p-5 sticky top-24 space-y-6">
              
              <div>
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Categories</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => updateFilter('category', '')}
                      className={`text-sm w-full text-left py-1 hover:text-brand-primary ${!filters.category ? 'font-bold text-brand-primary' : 'text-gray-600'}`}
                    >
                      All Categories
                    </button>
                  </li>
                  {categories?.map((cat: any) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => updateFilter('category', cat.slug)}
                        className={`text-sm w-full text-left py-1 hover:text-brand-primary ${filters.category === cat.slug ? 'font-bold text-brand-primary' : 'text-gray-600'}`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full border rounded-md px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
                    value={filters.min_price}
                    onChange={(e) => updateFilter('min', e.target.value)}
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full border rounded-md px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
                    value={filters.max_price}
                    onChange={(e) => updateFilter('max', e.target.value)}
                  />
                </div>
              </div>

            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                {filters.search ? `Search results for "${filters.search}"` : 'All Products'}
              </h1>
              
              <div className="flex items-center gap-2">
                <button 
                  className="sm:hidden flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium text-gray-700 bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => setFiltersOpen(true)}
                >
                  <Filter size={16} /> Filters
                </button>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">Sort By:</span>
                  <select
                    className="border rounded-md px-3 py-1.5 text-sm outline-none focus:border-brand-primary bg-white cursor-pointer"
                    value={filters.ordering}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                  >
                    <option value="-created_at">Newest First</option>
                    <option value="price">Price (Low to High)</option>
                    <option value="-price">Price (High to Low)</option>
                    <option value="-sales_count">Best Sellers</option>
                  </select>
                </div>
              </div>
            </div>

            <ProductsGrid products={data?.results || []} isLoading={isLoading} title="" />

            {/* Simple Pagination */}
            {data?.count > 0 && Math.ceil(data.count/20) > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button 
                  disabled={filters.page === '1'}
                  onClick={() => updateFilter('page', String(parseInt(filters.page)-1))}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button 
                  disabled={parseInt(filters.page) >= Math.ceil(data.count/20)}
                  onClick={() => updateFilter('page', String(parseInt(filters.page)+1))}
                  className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <FilterBottomSheet isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} onApply={() => setFiltersOpen(false)}>
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Categories</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => updateFilter('category', '')}
                  className={`text-sm w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 ${!filters.category ? 'font-bold text-brand-primary bg-brand-primary/5' : 'text-gray-600'}`}
                >
                  All Categories
                </button>
              </li>
              {categories?.map((cat: any) => (
                <li key={cat.id}>
                  <button
                    onClick={() => updateFilter('category', cat.slug)}
                    className={`text-sm w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 ${filters.category === cat.slug ? 'font-bold text-brand-primary bg-brand-primary/5' : 'text-gray-600'}`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Price Range</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-primary"
                value={filters.min_price}
                onChange={(e) => updateFilter('min', e.target.value)}
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-primary"
                value={filters.max_price}
                onChange={(e) => updateFilter('max', e.target.value)}
              />
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Sort By</h3>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-primary bg-white cursor-pointer"
              value={filters.ordering}
              onChange={(e) => updateFilter('sort', e.target.value)}
            >
              <option value="-created_at">Newest First</option>
              <option value="price">Price (Low to High)</option>
              <option value="-price">Price (High to Low)</option>
              <option value="-sales_count">Best Sellers</option>
            </select>
          </div>
        </div>
      </FilterBottomSheet>
    </>
  )
}
