'use client'

/**
 * Address Book (Daraz-style).
 *
 * Lists the user's saved addresses, supports add/edit/delete and
 * marking one as the default delivery address.
 */

import { useEffect, useState } from 'react'
import { Plus, MapPin, Phone, Pencil, Trash2, Star, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import {
    listAddresses,
    deleteAddress,
    setDefaultAddress,
    type UserAddress,
} from '@/services/address.service'
import { AddressFormDialog } from '@/components/account/AddressFormDialog'

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

    const handleSaved = (saved: UserAddress) => {
        // Refresh from server so default flag stays consistent across all rows.
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Address Book</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage delivery addresses for your orders.
                        </p>
                    </div>
                    <Button
                        onClick={() => { setEditing(null); setDialogOpen(true) }}
                        className="bg-brand-primary hover:bg-brand-dark gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Address
                    </Button>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                )}

                {/* Empty state */}
                {!loading && addresses.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No addresses saved yet.</p>
                        <Button
                            onClick={() => { setEditing(null); setDialogOpen(true) }}
                            variant="outline"
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Your First Address
                        </Button>
                    </div>
                )}

                {/* Address grid */}
                {!loading && addresses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((addr) => (
                            <div
                                key={addr.id}
                                className={`relative p-5 rounded-xl border-2 transition-colors ${
                                    addr.is_default
                                        ? 'border-brand-primary bg-brand-light/30'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                {addr.is_default && (
                                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide bg-brand-primary text-white px-2 py-0.5 rounded">
                                        Default
                                    </span>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        {addr.label}
                                    </span>
                                </div>
                                <p className="font-bold text-gray-900">{addr.recipient_name}</p>
                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                                    <Phone className="h-3 w-3" />
                                    {addr.recipient_phone}
                                </p>
                                <p className="text-sm text-gray-700 mt-2">
                                    {addr.address_line1}
                                    {addr.area && `, ${addr.area}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {[addr.city, addr.district, addr.division]
                                        .filter(Boolean)
                                        .join(', ')}
                                    {addr.postal_code && ` — ${addr.postal_code}`}
                                </p>
                                {addr.landmark && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Landmark: {addr.landmark}
                                    </p>
                                )}

                                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => handleEdit(addr)}
                                        className="flex items-center gap-1 text-xs text-brand-primary hover:underline font-semibold"
                                    >
                                        <Pencil className="h-3 w-3" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(addr.id)}
                                        className="flex items-center gap-1 text-xs text-red-600 hover:underline font-semibold"
                                    >
                                        <Trash2 className="h-3 w-3" /> Delete
                                    </button>
                                    {!addr.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(addr.id)}
                                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-primary font-semibold ml-auto"
                                        >
                                            <Star className="h-3 w-3" /> Set as default
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
