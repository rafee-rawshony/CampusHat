'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2, AlertTriangle, Users } from 'lucide-react'
import { CampusType } from './CampusCard'

const editUniversitySchema = z.object({
    name: z.string().min(5, 'Name must be at least 5 characters').max(200),
    short_name: z.string().min(2, 'Min 2 characters').max(10, 'Max 10 characters'),
    district: z.string().min(1, 'Please select a city'),
    is_active: z.boolean(),
})

type EditUniversityForm = z.infer<typeof editUniversitySchema>

const CITIES = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Other']

interface EditUniversityDrawerProps {
    university: CampusType | null
    isOpen: boolean
    onClose: () => void
}

export default function EditUniversityDrawer({ university, isOpen, onClose }: EditUniversityDrawerProps) {
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    const { register, handleSubmit, formState: { errors, isDirty }, reset, setValue, watch } = useForm<EditUniversityForm>({
        resolver: zodResolver(editUniversitySchema),
        defaultValues: {
            name: '',
            short_name: '',
            district: '',
            is_active: true,
        }
    })

    useEffect(() => {
        if (university) {
            reset({
                name: university.name,
                short_name: university.short_name,
                district: university.district || 'Dhaka', // fallback if empty
                is_active: university.is_active,
            })
        }
    }, [university, reset])

    const cityValue = watch('district')
    const isActiveValue = watch('is_active')

    const onSubmit = async (data: EditUniversityForm) => {
        if (!university) return
        setIsLoading(true)
        try {
            await api.patch(`/universities/${university.id}/`, data)
            toast.success('University updated successfully!')
            queryClient.invalidateQueries({ queryKey: ['admin-universities'] })
            onClose()
        } catch (error: any) {
            const errData = error.response?.data
            if (errData?.short_name) {
                toast.error('This short code is already taken.')
            } else if (errData?.name) {
                toast.error('A university with this name already exists.')
            } else {
                toast.error('Failed to update university.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (!university) return null

    // Mini visual preview
    const shortCodeDisplay = university.short_name && university.short_name.length > 4 ? university.short_name.substring(0, 4) : university.short_name

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col border-0">
                <SheetHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
                    <SheetTitle className="font-semibold text-gray-900 text-lg">Edit University</SheetTitle>
                    <SheetClose className="text-gray-400 hover:text-gray-600 rounded-full p-1" />
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    {/* Small Preview Card */}
                    <div className={`relative bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-hidden pointer-events-none ${!isActiveValue ? 'opacity-70' : ''}`}>
                        <div className="flex items-start justify-between">
                            <div className="w-10 h-10 bg-[#4C3B8A] text-white rounded-xl flex items-center justify-center font-bold text-xs tracking-wide">
                                {shortCodeDisplay}
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold
                                ${isActiveValue ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}
                            `}>
                                {isActiveValue ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{watch('name') || university.name}</h3>
                            <p className="text-[10px] text-gray-500 mt-0.5">{watch('short_name') || university.short_name} · {cityValue || university.district}</p>
                        </div>
                    </div>

                    <form id="edit-university-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">University Full Name <span className="text-red-500">*</span></Label>
                            <Input {...register('name')} className={errors.name ? 'border-red-500' : ''} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="short_name">Short Code / Abbreviation <span className="text-red-500">*</span></Label>
                            <Input 
                                {...register('short_name')} 
                                onChange={(e) => setValue('short_name', e.target.value.toUpperCase(), { shouldValidate: true })}
                                className={errors.short_name ? 'border-red-500 uppercase' : 'uppercase'}
                            />
                            {errors.short_name && <p className="text-xs text-red-500">{errors.short_name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>City <span className="text-red-500">*</span></Label>
                            <Select value={cityValue} onValueChange={(val) => setValue('district', val, { shouldValidate: true })}>
                                <SelectTrigger className={errors.district ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select a city" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CITIES.map(city => (
                                        <SelectItem key={city} value={city}>{city}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.district && <p className="text-xs text-red-500">{errors.district.message}</p>}
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label className="text-gray-500">Student Count</Label>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <Users className="w-4 h-4" />
                                Currently <strong>{university.student_count || 0}</strong> registered students
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <Label className="flex-1 cursor-pointer" htmlFor="status-toggle">
                                    <span className="block font-medium text-gray-900 mb-0.5">University Status</span>
                                    <span className={`text-xs font-semibold ${isActiveValue ? 'text-green-600' : 'text-gray-500'}`}>
                                        {isActiveValue ? 'Active' : 'Inactive'}
                                    </span>
                                </Label>
                                <Switch 
                                    id="status-toggle"
                                    checked={isActiveValue} 
                                    onCheckedChange={(c) => setValue('is_active', c, { shouldDirty: true })} 
                                />
                            </div>

                            {university.is_active && !isActiveValue && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2 flex gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-700 leading-snug">
                                        ⚠ Deactivating will hide this university from the campus switcher dropdown and student registration.
                                    </p>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Danger Zone */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-red-500 mb-3">Danger Zone</h4>
                        <Button 
                            variant="outline" 
                            className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => toast('Merge tool coming soon', { icon: '🚧' })}
                        >
                            Merge with another university
                        </Button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50 shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button form="edit-university-form" type="submit" className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white" disabled={isLoading || !isDirty}>
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
