'use client'

import { ShoppingBag, X, Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'


export function CartDrawer() {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, getCartTotal, getItemCount } = useCartStore()
    const { isAuthenticated } = useAuthStore()
    const router = useRouter()

    const itemCount = getItemCount()
    const total = getCartTotal()

    const handleCheckout = () => {
        setIsOpen(false)
        if (!isAuthenticated) {
            router.push('/auth/login?redirect=/checkout')
        } else {
            router.push('/checkout')
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-gray-50">
                <SheetHeader className="px-6 py-4 border-b border-gray-200 bg-white">
                    <SheetTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <ShoppingBag className="h-5 w-5 text-brand-primary" />
                        Your Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                    </SheetTitle>
                </SheetHeader>

                {itemCount === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                        <div className="w-24 h-24 bg-brand-light rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag className="h-10 w-10 text-brand-primary/60" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
                        <p className="text-gray-500 mb-8 max-w-[250px]">
                            Looks like you haven&apos;t added anything to your cart yet.
                        </p>
                        <Button
                            className="w-full sm:w-auto px-8"
                            onClick={() => {
                                setIsOpen(false)
                                router.push('/shop')
                            }}
                        >
                            Shop Now
                        </Button>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative group">
                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>

                                        {/* Image */}
                                        <div className="h-20 w-20 shrink-0 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-100">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-brand-light/20">
                                                    <span className="text-xs font-bold text-brand-primary">{item.name.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div className="pr-6">
                                                <Link
                                                    href={`/products/${item.slug}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="font-bold text-gray-900 text-sm line-clamp-2 hover:text-brand-primary transition-colors"
                                                >
                                                    {item.name}
                                                </Link>

                                                {item.variant_info && (
                                                    <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                        {Object.entries(item.variant_info).map(([k, v]) => (
                                                            <span key={k} className="bg-gray-100 px-1.5 py-0.5 rounded">{v}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                {/* Price */}
                                                <span className="font-bold text-brand-primary">
                                                    ৳{parseFloat(item.price).toLocaleString()}
                                                </span>

                                                {/* Stepper */}
                                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-8">
                                                    <button
                                                        className="px-2.5 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="text-xs font-bold w-4 text-center select-none">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        className="px-2.5 text-gray-500 hover:text-gray-900 transition-colors"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="bg-white border-t border-gray-200 p-6 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Subtotal</span>
                                <span className="font-bold text-lg text-gray-900">
                                    ৳{total.toLocaleString()}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">Shipping and taxes calculated at checkout.</p>

                            <Button className="w-full py-6 text-lg rounded-xl shadow-md" onClick={handleCheckout}>
                                Go to Checkout
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
