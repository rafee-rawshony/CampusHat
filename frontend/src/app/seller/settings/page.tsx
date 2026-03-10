'use client'

import React, { useState, useEffect } from 'react'
import {
    Store, PenSquare, Building2, User, CreditCard, ShieldCheck, Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth.store'

export default function SellerSettingsPage() {
    const { user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)

    // Mock State for Settings Forms
    const [formData, setFormData] = useState({
        storeName: '',
        storeSlug: '',
        description: '',
        mobileBankingType: 'bkash',
        mobileBankingNumber: '',
        logoUrl: '',
        bannerUrl: ''
    })

    useEffect(() => {
        // Pre-fill with user data
        if (user) {
            setFormData({
                storeName: (user as any)?.store_name || user?.full_name || '',
                storeSlug: (user as any)?.store_slug || '',
                description: 'We sell the best electronics and gadgets for students on campus.',
                mobileBankingType: 'bkash',
                mobileBankingNumber: '01711223344',
                logoUrl: '',
                bannerUrl: ''
            })
        }
    }, [user])

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Mock API PATCH /api/v1/sellers/stores/{slug}/
        setTimeout(() => {
            setIsLoading(false)
            toast.success("Store settings updated successfully")
        }, 800)
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900">Store Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your store details, payouts, and public profile.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Col - Settings Form */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Store className="w-5 h-5 text-brand-primary" /> Public Profile
                            </h2>
                        </div>

                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-bold">Store Name</Label>
                                    <Input value={formData.storeName} onChange={(e) => setFormData({ ...formData, storeName: e.target.value })} className="bg-gray-50 border-gray-200" required />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-bold">Store URL (Slug)</Label>
                                    <div className="flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                                            campushat.com/sellers/
                                        </span>
                                        <Input value={formData.storeSlug} onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })} disabled className="rounded-l-none bg-gray-100 border-gray-200" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium">Contact support to change your store URL.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-700 font-bold">Store Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell students what your store is about..."
                                    className="bg-gray-50 border-gray-200 min-h-[100px]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-bold">Logo URL (Optional)</Label>
                                    <Input value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="https://..." className="bg-gray-50 border-gray-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-bold">Banner URL (Optional)</Label>
                                    <Input value={formData.bannerUrl} onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })} placeholder="https://..." className="bg-gray-50 border-gray-200" />
                                </div>
                            </div>
                        </div>

                        {/* Payout Information Section */}
                        <div className="p-6 border-y border-gray-100 bg-gray-50/50 mt-4">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-gray-700" /> Payout Details
                            </h2>
                        </div>

                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-bold">Mobile Banking Type</Label>
                                    <Select value={formData.mobileBankingType} onValueChange={(v) => setFormData({ ...formData, mobileBankingType: v })}>
                                        <SelectTrigger className="bg-gray-50 border-gray-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bkash">bKash</SelectItem>
                                            <SelectItem value="nagad">Nagad</SelectItem>
                                            <SelectItem value="rocket">Rocket</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-bold">Account Number</Label>
                                    <Input value={formData.mobileBankingNumber} onChange={(e) => setFormData({ ...formData, mobileBankingNumber: e.target.value })} className="bg-gray-50 border-gray-200 font-medium" required />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end">
                            <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-dark text-white font-bold px-8 shadow-sm">
                                {isLoading ? 'Saving...' : 'Save Store Settings'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Right Col - Info Cards */}
                <div className="space-y-6">
                    {/* Security Info */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 mb-1">Account Security</h3>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            Your email address <span className="font-bold text-gray-700">{user?.email || 'user@example.com'}</span> is the primary contact for notifications.
                        </p>
                        <Button variant="outline" className="w-full text-xs font-bold border-gray-200 text-gray-700" size="sm">
                            <Mail className="w-4 h-4 mr-2" /> Change Email
                        </Button>
                    </div>

                    {/* Commission Rates */}
                    <div className="bg-gradient-to-br from-brand-primary to-purple-800 rounded-2xl shadow-sm p-5 text-white relative overflow-hidden flex flex-col items-center text-center">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Building2 className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 w-full">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d8cff8] mb-1">Commission Rate</h3>
                            <div className="text-4xl font-black my-2">5%</div>
                            <p className="text-xs font-medium text-white/80 leading-relaxed max-w-[200px] mx-auto">
                                Admin defined platform fee taken automatically on product sales.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
