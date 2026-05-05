// Instant skeleton shown by Next.js while admin pages load.
export default function AdminLoading() {
    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-end justify-between">
                <div>
                    <div className="h-8 w-72 bg-gray-200 rounded-lg mb-2" />
                    <div className="h-3 w-56 bg-gray-100 rounded" />
                </div>
                <div className="h-3 w-40 bg-gray-100 rounded" />
            </div>

            {/* Metric cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-[140px]">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 mb-4" />
                        <div className="h-7 w-24 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-16 bg-gray-100 rounded" />
                    </div>
                ))}
            </div>

            {/* Big content area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 p-6 h-[300px]" />
                <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 p-6 h-[300px]" />
            </div>
        </div>
    )
}
