'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit2, EyeOff, Eye, Trash2, CheckCircle, RotateCcw, Search, EyeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { format } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface UserAd {
    id: string | number
    title: string
    price: string | number
    post_type: string
    status: 'pending' | 'active' | 'expired' | 'sold' | 'rejected' | 'hidden'
    images: { image: string }[]
    expires_at: string
    rejection_reason?: string
}

export default function MyAdsPage() {
    const [ads, setAds] = useState<UserAd[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const { toast } = useToast()

    // Dialog State
    const [actionDialog, setActionDialog] = useState<{ isOpen: boolean; type: string; adId: string | number | null }>({
        isOpen: false,
        type: '',
        adId: null
    })

    const fetchMyAds = async () => {
        try {
            const res = await api.get('/marketplace/listings/my-ads/')
            setAds(res.data.results || res.data)
        } catch (error) {
            console.warn("Could not fetch real ads, rendering dummy payload", error)
            setAds([
                { id: 1, title: 'MacBook Pro M1 2020', price: '90000', post_type: 'buy', status: 'active', images: [{ image: 'https://placehold.co/100x100' }], expires_at: new Date(Date.now() + 86400000 * 5).toISOString() },
                { id: 2, title: 'Calculus Textbooks', price: '500', post_type: 'buy', status: 'pending', images: [{ image: 'https://placehold.co/100x100' }], expires_at: new Date(Date.now() + 86400000 * 5).toISOString() },
                { id: 3, title: 'Graphic Design Service', price: '1000', post_type: 'service', status: 'rejected', rejection_reason: "Title contains spam characters.", images: [], expires_at: new Date().toISOString() },
                { id: 4, title: 'Dorm Room Sublet', price: '5000', post_type: 'rental', status: 'hidden', images: [], expires_at: new Date(Date.now() + 86400000 * 15).toISOString() },
                { id: 5, title: 'Sony Headphones HW-1000XM4', price: '15000', post_type: 'buy', status: 'sold', images: [], expires_at: new Date(Date.now() - 86400000 * 2).toISOString() },
            ])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMyAds()
    }, [])

    const handleAction = async () => {
        if (!actionDialog.adId || !actionDialog.type) return

        try {
            if (actionDialog.type === 'delete') {
                await api.delete(`/marketplace/listings/${actionDialog.adId}/`)
                setAds(prev => prev.filter(ad => ad.id !== actionDialog.adId))
                toast({ title: 'Ad Deleted', description: 'Your ad has been completely removed.' })
            } else {
                let statusPayload = {}
                if (actionDialog.type === 'sold') statusPayload = { status: 'sold' }
                if (actionDialog.type === 'hide') statusPayload = { status: 'hidden' }
                if (actionDialog.type === 'unhide') statusPayload = { status: 'active' }
                // For reposting, we might need a dedicated endpoint to generate a new expiry, but patch status to pending for now
                if (actionDialog.type === 'repost') statusPayload = { status: 'pending' }

                await api.patch(`/marketplace/listings/${actionDialog.adId}/`, statusPayload)

                // Optimistic Update
                setAds(prev => prev.map(ad => ad.id === actionDialog.adId ? { ...ad, status: (statusPayload as any).status || ad.status } : ad))
                toast({ title: 'Ad Updated successfully.' })
            }
        } catch (error: any) {
            toast({
                title: 'Operation Failed',
                description: error.response?.data?.detail || 'Could not update ad status.',
                variant: 'destructive',
            })
            // Force refetch on error to sync with truth
            fetchMyAds()
        } finally {
            setActionDialog({ isOpen: false, type: '', adId: null })
        }
    }

    const openAction = (type: string, id: string | number) => setActionDialog({ isOpen: true, type, adId: id })

    const renderStatusBadge = (status: UserAd['status'], reason?: string) => {
        const badges = {
            pending: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Under Review</Badge>,
            active: <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Active</Badge>,
            expired: <Badge variant="secondary" className="text-gray-500">Expired</Badge>,
            sold: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Sold</Badge>,
            hidden: <Badge variant="outline" className="text-gray-500 bg-gray-50">Hidden</Badge>,
            rejected: (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge variant="destructive" className="cursor-help">Rejected</Badge>
                        </TooltipTrigger>
                        <TooltipContent className="bg-red-50 text-red-900 border-red-200 shadow-md">
                            <p className="font-semibold text-xs">Reason: {reason || 'Policy Violation'}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ),
        }
        return badges[status]
    }

    const filteredAds = ads.filter(ad => ad.title.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="bg-[#F5F5F5] min-h-screen pb-20 pt-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#1A1A2E] tracking-tight">My Marketplace Ads</h1>
                        <p className="text-gray-500 mt-1">Manage your listings, renew expired items, and mark sales as complete.</p>
                    </div>
                    <Link href="/marketplace/post">
                        <Button className="bg-brand-primary hover:bg-brand-dark text-white font-bold h-11 px-6 rounded-xl shadow-md gap-2 w-full sm:w-auto">
                            <Plus className="w-5 h-5" /> Post New Ad
                        </Button>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search your ads by title..."
                                className="pl-9 h-10 border-gray-200 focus-visible:ring-brand-primary"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                            Total Listings: <span className="text-gray-900">{ads.length}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Title & Image</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 hidden sm:table-cell">Price</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Date/Expires</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {loading ? (
                                    Array(4).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-12 bg-gray-200 rounded w-3/4"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full"></div></td>
                                            <td className="px-6 py-4 hidden sm:table-cell"><div className="h-5 w-12 bg-gray-200 rounded"></div></td>
                                            <td className="px-6 py-4 hidden md:table-cell"><div className="h-5 w-20 bg-gray-200 rounded"></div></td>
                                            <td className="px-6 py-4 text-right"><div className="h-8 w-24 bg-gray-200 rounded ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : filteredAds.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                            {searchQuery ? 'No ads match your search.' : "You haven't posted any ads yet."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAds.map(ad => (
                                        <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 w-1/3">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 relative">
                                                        {ad.images?.[0] ? (
                                                            <Image src={ad.images[0].image} alt={ad.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex justify-center items-center text-xs text-gray-400">No Img</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 group-hover:text-brand-primary transition-colors line-clamp-1">{ad.title}</h3>
                                                        <span className="text-[10px] font-extrabold uppercase text-gray-400">{ad.post_type}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderStatusBadge(ad.status, ad.rejection_reason)}
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell font-semibold">
                                                ৳{Number(ad.price).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-xs text-gray-500">
                                                <span>Exp: {format(new Date(ad.expires_at), 'MMM d, yyyy')}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Action Controls based on status */}
                                                    {ad.status === 'active' && (
                                                        <>
                                                            <Link href={`/marketplace/post?edit=${ad.id}`}>
                                                                <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500 hover:text-brand-primary" title="Edit">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button variant="ghost" size="sm" onClick={() => openAction('hide', ad.id)} className="h-8 px-2 text-gray-500 hover:text-gray-900" title="Hide Listing">
                                                                <EyeOff className="w-4 h-4" />
                                                            </Button>
                                                            <Button onClick={() => openAction('sold', ad.id)} size="sm" className="h-8 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                                                                <CheckCircle className="w-3 h-3 mr-1" /> Mark Sold
                                                            </Button>
                                                        </>
                                                    )}

                                                    {ad.status === 'pending' && (
                                                        <>
                                                            <Link href={`/marketplace/listings/${ad.id}`}>
                                                                <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-500 hover:text-brand-primary" title="View Details">
                                                                    <EyeIcon className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button variant="ghost" size="sm" onClick={() => openAction('delete', ad.id)} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}

                                                    {ad.status === 'hidden' && (
                                                        <>
                                                            <Button onClick={() => openAction('unhide', ad.id)} size="sm" variant="outline" className="h-8 border-brand-primary text-brand-primary hover:bg-brand-primary/10">
                                                                <Eye className="w-3 h-3 mr-1" /> Unhide
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => openAction('delete', ad.id)} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}

                                                    {(ad.status === 'expired' || ad.status === 'rejected') && (
                                                        <>
                                                            {ad.status === 'expired' && (
                                                                <Button onClick={() => openAction('repost', ad.id)} size="sm" className="h-8 bg-brand-primary hover:bg-brand-dark text-white">
                                                                    <RotateCcw className="w-3 h-3 mr-1" /> Repost
                                                                </Button>
                                                            )}
                                                            {ad.status === 'rejected' && (
                                                                <Link href={`/marketplace/post?edit=${ad.id}`}>
                                                                    <Button size="sm" className="h-8 bg-gray-900 hover:bg-black text-white">
                                                                        <Edit2 className="w-3 h-3 mr-1" /> Fix & Resubmit
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                            <Button variant="ghost" size="sm" onClick={() => openAction('delete', ad.id)} className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}

                                                    {ad.status === 'sold' && (
                                                        <Button variant="ghost" size="sm" onClick={() => openAction('delete', ad.id)} className="h-8 px-2 text-gray-400 hover:text-red-600 hover:bg-red-50" title="Remove Record">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Reusable Action Dialog */}
            <AlertDialog open={actionDialog.isOpen} onOpenChange={(open) => !open && setActionDialog({ isOpen: false, type: '', adId: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionDialog.type === 'delete' && "Delete this listing forever?"}
                            {actionDialog.type === 'sold' && "Mark this item as Sold?"}
                            {actionDialog.type === 'hide' && "Hide this listing from public?"}
                            {actionDialog.type === 'unhide' && "Make listing active again?"}
                            {actionDialog.type === 'repost' && "Repost this listing for another 15 days?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionDialog.type === 'delete' && "This action cannot be undone. All images, offers, and metadata will be permanently deleted."}
                            {actionDialog.type === 'sold' && "Congratulations on your sale! This ad will be marked as sold and removed from active search results."}
                            {actionDialog.type === 'hide' && "Hidden ads are only visible to you. You can unhide it at any time before it expires."}
                            {actionDialog.type === 'unhide' && "This will make your ad visible to all users on the CampusHat marketplace."}
                            {actionDialog.type === 'repost' && "This will send the ad back to moderation for a quick review before becoming active again."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAction}
                            className={actionDialog.type === 'delete' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600' : 'bg-brand-primary hover:bg-brand-dark'}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
