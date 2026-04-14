'use client'

import React from 'react'
import { Truck, Info, RefreshCw, ShieldCheck } from 'lucide-react'

export function ProductShippingTab() {
    return (
        <div className="grid sm:grid-cols-2 gap-6 max-w-5xl">
            {/* Box 1: Delivery Coverage */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                        <Truck className="w-5 h-5 text-[#4C3B8A]" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">Delivery Coverage</h3>
                </div>
                <ul className="space-y-3">
                    <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Inside Campus</span>
                        <span className="font-semibold text-gray-900">Same Day / 1 Day</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Inside Dhaka</span>
                        <span className="font-semibold text-gray-900">1-2 Business Days</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Outside Dhaka</span>
                        <span className="font-semibold text-gray-900">3-5 Business Days</span>
                    </li>
                    <li className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-500 italic">International</span>
                        <span className="font-semibold text-red-500">Not Available</span>
                    </li>
                </ul>
            </div>

            {/* Box 2: Shipping Rates */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                        <Info className="w-5 h-5 text-[#4C3B8A]" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">Shipping Rates</h3>
                </div>
                <ul className="space-y-3">
                    <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Inside Campus</span>
                        <span className="font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 rounded">Free</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Inside Dhaka</span>
                        <span className="font-semibold text-gray-900">৳60</span>
                    </li>
                    <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Outside Dhaka</span>
                        <span className="font-semibold text-gray-900">৳120</span>
                    </li>
                    <li className="text-xs text-[#4C3B8A] font-medium pt-3 mt-1 border-t border-gray-200 text-center">
                        Enjoy free shipping on total orders above ৳2,000!
                    </li>
                </ul>
            </div>

            {/* Box 3: Return Policy */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                        <RefreshCw className="w-5 h-5 text-[#4C3B8A]" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">Return Policy</h3>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                    <p>We offer a transparent <strong className="text-gray-900">7-day return window</strong> for items that are defective or not matching the description.</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2 text-gray-500">
                        <li>Item must be unused</li>
                        <li>Original packaging required</li>
                        <li>Contact seller directly to initiate</li>
                    </ul>
                </div>
            </div>

            {/* Box 4: Secure Payment */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                        <ShieldCheck className="w-5 h-5 text-[#4C3B8A]" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">Secure Payment</h3>
                </div>
                <div className="text-sm text-gray-600">
                    <p className="mb-4">Multiple fast and secure pathways via <strong className="text-gray-900">SSLCommerz</strong>.</p>
                    <div className="flex flex-wrap gap-2">
                        <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">bKash</span>
                        <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">Nagad</span>
                        <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">Credit/Debit Card</span>
                        <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700">Cash on Delivery</span>
                    </div>
                </div>
            </div>

        </div>
    )
}
