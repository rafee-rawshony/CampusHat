'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Eye, EyeOff, RotateCcw, CheckCircle, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface UserListing {
    id: string
    title: string
    post_type: string
    price: number
    status: 'pending' | 'active' | 'expired' | 'sold' | 'hidden' | 'rejected'
    created_at: string
    rejection_reason?: string
}

const toArray = (payload: any): UserListing[] => {
    if (Array.isArray(payload?.data?.results)) return payload.data.results
    if (Array.isArray(payload?.results)) return payload.results
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload)) return payload
    return []
}

const statusBadgeClass = (status: UserListing['status']) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'pending':
            return 'bg-amber-50 text-amber-700 border-amber-200'
        case 'sold':
            return 'bg-blue-50 text-blue-700 border-blue-200'
        case 'hidden':
            return 'bg-gray-100 text-gray-700 border-gray-200'
        case 'rejected':
            return 'bg-red-50 text-red-700 border-red-200'
        default:
            return 'bg-orange-50 text-orange-700 border-orange-200'
    }
}

const getVisiblePages = (current: number, total: number) => {
    const maxButtons = 5
    if (total <= maxButtons) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }

    const half = Math.floor(maxButtons / 2)
    let start = Math.max(1, current - half)
    let end = Math.min(total, start + maxButtons - 1)

    if (end - start + 1 < maxButtons) {
        start = Math.max(1, end - maxButtons + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function MyListingsPage() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 8

    const { data, isLoading } = useQuery({
        queryKey: ['account-listings'],
        queryFn: () => api.get('/marketplace/my-listings/').then((r) => toArray(r.data)),
        staleTime: 30_000,
    })

    const mutateListing = useMutation({
        mutationFn: ({ id, action }: { id: string; action: 'hide' | 'unhide' | 'repost' | 'mark-sold' | 'delete' }) => {
            if (action === 'delete') {
                return api.delete(`/marketplace/listings/${id}/`)
            }
            return api.post(`/marketplace/listings/${id}/${action}/`)
        },
        onSuccess: () => {
            toast.success('Listing updated successfully.')
            queryClient.invalidateQueries({ queryKey: ['account-listings'] })
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Could not update listing.')
        },
    })

    const listings = useMemo(() => data || [], [data])
    const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE))

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    const paginatedListings = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return listings.slice(start, start + PAGE_SIZE)
    }, [listings, page])
    const pageNumbers = useMemo(() => getVisiblePages(Math.min(page, totalPages), totalPages), [page, totalPages])

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">My Listings</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your marketplace posts in one place.</p>
                </div>
                <Link href="/marketplace/post">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Post New Listing
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {Array(5).fill(null).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-gray-100" />
                    ))}
                </div>
            ) : listings.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                    <p>You have not posted any listings yet.</p>
                    <p className="text-sm mt-1">Create a listing to start receiving offers.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {paginatedListings.map((listing) => (
                        <div key={listing.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/40 transition-colors">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{listing.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {listing.post_type?.toUpperCase()} • Posted {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                                    </p>
                                    {listing.status === 'rejected' && listing.rejection_reason && (
                                        <p className="text-xs text-red-600 mt-1">Reason: {listing.rejection_reason}</p>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                    <Badge variant="outline" className={statusBadgeClass(listing.status)}>
                                        {listing.status}
                                    </Badge>
                                    <span className="font-extrabold text-gray-900">৳{Number(listing.price || 0).toLocaleString()}</span>

                                    <Link href={`/marketplace/listings/${listing.id}`}>
                                        <Button size="sm" variant="outline">View</Button>
                                    </Link>

                                    {listing.status === 'active' && (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => mutateListing.mutate({ id: listing.id, action: 'hide' })}>
                                                <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => mutateListing.mutate({ id: listing.id, action: 'mark-sold' })}>
                                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark Sold
                                            </Button>
                                        </>
                                    )}

                                    {listing.status === 'hidden' && (
                                        <Button size="sm" variant="outline" onClick={() => mutateListing.mutate({ id: listing.id, action: 'unhide' })}>
                                            <Eye className="h-3.5 w-3.5 mr-1" /> Unhide
                                        </Button>
                                    )}

                                    {(listing.status === 'expired' || listing.status === 'rejected') && (
                                        <Button size="sm" variant="outline" onClick={() => mutateListing.mutate({ id: listing.id, action: 'repost' })}>
                                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Repost
                                        </Button>
                                    )}

                                    {(listing.status === 'sold' || listing.status === 'hidden' || listing.status === 'rejected' || listing.status === 'expired') && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => mutateListing.mutate({ id: listing.id, action: 'delete' })}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-gray-500">
                            Page {Math.min(page, totalPages)} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            >
                                Previous
                            </Button>
                            {pageNumbers.map((pageNo) => (
                                <Button
                                    key={pageNo}
                                    type="button"
                                    variant={pageNo === page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setPage(pageNo)}
                                >
                                    {pageNo}
                                </Button>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
