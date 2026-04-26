export default function ShopLoading() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] py-6 animate-pulse">
            <div className="max-w-7xl mx-auto px-4">
                <div className="h-8 w-48 bg-gray-200 rounded mb-6" />

                <div className="flex gap-6">
                    {/* Sidebar */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="bg-white rounded-xl border border-gray-100 p-5 h-[600px]" />
                    </div>

                    {/* Product grid */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                                <div className="aspect-square bg-gray-200" />
                                <div className="p-3 space-y-2">
                                    <div className="h-3 w-3/4 bg-gray-100 rounded" />
                                    <div className="h-4 w-1/2 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
