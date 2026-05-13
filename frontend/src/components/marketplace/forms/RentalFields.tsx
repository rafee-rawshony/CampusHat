'use client'

import { UseFormReturn, Controller } from 'react-hook-form'
import { Home, MapPin, Calendar, Shield, Phone, Banknote, DoorOpen, ScrollText } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CONTACT_OPTIONS = [
    { label: 'In-App Chat', value: 'chat' },
    { label: 'Phone Call', value: 'phone' },
    { label: 'Both', value: 'both' },
]

interface RentalFieldsProps {
    form: UseFormReturn<any>
}

export function RentalFields({ form }: RentalFieldsProps) {
    const { register, control, formState: { errors } } = form

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                        <Home className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Property Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-violet-500" /> Location
                        </Label>
                        <Input
                            {...register('location')}
                            placeholder="e.g. Near BUET Gate, Dhanmondi Road 27"
                            className="focus-visible:ring-violet-500 bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-violet-500" /> Available From
                        </Label>
                        <Input
                            {...register('availability_date')}
                            type="date"
                            className="focus-visible:ring-violet-500 bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-violet-500" /> Rental Duration
                        </Label>
                        <Input
                            {...register('rental_duration')}
                            placeholder="e.g. 6 months, 1 year, semester-wise"
                            className="focus-visible:ring-violet-500 bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                        <Banknote className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Financial Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-amber-600" /> Security Deposit (৳)
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">৳</span>
                            <Input
                                {...register('deposit_amount')}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-7 focus-visible:ring-amber-500 bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-amber-600" /> Contact Preference
                        </Label>
                        <Controller
                            name="contact_preference"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                    <SelectTrigger className="bg-white focus:ring-amber-500">
                                        <SelectValue placeholder="How should tenants reach you?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CONTACT_OPTIONS.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                        <DoorOpen className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Room & Facilities</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <DoorOpen className="w-3.5 h-3.5 text-teal-500" /> Room Details
                        </Label>
                        <Textarea
                            {...register('room_details')}
                            placeholder="Room size, furnished/unfurnished, attached bath, balcony, floor..."
                            rows={3}
                            className="focus-visible:ring-teal-500 bg-white resize-y"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-teal-500" /> Facilities
                        </Label>
                        <Textarea
                            {...register('facilities')}
                            placeholder="WiFi, gas, water, electricity, parking, laundry, kitchen access..."
                            rows={2}
                            className="focus-visible:ring-teal-500 bg-white resize-y"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <ScrollText className="w-3.5 h-3.5 text-teal-500" /> Rules & Conditions
                        </Label>
                        <Textarea
                            {...register('rules_conditions')}
                            placeholder="No smoking, guest policy, pets, quiet hours..."
                            rows={2}
                            className="focus-visible:ring-teal-500 bg-white resize-y"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
