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
import { ImageUpload } from '@/components/common/ImageUpload'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2, AlertTriangle, Users, Hash } from 'lucide-react'
import { CampusType } from './CampusCard'

const DIVISIONS = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh']

const schema = z.object({
    name: z.string().min(5, 'Min 5 characters').max(200),
    short_name: z.string().min(2, 'Min 2 characters').max(20),
    division: z.string().min(1, 'Select a division'),
    district: z.string().min(1, 'District is required'),
    postal_code: z.string().optional(),
    full_address: z.string().optional(),
    email_domain: z.string().optional(),
    short_description: z.string().max(300).optional(),
    is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface EditUniversityDrawerProps {
    university: CampusType | null
    isOpen: boolean
    onClose: () => void
}

export default function EditUniversityDrawer({ university, isOpen, onClose }: EditUniversityDrawerProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const { register, handleSubmit, formState: { errors, isDirty }, reset, setValue, watch } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', short_name: '', division: '', district: '', is_active: true },
    })

    useEffect(() => {
        if (university) {
            reset({
                name: university.name,
                short_name: university.short_name,
                division: university.division || 'Dhaka',
                district: university.district || '',
                postal_code: university.postal_code || '',
                full_address: university.full_address || '',
                email_domain: university.email_domain || '',
                short_description: university.short_description || '',
                is_active: university.is_active,
            })
            setLogoUrl(university.logo_url || null)
        }
    }, [university, reset])

    const divisionValue = watch('division')
    const isActiveValue = watch('is_active')
    const nameValue = watch('name')
    const shortNameValue = watch('short_name')

    const onSubmit = async (data: FormValues) => {
        if (!university) return
        setIsLoading(true)
        try {
            // Backend uses slug as the lookup field
            await api.patch(`/universities/${university.slug}/`, {
                ...data,
                logo_url: logoUrl || null,
            })
            toast.success('University updated successfully!')
            queryClient.invalidateQueries({ queryKey: ['admin-universities'] })
            onClose()
        } catch (error: any) {
            const errData = error.response?.data
            if (errData?.short_name) toast.error('This short code is already taken.')
            else if (errData?.name) toast.error('A university with this name already exists.')
            else toast.error('Failed to update university.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!university) return null

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col border-0">
                <SheetHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
                    <SheetTitle className="font-bold text-gray-900 text-lg">Edit University</SheetTitle>
                    <SheetClose className="text-gray-400 hover:text-gray-600 rounded-full p-1" />
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                    {/* System Info Badge */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        <Hash className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 font-mono">{university.system_id}</span>
                        <span className="text-gray-300 mx-1">·</span>
                        <span className="text-xs text-gray-400">Auto-generated, not editable</span>
                    </div>

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
                            fallbackText={university.short_name.substring(0, 2)}
                            size={80}
                            label="PNG or JPG — max 5MB"
                        />
                    </div>

                    {/* Live Preview */}
                    <div className={`relative bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-hidden pointer-events-none ${!isActiveValue ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={logoUrl || `https://placehold.co/80x80/4C3B8A/ffffff?text=${encodeURIComponent((shortNameValue || university.short_name).substring(0, 4))}`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActiveValue ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                {isActiveValue ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="mt-2">
                            <p className="font-bold text-gray-900 text-sm line-clamp-1">{nameValue || university.name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{shortNameValue || university.short_name} · {divisionValue}</p>
                        </div>
                    </div>

                    <form id="edit-university-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>University Full Name <span className="text-red-500">*</span></Label>
                            <Input {...register('name')} className={errors.name ? 'border-red-400' : ''} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Short Name <span className="text-red-500">*</span></Label>
                                <Input
                                    {...register('short_name')}
                                    onChange={(e) => setValue('short_name', e.target.value.toUpperCase(), { shouldValidate: true })}
                                    className={`uppercase ${errors.short_name ? 'border-red-400' : ''}`}
                                />
                                {errors.short_name && <p className="text-xs text-red-500">{errors.short_name.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Postal Code</Label>
                                <Input {...register('postal_code')} placeholder="e.g. 1207" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Division <span className="text-red-500">*</span></Label>
                                <Select value={divisionValue} onValueChange={(v) => setValue('division', v, { shouldValidate: true })}>
                                    <SelectTrigger className={errors.division ? 'border-red-400' : ''}>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.division && <p className="text-xs text-red-500">{errors.division.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>District <span className="text-red-500">*</span></Label>
                                <Input {...register('district')} className={errors.district ? 'border-red-400' : ''} />
                                {errors.district && <p className="text-xs text-red-500">{errors.district.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Full Address</Label>
                            <Input {...register('full_address')} placeholder="Physical campus address" />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Official Email Domain</Label>
                            <Input {...register('email_domain')} placeholder="e.g. diu.edu.bd" />
                            <p className="text-[10px] text-gray-400">Used for student email verification.</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Short Description <span className="text-gray-400 font-normal text-xs">(max 300 chars)</span></Label>
                            <textarea
                                {...register('short_description')}
                                rows={2}
                                maxLength={300}
                                placeholder="Shown on the campus page..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C3B8A] resize-none bg-gray-50"
                            />
                        </div>

                        {/* Student count info */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <Users className="w-4 h-4" />
                            Currently <strong className="mx-1">{university.student_count || 0}</strong> registered students
                        </div>

                        {/* Active Toggle */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">University Status</p>
                                    <p className={`text-xs font-semibold mt-0.5 ${isActiveValue ? 'text-green-600' : 'text-gray-400'}`}>
                                        {isActiveValue ? 'Active — visible to students' : 'Inactive — hidden from platform'}
                                    </p>
                                </div>
                                <Switch
                                    checked={isActiveValue}
                                    onCheckedChange={(c) => setValue('is_active', c, { shouldDirty: true })}
                                />
                            </div>

                            {university.is_active && !isActiveValue && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-700 leading-snug">
                                        Deactivating will hide this university from the campus switcher and student registration.
                                    </p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-2 justify-end bg-gray-50 shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button
                        form="edit-university-form"
                        type="submit"
                        className="bg-[#4C3B8A] hover:bg-[#3d2e6e] text-white"
                        disabled={isLoading || (!isDirty && logoUrl === (university.logo_url || null))}
                    >
                        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
