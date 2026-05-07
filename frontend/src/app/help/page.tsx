'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Phone, Mail, HelpCircle } from 'lucide-react'

const FAQS = [
    {
        q: 'How do I track my order?',
        a: 'Go to My Account → Orders. Each order shows its current status. You can also click "Details" on any order to see the full tracking timeline.',
    },
    {
        q: 'What payment methods are accepted?',
        a: 'We accept Cash on Delivery (COD), bKash, Nagad, and major debit/credit cards. Wallet balance can also be used for purchases.',
    },
    {
        q: 'How long does delivery take?',
        a: 'Delivery within the same campus usually takes 1–2 days. Inter-campus delivery typically takes 3–5 business days.',
    },
    {
        q: 'Can I return a product?',
        a: 'Yes. Products can be returned within 7 days of delivery in their original condition. Visit our Returns & Refunds page for full details.',
    },
    {
        q: 'How do I contact a seller?',
        a: "Open any product page and click \"Message Seller.\" You can also visit the seller's store page to send a direct message.",
    },
    {
        q: 'How do I become a seller?',
        a: 'Click "Sell on CampusHat" in the footer or go to /seller/register. Fill out the application and our team will review it within 2 business days.',
    },
]

export default function HelpCenterPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <div className="min-h-screen bg-white">

            {/* Hero */}
            <div className="bg-gradient-to-br from-[#4C3B8A] to-[#2D1B69] py-16 px-4 text-center">
                <div className="max-w-2xl mx-auto">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">How can we help?</h1>
                    <p className="text-white/70 text-base sm:text-lg">
                        Find answers to common questions or reach out to our support team.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-12">

                {/* FAQ */}
                <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-2 mb-12">
                    {FAQS.map((faq, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                            >
                                <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {openIndex === i && (
                                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                                    <p className="pt-3">{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Contact section */}
                <h2 className="text-xl font-bold text-gray-900 mb-4">Still need help?</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#4C3B8A]/10 flex items-center justify-center shrink-0">
                            <Phone className="w-5 h-5 text-[#4C3B8A]" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Phone Support</p>
                            <p className="text-sm text-gray-500 mt-0.5">0 800 300-HAT</p>
                            <p className="text-xs text-gray-400 mt-1">Sun–Thu, 9 AM – 6 PM</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#4C3B8A]/10 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-[#4C3B8A]" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Email Support</p>
                            <a
                                href="mailto:support@campushat.com"
                                className="text-sm text-[#4C3B8A] mt-0.5 hover:underline block"
                            >
                                support@campushat.com
                            </a>
                            <p className="text-xs text-gray-400 mt-1">Response within 24 hours</p>
                        </div>
                    </div>
                </div>

                {/* Quick links */}
                <div className="mt-8 text-sm text-gray-500 text-center">
                    <Link href="/help/returns" className="text-[#4C3B8A] hover:underline font-medium">Returns & Refunds</Link>
                    {' · '}
                    <Link href="/terms" className="text-[#4C3B8A] hover:underline font-medium">Terms of Service</Link>
                    {' · '}
                    <Link href="/privacy" className="text-[#4C3B8A] hover:underline font-medium">Privacy Policy</Link>
                </div>
            </div>
        </div>
    )
}
