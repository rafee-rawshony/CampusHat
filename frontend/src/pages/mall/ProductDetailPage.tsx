import { useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { Helmet } from 'react-helmet-async'
import { LazyImage } from '@/components/ui/LazyImage'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { Button } from '@/components/ui/button'
import { Minus, Plus, ShoppingBag, Store, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import { useSwipe } from '@/hooks/useSwipe'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { addItem, setIsOpen } = useCartStore()

  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const { data: product, isLoading } = useQuery({ 
    queryKey: ['product', slug], 
    queryFn: () => api.get(`/mall/products/${slug}/`).then(r => r.data.data), 
    enabled: !!slug 
  })

  // Swipe for mobile gallery
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (product?.images?.length > 1) {
        setActiveImageIndex(p => (p + 1) % product.images.length)
      }
    },
    onSwipeRight: () => {
      if (product?.images?.length > 1) {
        setActiveImageIndex(p => (p === 0 ? product.images.length - 1 : p - 1))
      }
    }
  })

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }
    
    addItem({
      id: String(product.id),
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.images?.[0]?.image_url,
      store: product.store?.store_name
    })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    if (isAuthenticated) {
      setIsOpen(false)
      navigate('/checkout')
    }
  }

  if (isLoading) return <div className="min-h-screen py-20 text-center">Loading product...</div>
  if (!product) return <div className="min-h-screen py-20 text-center">Product not found</div>

  return (
    <>
      <Helmet><title>{product.name} | CampusHat</title></Helmet>
      
      <div className="bg-gray-50 min-h-screen pb-24 sm:pb-8">
        
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
          <Link to="/" className="hover:text-brand-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/categories/${product.category?.slug}`} className="hover:text-brand-primary">{product.category?.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col md:flex-row">
            
            {/* Left: Image Gallery */}
            <div className="w-full md:w-1/2 p-4 md:p-8 md:border-r">
              <div 
                className="w-full aspect-square rounded-xl bg-gray-50 border relative overflow-hidden mb-4"
                {...swipeHandlers}
              >
                <LazyImage
                  src={product.images?.[activeImageIndex]?.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
                
                {product.images?.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {product.images.map((_: any, idx: number) => (
                      <div key={idx} className={`w-2 h-2 rounded-full ${idx === activeImageIndex ? 'bg-brand-primary' : 'bg-gray-300'}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {product.images?.length > 1 && (
                <div className="hidden sm:flex gap-3 overflow-x-auto pb-2 snap-x">
                  {product.images.map((img: any, idx: number) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-20 h-20 shrink-0 rounded-lg border-2 overflow-hidden snap-start ${idx === activeImageIndex ? 'border-brand-primary shadow-sm' : 'border-gray-200 hover:border-brand-primary/50'}`}
                    >
                      <LazyImage src={img.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-5 md:p-8 flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className="text-yellow-500 font-bold">★ {product.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{product.sales_count || 0} Sold</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <div className="flex items-end gap-3">
                  <CurrencyDisplay amount={product.price} className="text-3xl font-extrabold text-brand-primary" />
                  {product.price < product.regular_price && (
                    <>
                      <CurrencyDisplay amount={product.regular_price} className="text-lg text-gray-400 line-through pb-1" />
                      <span className="bg-red-100 text-red-600 font-bold text-sm px-2 py-1 rounded-lg pb-1">
                        -{Math.round(((product.regular_price - product.price) / product.regular_price) * 100)}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {product.short_description || product.description}
                </p>
              </div>

              {/* Desktop Actions */}
              <div className="hidden sm:block mt-auto border-t pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-semibold text-gray-700 w-20">Quantity:</span>
                  <div className="flex items-center gap-2 bg-gray-50 border rounded-lg h-10 w-32">
                    <button 
                      className="w-10 h-full flex items-center justify-center hover:bg-gray-200 transition-colors rounded-l-lg disabled:opacity-50"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center font-semibold">{quantity}</span>
                    <button 
                      className="w-10 h-full flex items-center justify-center hover:bg-gray-200 transition-colors rounded-r-lg"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.stock > 0 ? `${product.stock} items available` : 'Out of stock'}
                  </span>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="flex-1 py-6 border-brand-primary text-brand-primary hover:bg-brand-primary/5"
                    onClick={() => {
                      handleAddToCart()
                      setIsOpen(true)
                    }}
                    disabled={product.stock <= 0}
                  >
                    <ShoppingBag className="mr-2" size={20} /> Add to Cart
                  </Button>
                  <Button 
                    size="lg" 
                    className="flex-1 py-6"
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-6 text-sm">
                <div className="flex items-start gap-3">
                  <Truck className="text-gray-400 shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">Delivery Info</p>
                    <p className="text-gray-500">Campus drop-off available. 2-3 days.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-green-500 shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">Buyer Protection</p>
                    <p className="text-gray-500">Secure payments via SSLCommerz.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="text-gray-400 shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900">Return Policy</p>
                    <p className="text-gray-500">3 days easy return if product mismatched.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          {/* Store info banner */}
          {product.store && (
             <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border font-bold text-gray-500 overflow-hidden">
                     {product.store.logo_url ? <LazyImage src={product.store.logo_url} alt="" className="w-full h-full object-cover" /> : product.store.store_name.charAt(0)}
                   </div>
                   <div>
                      <p className="text-sm text-gray-500">Sold by</p>
                      <Link to={`/sellers/${product.store.slug}`} className="font-bold text-gray-900 hover:text-brand-primary">
                        {product.store.store_name}
                      </Link>
                   </div>
                </div>
                <Link to={`/sellers/${product.store.slug}`}>
                  <Button variant="outline" size="sm" className="hidden sm:flex rounded-full">
                    <Store className="mr-2" size={14} /> Visit Store
                  </Button>
                </Link>
             </div>
          )}

          {/* Description Section */}
          <div className="mt-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b">Product Description</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: product.description}}>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-3 sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[calc(12px+env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
             <Button 
               variant="outline" 
               className="flex-1 border-brand-primary text-brand-primary hover:bg-brand-primary/5 h-11"
               onClick={() => {
                 handleAddToCart()
                 setIsOpen(true)
               }}
               disabled={product.stock <= 0}
             >
               <ShoppingBag size={18} />
             </Button>
             <Button 
               className="flex-[2] h-11 font-bold text-base"
               onClick={handleBuyNow}
               disabled={product.stock <= 0}
             >
               Buy Now
             </Button>
          </div>
        </div>
      </div>
    </>
  )
}
