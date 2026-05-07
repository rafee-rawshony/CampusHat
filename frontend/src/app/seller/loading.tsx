export default function SellerLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-[110px]">
                        <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
                        <div className="h-7 w-28 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 h-[400px]" />
        </div>
    )
}
