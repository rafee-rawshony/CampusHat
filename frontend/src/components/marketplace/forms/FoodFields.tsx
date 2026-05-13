'use client'

import { UseFormReturn, Controller } from 'react-hook-form'
import { UtensilsCrossed, Clock, MapPin, Leaf, PackageOpen, ShieldCheck } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PORTION_SIZES = [
    { label: 'Small', value: 'small' },
    { label: 'Regular', value: 'regular' },
    { label: 'Large', value: 'large' },
    { label: 'Family Pack', value: 'family' },
]

interface FoodFieldsProps {
    form: UseFormReturn<any>
}

export function FoodFields({ form }: FoodFieldsProps) {
    const { register, control } = form

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                        <UtensilsCrossed className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Food Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Leaf className="w-3.5 h-3.5 text-red-500" /> Ingredients
                        </Label>
                        <Textarea
                            {...register('ingredients')}
                            placeholder="List main ingredients... e.g. Chicken, rice, spices, vegetables"
                            rows={2}
                            className="focus-visible:ring-red-500 bg-white resize-y"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <PackageOpen className="w-3.5 h-3.5 text-red-500" /> Portion Size
                        </Label>
                        <Controller
                            name="portion_size"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                    <SelectTrigger className="bg-white focus:ring-red-500">
                                        <SelectValue placeholder="Select portion size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PORTION_SIZES.map(p => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-red-500" /> Daily Availability
                        </Label>
                        <Input
                            {...register('daily_availability')}
                            placeholder="e.g. 12PM-3PM, 7PM-10PM"
                            className="focus-visible:ring-red-500 bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl border border-green-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Delivery Info</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-green-600" /> Delivery Area
                        </Label>
                        <Input
                            {...register('delivery_area')}
                            placeholder="e.g. BUET campus, within 2km radius"
                            className="focus-visible:ring-green-500 bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-green-600" /> Delivery Time
                        </Label>
                        <Input
                            {...register('food_delivery_time')}
                            placeholder="e.g. 30-45 mins after order"
                            className="focus-visible:ring-green-500 bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-sky-50 rounded-xl border border-cyan-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Trust & Packages</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" /> Hygiene & Certification
                        </Label>
                        <Textarea
                            {...register('hygiene_certification')}
                            placeholder="Describe your food safety practices, certifications, kitchen setup..."
                            rows={2}
                            className="focus-visible:ring-cyan-500 bg-white resize-y"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <PackageOpen className="w-3.5 h-3.5 text-cyan-600" /> Combo / Package Options
                        </Label>
                        <Textarea
                            {...register('combo_packages')}
                            placeholder="e.g. Lunch combo: Rice + Curry + Salad = ৳120, Weekly meal plan = ৳700"
                            rows={2}
                            className="focus-visible:ring-cyan-500 bg-white resize-y"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
