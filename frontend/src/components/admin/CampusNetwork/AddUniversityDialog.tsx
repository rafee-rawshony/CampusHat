'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

// Zod schema
const addUniversitySchema = z.object({
    name: z.string().min(5, 'Name must be at least 5 characters').max(200),
    short_name: z.string().min(2, 'Min 2 characters').max(10, 'Max 10 characters'),
    district: z.string().min(1, 'Please select a city'),
    is_active: z.boolean().default(true),
})

type AddUniversityForm = z.infer<typeof addUniversitySchema>

interface AddUniversityDialogProps {
    isOpen: boolean
    onClose: () => void
}

const CITIES = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Other']

export default function AddUniversityDialog({ isOpen, onClose }: AddUniversityDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const queryClient = useQueryClient()

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AddUniversityForm>({
        resolver: zodResolver(addUniversitySchema),
        defaultValues: {
            name: '',
            short_name: '',
            district: '',
            is_active: true,
        }
    })

    const cityValue = watch('district')
    const isActiveValue = watch('is_active')

    const onSubmit = async (data: AddUniversityForm) => {
        setIsLoading(true)
        try {
            await api.post('/universities/', data)
            toast.success(`'${data.name}' added to Campus Network!`)
            queryClient.invalidateQueries({ queryKey: ['admin-universities'] })
            reset()
            onClose()
        } catch (error: any) {
            const errData = error.response?.data
            if (errData?.short_name) {
                toast.error('This short code is already taken.')
            } else if (errData?.name) {
                toast.error('A university with this name already exists.')
            } else {
                toast.error('Failed to add university. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New University</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 mt-1">
                        Add a new campus to the CampusHat network.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">University Full Name <span className="text-red-500">*</span></Label>
                        <Input 
                            {...register('name')} 
                            placeholder="e.g. Daffodil International University" 
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="short_name">Short Code / Abbreviation <span className="text-red-500">*</span></Label>
                        <Input 
                            {...register('short_name')} 
                            placeholder="e.g. DIU, BUET, AIUB" 
                            onChange={(e) => setValue('short_name', e.target.value.toUpperCase(), { shouldValidate: true })}
                            className={errors.short_name ? 'border-red-500 uppercase' : 'uppercase'}
                        />
                        <p className="text-[10px] text-gray-400">This appears on listings and student badges.</p>
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

                    <div className="space-y-2">
                        <Label>Status <span className="text-red-500">*</span></Label>
                        <Select value={isActiveValue ? 'Active' : 'Inactive'} onValueChange={(val) => setValue('is_active', val === 'Active')}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100 mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add University'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
