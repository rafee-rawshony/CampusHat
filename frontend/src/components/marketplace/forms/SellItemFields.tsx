'use client'

import { UseFormReturn, Controller } from 'react-hook-form'
import { Package, Truck, Tag, Clock, Sparkles, HandCoins } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CONDITIONS = [
    { label: 'Like New', value: 'like_new' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'For Parts', value: 'for_parts' },
]

const DELIVERY_OPTIONS = [
    { label: 'Campus Meetup', value: 'meetup' },
    { label: 'Delivery', value: 'delivery' },
    { label: 'Both', value: 'both' },
]

interface SellItemFieldsProps {
    form: UseFormReturn<any>
}

export function SellItemFields({ form }: SellItemFieldsProps) {
    const { register, control, formState: { errors } } = form

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Package className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Product Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-blue-500" /> Brand
                        </Label>
                        <Input
                            {...register('brand')}
                            placeholder="e.g. Samsung, Apple, Asus"
                            className="focus-visible:ring-blue-500 bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Model
                        </Label>
                        <Input
                            {...register('model_name')}
                            placeholder="e.g. Galaxy S24, MacBook Pro M3"
                            className="focus-visible:ring-blue-500 bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-500" /> Usage Duration
                        </Label>
                        <Input
                            {...register('usage_duration')}
                            placeholder="e.g. 6 months, 2 years"
                            className="focus-visible:ring-blue-500 bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-blue-500" /> Condition
                        </Label>
                        <Controller
                            name="condition"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className={`bg-white ${errors.condition ? 'border-red-500' : 'focus:ring-blue-500'}`}>
                                        <SelectValue placeholder="Select condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CONDITIONS.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.condition && <p className="text-xs text-red-500">{(errors.condition as any).message}</p>}
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Delivery & Negotiation</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-emerald-500" /> Delivery Option
                        </Label>
                        <Controller
                            name="delivery_option"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                    <SelectTrigger className="bg-white focus:ring-emerald-500">
                                        <SelectValue placeholder="How will you deliver?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DELIVERY_OPTIONS.map(d => (
                                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <HandCoins className="w-3.5 h-3.5 text-emerald-500" /> Negotiable?
                        </Label>
                        <Controller
                            name="is_negotiable"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value ? 'yes' : 'no'} onValueChange={(v) => field.onChange(v === 'yes')}>
                                    <SelectTrigger className="bg-white focus:ring-emerald-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="yes">Yes, price is negotiable</SelectItem>
                                        <SelectItem value="no">No, fixed price</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
