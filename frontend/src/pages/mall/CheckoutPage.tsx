import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { MapPin, Phone, User, CreditCard } from 'lucide-react'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = getTotalPrice()
  const shippingFee = items.length > 0 ? 50 : 0
  const total = subtotal + shippingFee

  // Default address fields (ideally from user profile API)
  const [address, setAddress] = useState({
    name: user?.full_name || '',
    phone: '',
    hall: '',
    room: '',
    notes: ''
  })

  useEffect(() => {
    // If cart is empty, send them back to shop
    if (items.length === 0 && !isSubmitting) {
      navigate('/shop', { replace: true })
    }
  }, [items, navigate, isSubmitting])

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setIsSubmitting(true)
    setError(null)
    
    try {
      const payload = {
        items: items.map(i => ({
          product_id: i.id,
          quantity: i.quantity
        })),
        shipping_address: `${address.hall}, Room ${address.room}`,
        contact_phone: address.phone,
        order_notes: address.notes,
        payment_method: 'sslcommerz' // Required for API
      }

      const res = await api.post('/orders/checkout/', payload)
      const data = res.data.data
      
      clearCart() // Clean cart on successful order placement

      if (data.payment_url) {
        // Redirect to SSLCommerz gateway
        window.location.href = data.payment_url
      } else {
        // Fallback or COD success
        navigate(`/orders/${data.order_id}?success=1`, { replace: true })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (items.length === 0 && !isSubmitting) return null

  return (
    <>
      <Helmet><title>Checkout | CampusHat</title></Helmet>
      
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

          <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Col: Delivery & Payment Details */}
            <div className="flex-1 space-y-6">
               
               {/* Delivery Address */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-3">
                    <MapPin className="text-brand-primary" size={20} /> Delivery Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          required
                          type="text"
                          className="w-full pl-10 pr-3 py-2 border rounded-lg outline-none focus:border-brand-primary"
                          value={address.name}
                          onChange={(e) => setAddress({...address, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          required
                          type="tel"
                          placeholder="e.g. 017xxxxxxxx"
                          className="w-full pl-10 pr-3 py-2 border rounded-lg outline-none focus:border-brand-primary"
                          value={address.phone}
                          onChange={(e) => setAddress({...address, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hall / Building</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Suhrawardy Hall"
                          className="w-full px-3 py-2 border rounded-lg outline-none focus:border-brand-primary"
                          value={address.hall}
                          onChange={(e) => setAddress({...address, hall: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room No.</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. 204"
                          className="w-full px-3 py-2 border rounded-lg outline-none focus:border-brand-primary"
                          value={address.room}
                          onChange={(e) => setAddress({...address, room: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg outline-none focus:border-brand-primary resize-none"
                        rows={2}
                        placeholder="Any special instructions for picking up..."
                        value={address.notes}
                        onChange={(e) => setAddress({...address, notes: e.target.value})}
                      />
                    </div>
                  </div>
               </div>

               {/* Payment Method */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-3">
                    <CreditCard className="text-brand-primary" size={20} /> Payment Method
                  </h2>
                  <div className="p-4 border border-brand-primary/20 bg-brand-primary/5 rounded-lg flex items-center justify-between">
                     <span className="font-semibold text-gray-900">SSLCommerz (Online Payment)</span>
                     <div className="w-4 h-4 rounded-full border-4 border-brand-primary bg-white"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    You will be redirected to the SSLCommerz secure payment gateway to complete your purchase using bKash, SSL, or Cards.
                  </p>
               </div>
            </div>

            {/* Right Col: Order Summary */}
            <div className="w-full lg:w-[400px]">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-4 border-b pb-3">Order Summary</h2>
                
                <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex gap-2">
                        <span className="font-semibold text-gray-600">{item.quantity}x</span>
                        <span className="text-gray-800 line-clamp-2 pr-2">{item.name}</span>
                      </div>
                      <CurrencyDisplay amount={item.price * item.quantity} className="font-semibold" />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t pt-4 border-b pb-4 mb-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.length} items)</span>
                    <CurrencyDisplay amount={subtotal} />
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping Fee</span>
                    <CurrencyDisplay amount={shippingFee} />
                  </div>
                </div>

                <div className="flex justify-between font-bold text-lg mb-6 text-gray-900">
                  <span>Total Payable</span>
                  <CurrencyDisplay amount={total} />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4 text-center font-medium">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-6 text-lg font-bold shadow-lg shadow-brand-primary/20"
                >
                  {isSubmitting ? 'Processing...' : 'Place Order & Pay'}
                </Button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}
