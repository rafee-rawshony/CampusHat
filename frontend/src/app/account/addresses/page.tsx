'use client'

/**
 * Address Book (Daraz-style).
 *
 * Lists the user's saved addresses, supports add/edit/delete and
 * marking one as the default delivery address.
 */

import { useEffect, useState } from 'react'
import {
    Plus, MapPin, Phone, Pencil, Trash2, Star, Loader2,
    Home, Building2, GraduationCap, Briefcase,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import {
    listAddresses,
    deleteAddress,
    setDefaultAddress,
    type UserAddress,
} from '@/services/address.service'
import { AddressFormDialog } from '@/components/account/AddressFormDialog'

// Map an address label to a small badge icon for visual variety.
const LABEL_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    home: { icon: Home, color: 'bg-blue-50 text-blue-600' },
    hostel: { icon: GraduationCap, color: 'bg-purple-50 text-purple-600' },
    office: { icon: Briefcase, color: 'bg-amber-50 text-amber-600' },
    campus: { icon: Building2, color: 'bg-emerald-50 text-emerald-600' },
    other: { icon: MapPin, color: 'bg-gray-100 text-gray-600' },
}

export default function AddressBookPage() {
    const [addresses, setAddresses] = useState<UserAddress[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<UserAddress | null>(null)

    const refresh = async () => {
        setLoading(true)
        try {
            const list = await listAddresses()
            setAddresses(list)
        } catch {
            toast.error('Failed to load addresses.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    const handleSaved = () => {
        // Refresh from server so the default flag stays consistent across rows.
        refresh()
        setEditing(null)
    }

    const handleEdit = (address: UserAddress) => {
        setEditing(address)
        setDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this address?')) return
        try {
            await deleteAddress(id)
            toast.success('Address deleted.')
            setAddresses((prev) => prev.filter((a) => a.id !== id))
        } catch {
            toast.error('Failed to delete address.')
        }
    }

    const handleSetDefault = async (id: string) => {
        try {
            await setDefaultAddress(id)
            toast.success('Default address updated.')
            refresh()
        } catch {
            toast.error('Failed to set default.')
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-6 md:px-8 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Address Book</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Manage delivery addresses for your orders.
                        </p>
                    </div>
                    <Button
                        onClick={() => { setEditing(null); setDialogOpen(true) }}
                        className="bg-brand-primary hover:bg-brand-dark gap-2 h-10 font-semibold"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Address
                    </Button>
                </div>

                <div className="p-6 md:p-8">
                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && addresses.length === 0 && (
                        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="h-8 w-8 text-brand-primary" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1">No addresses yet</h3>
                            <p className="text-sm text-gray-500 mb-5">
                                Add a delivery address to start shopping in the Mall.
                            </p>
                            <Button
                                onClick={() => { setEditing(null); setDialogOpen(true) }}
                                className="bg-brand-primary hover:bg-brand-dark gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Your First Address
                            </Button>
                        </div>
                    )}

                    {/* Address grid */}
                    {!loading && addresses.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {addresses.map((addr) => {
                                const labelMeta = LABEL_ICONS[addr.label] || LABEL_ICONS.other
                                const LabelIcon = labelMeta.icon
                                return (
                                    <div
                                        key={addr.id}
                                        className={`relative p-5 rounded-xl border transition-all hover:shadow-md ${
                                            addr.is_default
                                                ? 'border-brand-primary bg-brand-light/20 shadow-sm'
                                                : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                        {/* Default ribbon */}
                                        {addr.is_default && (
                                            <span className="absolute top-0 right-4 bg-brand-primary text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-b">
                                                Default
                                            </span>
                                        )}

                                        {/* Label icon + label */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${labelMeta.color}`}>
                                                <LabelIcon className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                                {addr.label}
                                            </span>
                                        </div>

                                        {/* Recipient block */}
                                        <p className="font-bold text-gray-900 text-base">{addr.recipient_name || '—'}</p>
                                        {addr.recipient_phone && (
                                            <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                                                <Phone className="h-3 w-3 text-gray-400" />
                                                {addr.recipient_phone}
                                            </p>
                                        )}

                                        {/* Address lines */}
                                        <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                                            <p>
                                                {addr.address_line1}
                                                {addr.area && `, ${addr.area}`}
                                            </p>
                                            <p className="text-gray-500">
                                                {[addr.city, addr.district, addr.division]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                                {addr.postal_code && ` — ${addr.postal_code}`}
                                            </p>
                                            {addr.landmark && (
                                                <p className="text-xs text-gray-400 mt-1 italic">
                                                    Landmark: {addr.landmark}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => handleEdit(addr)}
                                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-primary font-semibold transition-colors"
                                            >
                                                <Pencil className="h-3 w-3" /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(addr.id)}
                                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 font-semibold transition-colors"
                                            >
                                                <Trash2 className="h-3 w-3" /> Delete
                                            </button>
                                            {!addr.is_default && (
                                                <button
                                                    onClick={() => handleSetDefault(addr.id)}
                                                    className="ml-auto flex items-center gap-1 text-xs text-brand-primary hover:text-brand-dark font-semibold transition-colors"
                                                >
                                                    <Star className="h-3 w-3" /> Set as default
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <AddressFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                address={editing}
                onSaved={handleSaved}
            />
        </div>
    )
}
