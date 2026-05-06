'use client'
export const dynamic = 'force-dynamic'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, EyeOff, Eye, Trash2, CheckCircle, RotateCcw, Search, Package } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

import { AdStatusBadge, AdStatus } from '@/components/marketplace/AdStatusBadge'
import { DeleteAdModal } from '@/components/marketplace/DeleteAdModal'
import { RepostConfirmModal } from '@/components/marketplace/RepostConfirmModal'
import { MyAdCard } from '@/components/marketplace/MyAdCard'
import { UpgradePrompt } from '@/components/marketplace/UpgradePrompt'

type TabType = 'all' | AdStatus

export default function MyAdsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { isAuthenticated, canAccessMarketplace } = useAuthStore()

    const [activeTab, setActiveTab] = useState<TabType>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Modals
    const [deleteAdId, setDeleteAdId] = useState<string | number | null>(null)
    const [deleteAdTitle, setDeleteAdTitle] = useState('')
    
    const [repostAdId, setRepostAdId] = useState<string | number | null>(null)
    const [repostAdTitle, setRepostAdTitle] = useState('')

    useEffect(() => {
        if (!isAuthenticated) router.replace('/auth/login?redirect=/marketplace/my-ads')
    }, [isAuthenticated, router])

    const { data: ads = [], isLoading } = useQuery({
        queryKey: ['my-ads'],
        queryFn: async () => {
            const res = await api.get('/marketplace/my-listings/')
            return res.data?.data || res.data?.results || res.data || []
        },
        enabled: isAuthenticated && canAccessMarketplace(),
        staleTime: 60_000,
    })

    // Filter logic
    const filteredAds = useMemo(() => {
        return ads.filter((ad: any) => {
            const matchesSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesTab = activeTab === 'all' || ad.status === activeTab
            return matchesSearch && matchesTab
        })
    }, [ads, searchQuery, activeTab])

    const counts = useMemo(() => {
        const c: Record<string, number> = {
            all: ads.length,
            pending: 0, active: 0, expired: 0, sold: 0, rejected: 0, hidden: 0
        }
        ads.forEach((ad: any) => {
            if (ad.status in c) c[ad.status]++
            else c[ad.status] = 1 
        })
        return c
    }, [ads])

    const tabs: { id: TabType, label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'pending', label: 'Pending' },
        { id: 'expired', label: 'Expired' },
        { id: 'sold', label: 'Sold' },
        { id: 'rejected', label: 'Rejected' },
        { id: 'hidden', label: 'Hidden' },
    ]

    const handleOptimisticAction = async (id: string | number, action: 'hide' | 'unhide' | 'sold') => {
        const previousAds = queryClient.getQueryData(['my-ads'])
        let newStatus = ''
        if (action === 'hide') newStatus = 'hidden'
        if (action === 'unhide') newStatus = 'active'
        if (action === 'sold') newStatus = 'sold'

        // Optimistically update cache
        queryClient.setQueryData(['my-ads'], (old: any[]) => 
            old?.map(ad => ad.id === id ? { ...ad, status: newStatus } : ad)
        )

        try {
            if (action === 'sold') {
                await api.post(`/marketplace/listings/${id}/mark-sold/`)
            } else {
                await api.post(`/marketplace/listings/${id}/${action}/`)
            }
            toast.success('Ad updated successfully')
        } catch (err) {
            queryClient.setQueryData(['my-ads'], previousAds)
            toast.error('Action could not be completed.')
        }
    }

    if (!isAuthenticated) return null

    if (!canAccessMarketplace()) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-[#F5F5F5] pt-12 flex justify-center px-4">
                <UpgradePrompt
                    isOpen={true}
                    onClose={() => router.push('/marketplace')}
                    title="Verification Required"
                    description="You must verify your university email to manage listings on the Marketplace."
                />
            </div>
        )
    }

    const renderActionButtons = (ad: any) => {
        return (
            <>
                {ad.status === 'active' && (
                    <>
                        <Button 
                            onClick={() => router.push(`/marketplace/post?edit=${ad.id}`)}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-gray-600 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button 
                            onClick={() => handleOptimisticAction(ad.id, 'hide')}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-gray-600 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <EyeOff className="w-3.5 h-3.5" /> Hide
                        </Button>
                        <Button 
                            onClick={() => handleOptimisticAction(ad.id, 'sold')}
                            size="sm" 
                            className="h-8 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 rounded-lg text-xs shadow-none"
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> Mark as Sold
                        </Button>
                    </>
                )}

                {ad.status === 'pending' && (
                    <>
                        <Button 
                            onClick={() => router.push(`/marketplace/listings/${ad.id}`)}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-gray-600 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button 
                            onClick={() => { setDeleteAdId(ad.id); setDeleteAdTitle(ad.title) }}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                    </>
                )}

                {ad.status === 'expired' && (
                    <>
                        <Button 
                            onClick={() => { setRepostAdId(ad.id); setRepostAdTitle(ad.title) }}
                            size="sm" 
                            className="h-8 px-3 border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 rounded-lg text-xs shadow-none"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Repost
                        </Button>
                        <Button 
                            onClick={() => { setDeleteAdId(ad.id); setDeleteAdTitle(ad.title) }}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                    </>
                )}

                {ad.status === 'rejected' && (
                    <>
                        <Button 
                            onClick={() => { setRepostAdId(ad.id); setRepostAdTitle(ad.title) }}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-gray-600 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Resubmit
                        </Button>
                        <Button 
                            onClick={() => { setDeleteAdId(ad.id); setDeleteAdTitle(ad.title) }}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                    </>
                )}

                {ad.status === 'hidden' && (
                    <>
                        <Button 
                            onClick={() => handleOptimisticAction(ad.id, 'unhide')}
                            variant="outline" size="sm" 
                            className="h-8 px-3 border-[#4C3B8A] text-[#4C3B8A] hover:bg-[#4C3B8A]/10 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <Eye className="w-3.5 h-3.5" /> Unhide
                        </Button>
                        <Button 
                            onClick={() => { setDeleteAdId(ad.id); setDeleteAdTitle(ad.title) }}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                    </>
                )}

                {ad.status === 'sold' && (
                    <>
                        <Button 
                            onClick={() => { setRepostAdId(ad.id); setRepostAdTitle(ad.title) }}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-gray-600 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Repost
                        </Button>
                        <Button 
                            onClick={() => { setDeleteAdId(ad.id); setDeleteAdTitle(ad.title) }}
                            variant="outline" size="sm" 
                            className="h-8 px-3 text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1.5 rounded-lg text-xs"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                    </>
                )}
            </>
        )
    }

    return (
        <div className="bg-[#F5F5F5] min-h-screen pb-20 pt-8">
            <div className="container mx-auto px-4 max-w-6xl">
                
                {/* Breadcrumb & Header */}
                <div className="mb-8">
                    <nav className="flex items-center text-sm text-gray-500 mb-4 font-medium">
                        <Link href="/marketplace" className="hover:text-gray-900 transition-colors">Marketplace</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">My Advertisements</span>
                    </nav>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">My Advertisements</h1>
                        <Link href="/marketplace/post">
                            <button className="bg-[#4C3B8A] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#3D2F6E] transition-colors whitespace-nowrap">
                                Post New Ad
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200 mb-6 gap-2 sm:gap-6">
                    {tabs.map((tab) => {
                        const count = counts[tab.id as keyof typeof counts] || 0
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-3 px-2 border-b-2 whitespace-nowrap transition-colors ${
                                    isActive 
                                    ? 'border-[#4C3B8A] text-[#4C3B8A] font-semibold' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 font-medium'
                                }`}
                            >
                                <span className="text-sm">{tab.label}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    isActive ? 'bg-[#4C3B8A]/10 text-[#4C3B8A]' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div className="relative w-full max-w-md mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search your ads by title..."
                        className="pl-9 h-10 border-gray-200 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* LIST / EMPTY STATES */}
                {isLoading ? (
                    <div className="space-y-3">
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-24 animate-pulse flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : ads.length === 0 ? (
                    /* Global Empty State */
                    <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-2xl py-16 px-6 text-center shadow-sm">
                        <Package className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="font-semibold text-gray-600 text-lg">You haven&apos;t posted any ads yet</h3>
                        <p className="text-sm text-gray-400 mt-1 max-w-md">Share what you have with your campus community. It takes just a few minutes safely and securely.</p>
                        <Link href="/marketplace/post">
                            <button className="bg-[#4C3B8A] text-white px-6 py-2.5 rounded-lg mt-6 font-semibold hover:bg-[#3D2F6E] transition-colors">
                                Post Your First Ad
                            </button>
                        </Link>
                    </div>
                ) : filteredAds.length === 0 ? (
                    /* Tab Empty State */
                    <div className="py-12 text-center text-gray-500 font-medium">
                        No {activeTab} ads matches your filter.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredAds.map((ad: any) => (
                            <React.Fragment key={ad.id}>
                                {/* Mobile Card */}
                                <MyAdCard ad={ad} actions={renderActionButtons(ad)} />

                                {/* Desktop Horizontal Row */}
                                <div className="hidden sm:flex bg-white border border-gray-100 rounded-xl p-4 items-center gap-4 shadow-sm hover:shadow-md transition-shadow group">
                                    {/* Left */}
                                    <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 relative flex justify-center items-center">
                                        {ad.images?.[0]?.image || ad.images?.[0] ? (
                                            <Image src={typeof ad.images[0] === 'string' ? ad.images[0] : ad.images[0].image} alt={ad.title} fill className="object-cover" />
                                        ) : (
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{ad.post_type}</span>
                                        )}
                                    </div>
                                    
                                    {/* Center Left */}
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight group-hover:text-[#4C3B8A] transition-colors">{ad.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-extrabold uppercase text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{ad.post_type}</span>
                                            <AdStatusBadge status={ad.status} />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Posted {format(new Date(ad.created_at || new Date().toISOString()), 'MMM d, yyyy')} · 
                                            {ad.expires_at ? ` Expires ${format(new Date(ad.expires_at), 'MMM d, yyyy')}` : ''}
                                        </p>
                                    </div>

                                    {/* Center Right */}
                                    <div className="w-24 text-right shrink-0">
                                        <span className="font-semibold text-gray-900">
                                            ৳{Number(ad.price).toLocaleString()}
                                            {ad.post_type === 'rental' && <span className="text-gray-500 font-medium text-xs">/mo</span>}
                                        </span>
                                    </div>

                                    {/* Right Actions */}
                                    <div className="flex items-center justify-end gap-2 shrink-0 border-l border-gray-100 pl-4 ml-2">
                                        {renderActionButtons(ad)}
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            {/* Global Modals attached at Root level */}
            <DeleteAdModal 
                isOpen={!!deleteAdId} 
                onOpenChange={(open) => !open && setDeleteAdId(null)}
                adId={deleteAdId}
                adTitle={deleteAdTitle}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['my-ads'] })}
            />

            <RepostConfirmModal 
                isOpen={!!repostAdId} 
                onOpenChange={(open) => !open && setRepostAdId(null)}
                adId={repostAdId}
                adTitle={repostAdTitle}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['my-ads'] })}
            />
        </div>
    )
}
