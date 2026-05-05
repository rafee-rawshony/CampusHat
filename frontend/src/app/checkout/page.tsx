'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CreditCard, Wallet, Truck, Tag, Info, MapPin, Plus, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

// Actually, using the standard import map:
import { useForm as useRHForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { listAddresses, type UserAddress } from '@/services/address.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { ProfileGate } from '@/components/account/ProfileGate'

import { cn } from '@/lib/utils'

// Zod Schema for Address
const addressSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(11, 'Valid phone required'),
    campus_building: z.string().min(2, 'Building name required'),
    room_number: z.string().min(1, 'Room number required'),
    notes: z.string().optional()
})

type AddressFormValues = z.infer<typeof addressSchema>

// Payment Options — all supported BD methods
const PAYMENT_METHODS = [
    { id: 'cod', title: 'Cash on Delivery', icon: Truck, description: 'Pay when you receive the order' },
    { id: 'wallet', title: 'Wallet Balance', icon: Wallet, description: 'Pay instantly using your CampusHat wallet' },
    { id: 'bkash', title: 'bKash', icon: CreditCard, description: 'Mobile banking — bKash' },
    { id: 'nagad', title: 'Nagad', icon: CreditCard, description: 'Mobile banking — Nagad' },
    { id: 'rocket', title: 'Rocket', icon: CreditCard, description: 'Mobile banking — Rocket' },
    { id: 'card', title: 'Card Payment', icon: CreditCard, description: 'Debit / Credit card' },
]

