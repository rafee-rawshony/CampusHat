import React from 'react'

interface AdminQuickStatsProps {
    stats: any
    isLoading?: boolean
}

export function AdminQuickStats({ stats, isLoading }: AdminQuickStatsProps) {
    
    // We expect stats to have: buy_listings, rental_listings, service_listings, total_orders, delivered_orders, pending_orders, new_users_today
    // The spec mentions food_listings might be calculated or fetched. We will look for food_listings or default to 0.

    const renderRow = (label: string, value: string | number | undefined) => (
        <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 last:pb-0">
            <span className="text-sm text-gray-600">{label}</span>
            {isLoading ? (
                <div className="h-4 w-8 bg-gray-200 animate-pulse rounded"></div>
            ) : (
                <span className="text-sm font-semibold text-gray-900">{value !== undefined ? value.toLocaleString() : 0}</span>
            )}
        </div>
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Listing Breakdown */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 text-sm mb-4">Listing Breakdown</h3>
                <div className="flex flex-col">
                    {renderRow("Buy Listings", stats?.buy_listings)}
                    {renderRow("Rental Listings", stats?.rental_listings)}
                    {renderRow("Service Listings", stats?.service_listings)}
                    {renderRow("Food Listings", stats?.food_listings || 0)}
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 text-sm mb-4">Order Summary</h3>
                <div className="flex flex-col">
                    {renderRow("Total Orders", stats?.total_orders)}
                    {renderRow("Delivered Orders", stats?.delivered_orders)}
                    {renderRow("Pending Orders", stats?.pending_orders)}
                    {renderRow("New Users Today", stats?.new_users_today)}
                </div>
            </div>
        </div>
    )
}
