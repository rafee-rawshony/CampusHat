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
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/common/ImageUpload'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

const DIVISIONS = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh']

const schema = z.object({
    name: z.string().min(5, 'Full name must be at least 5 characters').max(200),
    short_name: z.string().min(2, 'Min 2 characters').max(20, 'Max 20 characters'),
    division: z.string().min(1, 'Please select a division'),
    district: z.string().min(1, 'District is required'),
    postal_code: z.string().optional(),
    full_address: z.string().optional(),
    email_domain: z.string().optional(),
    short_description: z.string().max(300, 'Max 300 characters').optional(),
    is_active: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

interface AddUniversityDialogProps {
    isOpen: boolean
    onClose: () => void
}

export default function AddUniversityDialog({ isOpen, onClose }: AddUniversityDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', short_name: '', division: '', district: '', is_active: true },
    })

    const divisionValue = watch('division')
    const isActiveValue = watch('is_active')

    const handleClose = () => {
        reset()
        setLogoUrl(null)
        onClose()
    }

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true)
        try {
            await api.post('/universities/', {
                ...data,
                logo_url: logoUrl || undefined,
            })
            toast.success(`'${data.name}' added to Campus Network!`)
            queryClient.invalidateQueries({ queryKey: ['admin-universities'] })
            handleClose()
        } catch (error: any) {
            const errData = error.response?.data
            if (errData?.short_name) toast.error('This short code is already taken.')
            else if (errData?.name) toast.error('A university with this name already exists.')
            else toast.error('Failed to add university. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Add New University</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                        Fill in the university details. Only Name, Short Name, Division and District are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center pb-4 border-b border-gray-100">
                        <Label className="mb-3 self-start text-sm font-semibold text-gray-700">
                            Campus Logo <span className="text-gray-400 font-normal">(optional)</span>
                        </Label>
                        <ImageUpload
                            value={logoUrl}
                            onChange={setLogoUrl}
                            category="store_logo"
                            variant="avatar"
                            fallbackText="U"
                            size={80}
                            label="PNG or JPG — max 5MB"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* University Name */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>University Full Name <span className="text-red-500">*</span></Label>
                            <Input {...register('name')} placeholder="e.g. Daffodil International University" className={errors.name ? 'border-red-400' : ''} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Short Name */}
                        <div className="space-y-1.5">
                            <Label>Short Name / Abbreviation <span className="text-red-500">*</span></Label>
                            <Input
                                {...register('short_name')}
                                placeholder="e.g. DIU"
                                onChange={(e) => setValue('short_name', e.target.value.toUpperCase(), { shouldValidate: true })}
                                className={`uppercase ${errors.short_name ? 'border-red-400' : ''}`}
                            />
                            <p className="text-[10px] text-gray-400">Used in badges, filters, and URLs.</p>
                            {errors.short_name && <p className="text-xs text-red-500">{errors.short_name.message}</p>}
                        </div>

                        {/* Division */}
                        <div className="space-y-1.5">
                            <Label>Division <span className="text-red-500">*</span></Label>
                            <Select value={divisionValue} onValueChange={(v) => setValue('division', v, { shouldValidate: true })}>
                                <SelectTrigger className={errors.division ? 'border-red-400' : ''}>
                                    <SelectValue placeholder="Select division" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.division && <p className="text-xs text-red-500">{errors.division.message}</p>}
                        </div>

                        {/* District */}
                        <div className="space-y-1.5">
                            <Label>District <span className="text-red-500">*</span></Label>
                            <Input {...register('district')} placeholder="e.g. Dhaka" className={errors.district ? 'border-red-400' : ''} />
                            {errors.district && <p className="text-xs text-red-500">{errors.district.message}</p>}
                        </div>

                        {/* Postal Code */}
                        <div className="space-y-1.5">
                            <Label>Postal Code</Label>
                            <Input {...register('postal_code')} placeholder="e.g. 1207" />
                        </div>

                        {/* Email Domain */}
                        <div className="space-y-1.5">
                            <Label>Official Email Domain</Label>
                            <Input {...register('email_domain')} placeholder="e.g. diu.edu.bd" />
                            <p className="text-[10px] text-gray-400">Used for student email verification.</p>
                        </div>

                        {/* Full Address */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>Full Address</Label>
                            <Input {...register('full_address')} placeholder="e.g. Ashulia, Savar, Dhaka 1342" />
                        </div>

                        {/* Short Description */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>Short Description <span className="text-gray-400 font-normal text-xs">(max 300 chars)</span></Label>
                            <textarea
                                {...register('short_description')}
                                rows={2}
                                maxLength={300}
                                placeholder="A brief description shown on the campus page..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] resize-none bg-gray-50"
                            />
                            {errors.short_description && <p className="text-xs text-red-500">{errors.short_description.message}</p>}
                        </div>
                    </div>

                    {/* Is Active Toggle */}
                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Active Status</p>
                            <p className="text-xs text-gray-400">Inactive universities are hidden from students.</p>
                        </div>
                        <Switch
                            checked={isActiveValue}
                            onCheckedChange={(v) => setValue('is_active', v)}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
                        <Button type="submit" className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add University'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