export default function CheckoutPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuthStore()
    const { items, getCartTotal, clearCart } = useCartStore()

    // State
    const [isLoading, setIsLoading] = useState(false)
    const [couponCode, setCouponCode] = useState('')
    const [discount, setDiscount] = useState(0)
    const [deliveryFee] = useState(60) // Static 60 BDT for now
    const [walletBalance, setWalletBalance] = useState(0)

    // Saved address picker state
    const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
    const [showNewAddressForm, setShowNewAddressForm] = useState(false)

    // Form Hooks
    const { register, handleSubmit, formState: { errors }, setValue, reset } = useRHForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            full_name: user?.full_name || '',
            phone: ''
        }
    })

    const [paymentMethod, setPaymentMethod] = useState<string>('cod')

    // Guard Checks + fetch saved addresses
    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/auth/login?redirect=/checkout')
        }
        if (items.length === 0) {
            toast.error('Your cart is empty.')
            router.replace('/shop')
        }

        const fetchWallet = async () => {
            try {
                const { data } = await api.get('/wallet/balance/')
                const bal = data?.data || data
                const balance = bal?.available_balance ?? bal?.balance ?? 0
                setWalletBalance(parseFloat(balance))
            } catch {
                setWalletBalance(0)
            }
        }
        fetchWallet()

        // Fetch saved addresses
        const fetchAddresses = async () => {
            try {
                const addrs = await listAddresses()
                setSavedAddresses(addrs)
                // Auto-select default or first address
                const defaultAddr = addrs.find(a => a.is_default) || addrs[0]
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr.id)
                    // Pre-fill form with saved address
                    setValue('full_name', defaultAddr.recipient_name || user?.full_name || '')
                    setValue('phone', defaultAddr.recipient_phone || '')
                    setValue('campus_building', defaultAddr.campus_building || defaultAddr.address_line1 || '')
                    setValue('room_number', defaultAddr.room_number || '')
                    setValue('notes', defaultAddr.additional_notes || '')
                } else {
                    setShowNewAddressForm(true)
                }
            } catch {
                setShowNewAddressForm(true)
            }
        }
        fetchAddresses()
    }, [isAuthenticated, items.length, router, setValue, user?.full_name])

    const selectSavedAddress = (addr: UserAddress) => {
        setSelectedAddressId(addr.id)
        setShowNewAddressForm(false)
        setValue('full_name', addr.recipient_name || user?.full_name || '')
        setValue('phone', addr.recipient_phone || '')
        setValue('campus_building', addr.campus_building || addr.address_line1 || '')
        setValue('room_number', addr.room_number || '')
        setValue('notes', addr.additional_notes || '')
    }

    const subtotal = getCartTotal()
    const finalTotal = subtotal + deliveryFee - discount

    const applyCoupon = async () => {
        if (!couponCode) return
        try {
            const { data } = await api.get(`/coupons/validate/`, {
                params: { code: couponCode, cart_total: subtotal }
            })
            const result = data?.data || data
            if (result?.is_valid) {
                setDiscount(parseFloat(result.discount_amount) || 0)
                toast.success('Coupon applied!')
            } else {
                toast.error(result?.error || 'Invalid coupon.')
                setDiscount(0)
            }
        } catch {
            toast.error('Invalid or expired coupon.')
            setDiscount(0)
        }
    }

    const onSubmit = async (data: AddressFormValues) => {
        if (paymentMethod === 'wallet' && finalTotal > walletBalance) {
            toast.error('Insufficient wallet balance. Please top up or choose another method.')
            return
        }

        // Backend requires a saved delivery_address_id — not a raw address object.
        // If user picked a saved address, use that ID. If they entered a new one,
        // we must create the address first, then checkout with its ID.
        let addressId = selectedAddressId

        if (showNewAddressForm || !addressId) {
            try {
                const addrRes = await api.post('/auth/addresses/', {
                    label: 'campus',
                    recipient_name: data.full_name,
                    recipient_phone: data.phone,
                    campus_building: data.campus_building,
                    room_number: data.room_number,
                    address_line1: data.campus_building,
                    city: 'Dhaka',
                    district: 'Dhaka',
                    postal_code: '1000',
                    additional_notes: data.notes || '',
                    is_default: savedAddresses.length === 0,
                })
                addressId = addrRes.data?.data?.id || addrRes.data?.id
            } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Failed to save address.')
                return
            }
        }

        if (!addressId) {
            toast.error('Please select or add a delivery address.')
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                delivery_address_id: addressId,
                payment_method: paymentMethod,
                buyer_note: data.notes || '',
            }

            const res = await api.post('/orders/checkout/', payload)
            clearCart()
            const orderId = res.data?.data?.id || res.data?.order_id || res.data?.id
            router.push(orderId ? `/orders/${orderId}/success` : '/account/orders')
            toast.success('Order placed successfully!')
        } catch (error: any) {
            const msg = error?.response?.data?.detail || error?.response?.data?.message || 'Failed to place order. Please try again.'
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    if (!user || items.length === 0) return null

    return (
        <ProfileGate featureName="Mall Checkout" requireAddress>
        <div className="min-h-screen bg-surface-base pb-20 pt-6">
            <div className="container mx-auto px-4 max-w-6xl">

                <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: Forms */}
                    <div className="lg:col-span-7 space-y-8">

                        <form id="checkout-form" onSubmit={handleSubmit(onSubmit)}>
                            {/* STEP 1: Address */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-light text-brand-primary text-sm">1</span>
                                    Delivery Details
                                </h2>

                                {/* Saved Address Cards */}
                                {savedAddresses.length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Saved Addresses</p>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {savedAddresses.map((addr) => (
                                                <button
                                                    key={addr.id}
                                                    type="button"
                                                    onClick={() => selectSavedAddress(addr)}
                                                    className={cn(
                                                        'relative text-left p-4 rounded-xl border-2 transition-all',
                                                        selectedAddressId === addr.id && !showNewAddressForm
                                                            ? 'border-[#4C3B8A] bg-[#4C3B8A]/5'
                                                            : 'border-gray-200 hover:border-[#4C3B8A]/40 bg-white'
                                                    )}
                                                >
                                                    {selectedAddressId === addr.id && !showNewAddressForm && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#4C3B8A] flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <MapPin className="w-3.5 h-3.5 text-[#4C3B8A]" />
                                                        <span className="text-xs font-bold text-[#4C3B8A] uppercase">{addr.label}</span>
                                                        {addr.is_default && (
                                                            <span className="text-[10px] bg-[#4C3B8A]/10 text-[#4C3B8A] font-bold px-1.5 py-0.5 rounded">Default</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{addr.recipient_name || addr.address_line1}</p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {[addr.campus_building, addr.room_number ? `Room ${addr.room_number}` : '', addr.city].filter(Boolean).join(', ')}
                                                    </p>
                                                </button>
                                            ))}
                                            {/* Add New Address Card */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowNewAddressForm(true)
                                                    setSelectedAddressId(null)
                                                    reset({ full_name: user?.full_name || '', phone: '', campus_building: '', room_number: '', notes: '' })
                                                }}
                                                className={cn(
                                                    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all min-h-[100px]',
                                                    showNewAddressForm
                                                        ? 'border-[#4C3B8A] bg-[#4C3B8A]/5'
                                                        : 'border-gray-300 hover:border-[#4C3B8A]/40 text-gray-400 hover:text-[#4C3B8A]'
                                                )}
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span className="text-xs font-bold">New Address</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Address Form (shown if no saved addresses or "New Address" selected) */}
                                {(showNewAddressForm || savedAddresses.length === 0) && (
                                <div className="space-y-5">
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input {...register('full_name')} className="bg-gray-50" />
                                            {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input {...register('phone')} className="bg-gray-50" />
                                            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label>Campus Building / Hall</Label>
                                            <Input {...register('campus_building')} placeholder="e.g. Science Complex" className="bg-gray-50" />
                                            {errors.campus_building && <p className="text-red-500 text-xs">{errors.campus_building.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Room / Department</Label>
                                            <Input {...register('room_number')} placeholder="e.g. AB-402" className="bg-gray-50" />
                                            {errors.room_number && <p className="text-red-500 text-xs">{errors.room_number.message}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Delivery Notes <span className="text-gray-400 font-normal">(Optional)</span></Label>
                                        <Textarea {...register('notes')} placeholder="Call upon arrival..." className="bg-gray-50 resize-none" rows={3} />
                                    </div>
                                </div>
                                )}
                            </div>

                            {/* STEP 2: Payment */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mt-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-light text-brand-primary text-sm">2</span>
                                    Payment Method
                                </h2>

                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                                    {PAYMENT_METHODS.map((method) => {
                                        const isWallet = method.id === 'wallet'
                                        const isInsufficient = isWallet && walletBalance < finalTotal

                                        return (
                                            <label
                                                key={method.id}
                                                className={cn(
                                                    "flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer relative",
                                                    paymentMethod === method.id
                                                        ? "border-brand-primary bg-brand-light/10"
                                                        : "border-gray-200 hover:border-brand-primary/50 bg-white",
                                                    isInsufficient && "opacity-60 cursor-not-allowed hover:border-gray-200"
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value={method.id}
                                                    id={method.id}
                                                    disabled={isInsufficient}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <method.icon className={cn("h-5 w-5", paymentMethod === method.id ? "text-brand-primary" : "text-gray-500")} />
                                                            <span className="font-bold text-gray-900">{method.title}</span>
                                                        </div>
                                                        {isWallet && (
                                                            <span className="font-bold text-gray-900">৳{walletBalance.toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">{method.description}</p>

                                                    {isInsufficient && (
                                                        <div className="flex items-center gap-1 text-xs text-red-500 font-bold mt-2 bg-red-50 p-2 rounded-md">
                                                            <Info className="h-4 w-4" /> Insufficient balance. Top up required.
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        )
                                    })}
                                </RadioGroup>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: Order Summary */}
                    <div className="lg:col-span-5 relative">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            {/* Items List */}
                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 hide-scrollbar mb-6">
                                {items.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="h-16 w-16 bg-gray-50 rounded-lg overflow-hidden shrink-0 relative border border-gray-100">
                                            {item.image_url ? (
                                                <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                                            ) : (
                                                <span className="flex h-full items-center justify-center font-bold text-gray-300">{item.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{item.name}</h4>
                                            {item.variant_info && (
                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                    {Object.values(item.variant_info).join(' • ')}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-sm font-semibold text-brand-primary">৳{parseFloat(item.price).toLocaleString()}</span>
                                                <span className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-6" />

                            {/* Coupon Section */}
                            <div className="flex gap-2 mb-6">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Promo Code"
                                        className="pl-9 bg-gray-50 uppercase"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        disabled={discount > 0}
                                    />
                                </div>
                                <Button
                                    variant={discount > 0 ? "outline" : "default"}
                                    onClick={discount > 0 ? () => { setDiscount(0); setCouponCode(''); } : applyCoupon}
                                >
                                    {discount > 0 ? 'Remove' : 'Apply'}
                                </Button>
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 text-sm text-gray-600 mb-6">
                                <div className="flex justify-between">
                                    <span>Subtotal ({items.length} items)</span>
                                    <span className="font-semibold text-gray-900">৳{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-brand-primary">
                                    <span>Discount</span>
                                    <span className="font-semibold">-৳{discount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Delivery Fee</span>
                                    <span className="font-semibold text-gray-900">+৳{deliveryFee.toLocaleString()}</span>
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Fixed Price</p>
                                </div>
                                <div className="text-3xl font-black text-gray-900">
                                    ৳{finalTotal.toLocaleString()}
                                </div>
                            </div>

                            <Button
                                form="checkout-form"
                                type="submit"
                                className="w-full h-14 text-lg font-bold shadow-md rounded-xl bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing securely...' : 'Place Order'}
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        </ProfileGate>
    )
}
