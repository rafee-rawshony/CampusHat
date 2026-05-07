'use client'

import Link from 'next/link'
import { Home, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'

const STEPS = [
    { n: 1, title: 'Initiate Return', desc: 'Go to My Account → Orders, select the item, and click "Request Return."' },
    { n: 2, title: 'Pack the Item', desc: 'Repack the item in its original packaging with all accessories and tags intact.' },
    { n: 3, title: 'Hand Over', desc: 'Our pickup agent will collect the item from your campus location within 1–2 days.' },
    { n: 4, title: 'Inspection', desc: 'We inspect the returned item to confirm it meets our return eligibility criteria.' },
    { n: 5, title: 'Refund Issued', desc: 'Refund is credited to your original payment method or CampusHat wallet.' },
]

const NON_RETURNABLE = [
    'Digital products, codes, or vouchers',
    'Perishable goods (food, beverages)',
    'Customised or personalised items',
    'Items marked "Final Sale" at checkout',
    'Opened software or sealed media',
]

export default function ReturnsPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 py-8">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
                    <Link href="/" className="flex items-center gap-1 hover:text-[#4C3B8A]">
                        <Home className="w-3.5 h-3.5" /> Home
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <Link href="/help" className="hover:text-[#4C3B8A]">Help Center</Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-gray-800 font-medium">Returns & Refunds</span>
                </nav>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns & Refunds</h1>
                <p className="text-gray-500 mb-8">We want you to be happy with every purchase. Here's how our return process works.</p>

                {/* Policy summary */}
                <div className="bg-[#EDE9FF] rounded-2xl p-5 mb-8 border border-[#4C3B8A]/10">
                    <p className="font-semibold text-[#4C3B8A] mb-1">Return Window: 7 Days</p>
                    <p className="text-sm text-gray-700">
                        You have <strong>7 days</strong> from the date of delivery to initiate a return. After this window, items cannot be returned unless they arrive damaged or defective.
                    </p>
                </div>

                {/* Eligibility */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Return Eligibility</h2>
                    <ul className="space-y-2.5">
                        {[
                            'Item returned within 7 days of delivery',
                            'Original packaging and all accessories included',
                            'Tags and labels still attached',
                            'Proof of purchase (order number) provided',
                            'Item unused and in original condition',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Steps */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">How to Return</h2>
                    <div className="space-y-4">
                        {STEPS.map(step => (
                            <div key={step.n} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#4C3B8A] text-white text-sm font-bold flex items-center justify-center shrink-0">
                                    {step.n}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Non-returnable */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Non-Returnable Items</h2>
                    <ul className="space-y-2">
                        {NON_RETURNABLE.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Refund timeline */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Refund Timeline</h2>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                            { label: 'Received', days: '1–2 days', color: 'bg-blue-50 text-blue-700' },
                            { label: 'Inspected', days: '2–3 days', color: 'bg-orange-50 text-orange-700' },
                            { label: 'Refunded', days: '3–5 days', color: 'bg-green-50 text-green-700' },
                        ].map(step => (
                            <div key={step.label} className={`rounded-xl p-4 ${step.color}`}>
                                <p className="font-bold text-sm">{step.label}</p>
                                <p className="text-xs mt-1">{step.days}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        COD refunds are credited to your CampusHat wallet. Card/bKash refunds return to the original source.
                    </p>
                </div>

                <div className="text-sm text-gray-500 text-center">
                    Still have questions? <a href="mailto:support@campushat.com" className="text-[#4C3B8A] hover:underline font-medium">Contact Support</a>
                </div>
            </div>
        </div>
    )
}
