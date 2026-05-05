export default function AccountLoading() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] animate-pulse">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="h-8 w-48 bg-gray-200 rounded mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 h-[400px]" />
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-3 w-24 bg-gray-100 rounded" />
                                <div className="h-10 w-full bg-gray-200 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
