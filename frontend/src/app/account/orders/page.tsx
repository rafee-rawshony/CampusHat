export default function MyOrdersPlaceholder() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Orders</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <p>Order functionality has not been fully mapped into the Account module yet.</p>
                <p className="text-sm mt-2">See OrderHistoryList component for integration.</p>
            </div>
        </div>
    )
}
