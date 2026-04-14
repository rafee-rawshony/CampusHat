'use client'

import React from 'react'
import { MessageCircle } from 'lucide-react'

// Seller Messages page — reuses marketplace chat infrastructure
// The actual chat will be loaded from the marketplace module 
// but is rendered inside the seller dashboard layout

export default function SellerMessagesPage() {
    return (
        <div className="h-full">
            <h1 className="font-bold text-xl text-gray-900 mb-6">Customer Messages</h1>
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-[#4C3B8A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-[#4C3B8A]" />
                </div>
                <h2 className="font-semibold text-gray-800 text-lg mb-2">Messages</h2>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                    Customer messages from your store will appear here. 
                    Keep response times under 1 hour for better ratings.
                </p>
                <p className="text-xs text-gray-300 mt-4">
                    Messages module integration coming soon
                </p>
            </div>
        </div>
    )
}
