import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useModeStore } from '@/stores/mode.store'
import { Helmet } from 'react-helmet-async'

import { HeroCarousel } from './components/HeroCarousel'
import { FlashSaleSection } from './components/FlashSaleSection'
import { CategoriesSection } from './components/CategoriesSection'
import { BestSellersSection } from './components/BestSellersSection'
import { ProductsGrid } from './components/ProductsGrid'

export default function MallHomePage() {
  const { mode } = useModeStore()
  if (mode === 'marketplace') return <Navigate to='/marketplace' replace />

  // ALL sections use real API:
  const { data: banners } = useQuery({ 
    queryKey: ['banners'], 
    queryFn: () => api.get('/mall/banners/').then(r => r.data.data), 
    staleTime: 300_000 
  })
  
  const { data: flashSale } = useQuery({ 
    queryKey: ['flash-sales'], 
    queryFn: () => api.get('/mall/flash-sales/active/').then(r => r.data.data) 
  })
  
  const { data: categories } = useQuery({ 
    queryKey: ['mall-categories'], 
    queryFn: () => api.get('/mall/categories/').then(r => r.data.data), 
    staleTime: 300_000 
  })
  
  const { data: sellers } = useQuery({ 
    queryKey: ['featured-sellers'], 
    queryFn: () => api.get('/sellers/featured/').then(r => r.data.data), 
    staleTime: 300_000 
  })
  
  const { data: products, isLoading } = useQuery({ 
    queryKey: ['homepage-products'], 
    queryFn: () => api.get('/mall/products/?page=1').then(r => r.data.data) 
  })

  return (
    <>
      <Helmet><title>CampusHat — Campus Marketplace</title></Helmet>
      <HeroCarousel banners={banners?.results} />
      <FlashSaleSection data={flashSale} />
      <CategoriesSection categories={categories} />
      <BestSellersSection sellers={sellers?.results} />
      <ProductsGrid products={products?.results} isLoading={isLoading} />
    </>
  )
}
