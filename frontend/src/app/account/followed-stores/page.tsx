'use client'

/**
 * Followed Stores (Daraz-style).
 *
 * Grid of stores the user follows — banner image, logo, name, follower
 * count, rating, plus "Visit Store" / "Unfollow" actions.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Store, Loader2, Users, Package, Star } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import {
    listFollowedStores, toggleStoreFollow,
    type FollowedStore,
} from '@/services/stores.service'
import { absoluteMediaUrl } from '@/services/upload.service'

export default function FollowedStoresPage() {
    const queryClient = useQueryClient()
    const [unfollowing, setUnfollowing] = useState<string | null>(null)

    const { data: stores = [], isLoading } = useQuery({
        queryKey: ['followed-stores'],
        queryFn: listFollowedStores,
        staleTime: 30_000,
    })

    const handleUnfollow = async (store: FollowedStore) => {
        if (!confirm(`Unfollow ${store.store_name}?`)) return
        setUnfollowing(store.slug)
        try {
            await toggleStoreFollow(store.slug)
            toast.success(`Unfollowed ${store.store_name}.`)
            queryClient.invalidateQueries({ queryKey: ['followed-stores'] })
        } catch {
            toast.error('Failed to unfollow.')
        } finally {
            setUnfollowing(null)
        }
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 md:px-8 py-5">
                <h1 className="text-xl font-bold text-gray-900">Followed Stores</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Stores you follow — get updates on new arrivals and offers.
                </p>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
            )}

            {/* Empty */}
            {!isLoading && stores.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                    <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                        No stores followed yet
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                        Browse the Mall and follow stores to see them here.
                    </p>
                    <Link href="/sellers">
                        <Button className="bg-brand-primary hover:bg-brand-dark">
                            Browse Stores
                        </Button>
                    </Link>
                </div>
            )}

            {/* Grid */}
            {!isLoading && stores.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stores.map((store) => {
                        const banner = absoluteMediaUrl(store.banner_url || '')
                        const logo = absoluteMediaUrl(store.logo_url || '')
                        const isUnfollowing = unfollowing === store.slug
                        return (
                            <div
                                key={store.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Banner */}
                                <div className="h-24 bg-gradient-to-r from-brand-primary to-brand-dark relative">
                                    {banner && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={banner} alt="" className="w-full h-full object-cover" />
                                    )}
                                </div>

                                {/* Body */}
                                <div className="px-5 pb-5 -mt-8">
                                    {/* Logo */}
                                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                                        {logo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={logo} alt={store.store_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="h-7 w-7 text-gray-300" />
                                        )}
                                    </div>

                                    {/* Name */}
                                    <Link
                                        href={`/sellers/${store.slug}`}
                                        className="block mt-3 font-bold text-gray-900 hover:text-brand-primary transition-colors truncate"
                                    >
                                        {store.store_name}
                                    </Link>

                                    {/* Stats row */}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {store.follower_count} followers
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Package className="h-3 w-3" />
                                            {store.product_count} products
                                        </span>
                                        {store.rating_avg > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                {store.rating_avg.toFixed(1)}
                                            </span>
                                        )}
                                    </div>

                                    {store.description && (
                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                            {store.description}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                        <Link href={`/sellers/${store.slug}`} className="flex-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs font-bold uppercase tracking-wide"
                                            >
                                                Visit Store
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isUnfollowing}
                                            onClick={() => handleUnfollow(store)}
                                            className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-red-600 hover:border-red-300"
                                        >
                                            {isUnfollowing ? '...' : 'Unfollow'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
