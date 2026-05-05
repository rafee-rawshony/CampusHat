'use client'

/**
 * Address create / edit dialog (Daraz-style).
 *
 * Reusable for both "Add new address" and "Edit existing address".
 * Calls onSaved(address) when the API request succeeds.
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
    createAddress,
    updateAddress,
    type UserAddress,
} from '@/services/address.service'

// Bangladesh divisions — drives the Division dropdown.
const BD_DIVISIONS = [
    'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi',
    'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh',
]

const schema = z.object({
    label: z.enum(['home', 'hostel', 'office', 'campus', 'other']),
    recipient_name: z.string().min(1, 'Recipient name is required'),
    recipient_phone: z.string().min(6, 'Phone number is required'),
    division: z.string().min(1, 'Division is required'),
    district: z.string().min(1, 'District is required'),
    city: z.string().min(1, 'City / region is required'),
    area: z.string().optional().or(z.literal('')),
    address_line1: z.string().min(3, 'Address is required'),
    landmark: z.string().optional().or(z.literal('')),
    postal_code: z.string().min(3, 'Postal code is required'),
    additional_notes: z.string().optional().or(z.literal('')),
    is_default: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    address?: UserAddress | null  // when present, dialog runs in "edit" mode
    onSaved: (address: UserAddress) => void
}

export function AddressFormDialog({ open, onOpenChange, address, onSaved }: Props) {
    const isEdit = !!address
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            label: 'home',
            recipient_name: '',
            recipient_phone: '',
            division: '',
            district: '',
            city: '',
            area: '',
            address_line1: '',
            landmark: '',
            postal_code: '',
            additional_notes: '',
            is_default: false,
        },
    })

    // When the dialog re-opens with a different address, refill the form.
    useEffect(() => {
        if (open) {
            form.reset({
                label: address?.label || 'home',
                recipient_name: address?.recipient_name || '',
                recipient_phone: address?.recipient_phone || '',
                division: address?.division || '',
                district: address?.district || '',
                city: address?.city || '',
                area: address?.area || '',
                address_line1: address?.address_line1 || '',
                landmark: address?.landmark || '',
                postal_code: address?.postal_code || '',
                additional_notes: address?.additional_notes || '',
                is_default: address?.is_default || false,
            })
        }
    }, [open, address, form])

    const onSubmit = async (data: FormValues) => {
        setSubmitting(true)
        try {
            const saved = isEdit
                ? await updateAddress(address!.id, data)
                : await createAddress(data)
            toast.success(isEdit ? 'Address updated.' : 'Address added.')
            onSaved(saved)
            onOpenChange(false)
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(err.response?.data?.message || 'Failed to save address.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    {/* Recipient row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="recipient_name">Full Name (Recipient)</Label>
                            <Input id="recipient_name" {...form.register('recipient_name')} placeholder="e.g. Mahedi Hasan" />
                            {form.formState.errors.recipient_name && (
                                <p className="text-xs text-destructive">{form.formState.errors.recipient_name.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="recipient_phone">Phone Number</Label>
                            <Input id="recipient_phone" type="tel" {...form.register('recipient_phone')} placeholder="+8801XXXXXXXXX" />
                            {form.formState.errors.recipient_phone && (
                                <p className="text-xs text-destructive">{form.formState.errors.recipient_phone.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Division + District */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Division</Label>
                            <Select
                                value={form.watch('division')}
                                onValueChange={(v) => form.setValue('division', v, { shouldDirty: true, shouldValidate: true })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select division" />
                                </SelectTrigger>
                                <SelectContent>
                                    {BD_DIVISIONS.map((div) => (
                                        <SelectItem key={div} value={div}>{div}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.division && (
                                <p className="text-xs text-destructive">{form.formState.errors.division.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="district">District</Label>
                            <Input id="district" {...form.register('district')} placeholder="e.g. Dhaka" />
                            {form.formState.errors.district && (
                                <p className="text-xs text-destructive">{form.formState.errors.district.message}</p>
                            )}
                        </div>
                    </div>

                    {/* City + Area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="city">City / Region</Label>
                            <Input id="city" {...form.register('city')} placeholder="e.g. Dhaka City" />
                            {form.formState.errors.city && (
                                <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="area">Area / Upazila</Label>
                            <Input id="area" {...form.register('area')} placeholder="e.g. Mirpur, Banani" />
                        </div>
                    </div>

                    {/* Full address */}
                    <div className="space-y-1.5">
                        <Label htmlFor="address_line1">Address</Label>
                        <Textarea
                            id="address_line1"
                            {...form.register('address_line1')}
                            placeholder="House #, Road #, Block, etc."
                            rows={2}
                        />
                        {form.formState.errors.address_line1 && (
                            <p className="text-xs text-destructive">{form.formState.errors.address_line1.message}</p>
                        )}
                    </div>

                    {/* Landmark + Postal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="landmark">Landmark (optional)</Label>
                            <Input id="landmark" {...form.register('landmark')} placeholder="e.g. Near AIUB campus" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="postal_code">Postal Code</Label>
                            <Input id="postal_code" {...form.register('postal_code')} placeholder="e.g. 1216" />
                            {form.formState.errors.postal_code && (
                                <p className="text-xs text-destructive">{form.formState.errors.postal_code.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Label */}
                    <div className="space-y-2">
                        <Label>Address Label</Label>
                        <div className="flex flex-wrap gap-2">
                            {(['home', 'hostel', 'office', 'campus', 'other'] as const).map((opt) => (
                                <button
                                    type="button"
                                    key={opt}
                                    onClick={() => form.setValue('label', opt, { shouldDirty: true })}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                        form.watch('label') === opt
                                            ? 'bg-brand-primary text-white border-brand-primary'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary'
                                    }`}
                                >
                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <Label htmlFor="additional_notes">Additional Notes (optional)</Label>
                        <Textarea
                            id="additional_notes"
                            {...form.register('additional_notes')}
                            placeholder="e.g. Call before delivery, gate code, etc."
                            rows={2}
                        />
                    </div>

                    {/* Default checkbox */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is_default"
                            checked={!!form.watch('is_default')}
                            onCheckedChange={(checked) =>
                                form.setValue('is_default', checked === true, { shouldDirty: true })
                            }
                        />
                        <Label htmlFor="is_default" className="text-sm cursor-pointer">
                            Set as default delivery address
                        </Label>
                    </div>

                    {/* Submit row */}
                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-brand-primary hover:bg-brand-dark" disabled={submitting}>
                            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Address'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
