import { useNavigate } from 'react-router-dom'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Button } from '@/components/ui/button'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { LazyImage } from '@/components/ui/LazyImage'

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()

  const total = useCartStore((s) => s.getTotalPrice())

  const handleCheckout = () => {
    setIsOpen(false)
    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/checkout')
    } else {
      navigate('/checkout')
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={isMobile ? 'h-[85vh] rounded-t-3xl' : 'w-[400px] sm:w-[540px]'}>
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <span className="font-bold">Your Cart</span>
            <span className="bg-brand-primary text-white text-xs px-2 py-0.5 rounded-full ml-auto">
              {items.length} items
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full pt-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
              <ShoppingBag size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/shop')
                }}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border rounded-xl p-3 bg-gray-50/50 relative">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <div className="w-20 h-20 shrink-0 bg-white rounded-lg border overflow-hidden">
                      {item.imageUrl ? (
                        <LazyImage
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                          No Img
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        {item.store && (
                          <p className="text-xs text-brand-primary font-medium mb-0.5">{item.store}</p>
                        )}
                        <h4 className="font-semibold text-sm line-clamp-2 pr-4">{item.name}</h4>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <CurrencyDisplay amount={item.price} className="font-bold text-gray-900" />
                        
                        <div className="flex items-center gap-2 bg-white border rounded-lg h-8">
                          <button
                            className="w-8 h-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 transition-colors rounded-l-lg"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                          <button
                            className="w-8 h-full flex items-center justify-center hover:bg-gray-100 transition-colors rounded-r-lg"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 pb-8 bg-white mt-auto">
                <div className="flex items-center justify-between font-bold text-lg mb-4">
                  <span>Subtotal</span>
                  <CurrencyDisplay amount={total} />
                </div>
                <Button
                  className="w-full py-6 text-lg font-bold shadow-lg shadow-brand-primary/25"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
