export default function MarketplaceLoading() {
    return (
        <div className="min-h-screen bg-white py-6 animate-pulse">
            <div className="max-w-7xl mx-auto px-4 space-y-6">
                <div className="h-10 w-72 bg-gray-200 rounded-lg" />

                {/* Category strip */}
                <div className="flex gap-3 overflow-x-auto">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 w-32 bg-white rounded-xl border border-gray-100 shrink-0" />
                    ))}
                </div>

                {/* Listings grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                            <div className="aspect-[4/3] bg-gray-200" />
                            <div className="p-3 space-y-2">
                                <div className="h-3 w-3/4 bg-gray-100 rounded" />
                                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
