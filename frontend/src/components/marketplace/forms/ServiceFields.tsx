'use client'

import { UseFormReturn } from 'react-hook-form'
import { Briefcase, Clock, Star, Link2, Award, Wrench } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ServiceFieldsProps {
    form: UseFormReturn<any>
}

export function ServiceFields({ form }: ServiceFieldsProps) {
    const { register } = form

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Service Profile</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-emerald-500" /> Skills
                        </Label>
                        <Input
                            {...register('skills')}
                            placeholder="e.g. Graphic Design, Web Dev, Tutoring, Photography"
                            className="focus-visible:ring-emerald-500 bg-white"
                        />
                        <p className="text-xs text-gray-400">Separate multiple skills with commas</p>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-emerald-500" /> Experience
                        </Label>
                        <Input
                            {...register('experience')}
                            placeholder="e.g. 2 years, 50+ projects completed"
                            className="focus-visible:ring-emerald-500 bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-emerald-500" /> Portfolio URL
                        </Label>
                        <Input
                            {...register('portfolio_url')}
                            type="url"
                            placeholder="https://your-portfolio.com"
                            className="focus-visible:ring-emerald-500 bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Availability & Delivery</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-orange-500" /> Delivery Time
                        </Label>
                        <Input
                            {...register('delivery_time')}
                            placeholder="e.g. 24 hours, 3 days, 1 week"
                            className="focus-visible:ring-orange-500 bg-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-orange-500" /> Availability Hours
                        </Label>
                        <Input
                            {...register('availability_hours')}
                            placeholder="e.g. Sat-Thu 10AM-6PM"
                            className="focus-visible:ring-orange-500 bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-xl border border-purple-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Previous Work & Social Proof</h3>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-purple-500" /> Previous Work Description
                    </Label>
                    <Textarea
                        {...register('previous_work_desc')}
                        placeholder="Describe your past projects, notable clients, achievements..."
                        rows={4}
                        className="focus-visible:ring-purple-500 bg-white resize-y"
                    />
                    <p className="text-xs text-gray-400">This helps build trust with potential clients</p>
                </div>
            </div>
        </div>
    )
}
