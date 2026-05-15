'use client'

import { MarketplaceListingCard } from './MarketplaceListingCard'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface ExplorerResultsGridProps {
    listings: any[]
    isLoading: boolean
    query: string
    total: number
    page: number
    pageSize: number
}

export function ExplorerResultsGrid({
    listings,
    isLoading,
    query,
    total,
    page,
    pageSize,
}: ExplorerResultsGridProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.push(`${pathname}?${params.toString()}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const clearFilters = () => {
        router.push(pathname)
    }

    // Top Right Info Row
    const renderTopRow = () => {
        if (isLoading && listings.length === 0) return null
        return (
            <div className="mb-4 text-sm text-gray-500">
                {query ? (
                    <span>Showing <span className="font-medium text-gray-800">{total}</span> results for <span className="font-medium text-gray-800">'{query}'</span></span>
                ) : (
                    <span>Showing <span className="font-medium text-gray-800">{total}</span> listings</span>
                )}
            </div>
        )
    }

    // Pagination logic
    const renderPagination = () => {
        const totalPages = Math.ceil(total / pageSize)
        if (totalPages <= 1) return null

        const getPageNumbers = () => {
            const pages: (number | string)[] = []
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
            } else {
                if (page <= 4) {
                    pages.push(1, 2, 3, 4, 5, '...', totalPages)
                } else if (page >= totalPages - 3) {
                    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
                } else {
                    pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
                }
            }
            return pages
        }

        return (
            <div className="mt-12 flex items-center justify-center gap-2">
                <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:border-[#4C3B8A] disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Desktop view pagers */}
                <div className="hidden sm:flex items-center gap-2">
                    {getPageNumbers().map((num, i) => (
                        typeof num === 'number' ? (
                            <button
                                key={i}
                                onClick={() => handlePageChange(num)}
                                className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                                    page === num
                                        ? 'bg-[#4C3B8A] text-white border border-[#4C3B8A]'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:border-[#4C3B8A]'
                                }`}
                            >
                                {num}
                            </button>
                        ) : (
                            <span key={i} className="text-gray-400 px-1">...</span>
                        )
                    ))}
                </div>

                {/* Mobile view pagers (only current) */}
                <div className="sm:hidden flex items-center justify-center px-4 text-sm font-medium text-gray-700">
                    Page {page} of {totalPages}
                </div>

                <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:border-[#4C3B8A] disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        )
    }

    if (isLoading && listings.length === 0) {
        return (
            <div>
                {renderTopRow()}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm animate-pulse">
                            <div className="h-48 bg-gray-200 w-full" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (!isLoading && listings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-gray-200 border-dashed rounded-xl bg-white mt-4">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-1">No listings found</h3>
                
                {query ? (
                    <>
                        <p className="text-sm text-gray-500 mb-4">No results for <span className="font-semibold text-gray-700">'{query}'</span>.<br/>Try different keywords or remove some filters.</p>
                    </>
                ) : (
                    <p className="text-sm text-gray-500 mb-4">No listings match your filters.<br/>Try removing some filters.</p>
                )}
                
                <button onClick={clearFilters} className="text-[#4C3B8A] text-sm font-medium hover:underline">
                    Clear all filters
                </button>
            </div>
        )
    }

    return (
        <div>
            {renderTopRow()}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map(listing => (
                    <MarketplaceListingCard key={listing.id} listing={listing} />
                ))}
            </div>

            {renderPagination()}
        </div>
    )
}
