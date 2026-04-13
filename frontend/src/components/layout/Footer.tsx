'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, Facebook, Twitter, Linkedin, CheckCircle } from 'lucide-react'

export function Footer() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'invalid' | 'success'>('idle')

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const handleSubscribe = () => {
        if (!validateEmail(email)) {
            setStatus('invalid')
            return
        }

        setStatus('success')
        
        // Optimistic UI, fire and forget API call
        // api.post('/newsletter/subscribe/', { email }).catch(() => {})
    }

    return (
        <footer className="bg-[#F5F5F5] pt-8 pb-0 mt-auto">
            {/* Section 1 — Newsletter */}
            <div className="max-w-6xl mx-auto px-4 mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Join our newsletter for campus news</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Register now to get latest updates on tech promos & student events.
                        </p>
                    </div>
                    
                    <div className="w-full md:w-auto">
                        {status === 'success' ? (
                            <div className="flex items-center gap-2 text-green-600 font-medium text-sm h-10 w-full md:w-64 justify-center md:justify-end">
                                <CheckCircle className="w-5 h-5" />
                                Thank you for subscribing!
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 w-full">
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            if (status === 'invalid') setStatus('idle')
                                        }}
                                        className={`border rounded-lg px-4 py-2.5 text-sm w-full md:w-64 outline-none focus:border-[#4C3B8A] transition-colors ${status === 'invalid' ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    <button
                                        onClick={handleSubscribe}
                                        className="bg-[#4C3B8A] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2D1B69] transition shrink-0"
                                    >
                                        SUBSCRIBE
                                    </button>
                                </div>
                                {status === 'invalid' && (
                                    <p className="text-red-500 text-xs font-medium pl-1">Please enter a valid email.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 2 — Main columns */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-2 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    
                    {/* COLUMN 1: Support & Help */}
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-3 lg:mb-4">Support & Help</h4>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4">
                            Dedicated support for the student community. Reach out to us for any assistance with your orders or account.
                        </p>
                        <div className="flex items-start gap-3 mb-3">
                            <Phone className="w-4 h-4 text-[#4C3B8A] mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400">Student Hotline: 24/7</p>
                                <p className="font-bold text-gray-800 text-sm">0 800 300-HAT</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-[#4C3B8A] mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400">Email Support</p>
                                <a href="mailto:support@campushat.com" className="font-semibold text-gray-800 text-sm hover:text-[#4C3B8A] transition">
                                    support@campushat.com
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 2: Partnerships */}
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-3 lg:mb-4">Partnerships</h4>
                        <ul className="space-y-2.5">
                            <li><Link href="/seller/register" className="text-sm text-gray-500 hover:text-[#4C3B8A] hover:underline transition-colors focus:outline-none">Sell on CampusHat</Link></li>
                            <li><Link href="/partnerships/startup" className="text-sm text-gray-500 hover:text-[#4C3B8A] hover:underline transition-colors focus:outline-none">Student Startup Program</Link></li>
                            <li><Link href="/partnerships/affiliate" className="text-sm text-gray-500 hover:text-[#4C3B8A] hover:underline transition-colors focus:outline-none">Affiliate Marketing</Link></li>
                            <li><Link href="/partnerships/ambassador" className="text-sm text-gray-500 hover:text-[#4C3B8A] hover:underline transition-colors focus:outline-none">Campus Ambassador</Link></li>
                        </ul>
                    </div>

                    {/* COLUMN 3: Customer Care */}
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-3 lg:mb-4">Customer Care</h4>
                        <ul className="space-y-2.5">
                            <li><Link href="/help" className="text-sm text-gray-500 hover:text-[#4C3B8A] hover:underline transition-colors focus:outline-none">Help Center</Link></li>
                            <li><Link href="/orders" className="text-sm text-gray-500 hover:text-[#4C3B8A] hover:underline transition-colors focus:outline-none">Track My Order</Link></li>
                            <li><Link href="/help/returns" className="text-sm text-gray-500 hover:text-[#4C3B8A] hover:underline transition-colors focus:outline-none">Returns & Refunds</Link></li>
                            <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-[#4C3B8A] hover:underline transition-colors focus:outline-none">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    {/* COLUMN 4: Connect with us */}
                    <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-3 lg:mb-4">Connect with us</h4>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4">
                            Follow us on social media for the latest updates and exclusive campus offers.
                        </p>
                        <div className="flex gap-3 mt-2">
                            <a 
                                href="https://facebook.com" 
                                target="_blank" 
                                rel="noreferrer"
                                aria-label="Follow us on Facebook"
                                className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#4C3B8A] hover:text-[#4C3B8A] transition text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4C3B8A] focus:ring-offset-2 focus:ring-offset-[#F5F5F5]"
                            >
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a 
                                href="https://twitter.com" 
                                target="_blank" 
                                rel="noreferrer"
                                aria-label="Follow us on Twitter"
                                className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#4C3B8A] hover:text-[#4C3B8A] transition text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4C3B8A] focus:ring-offset-2 focus:ring-offset-[#F5F5F5]"
                            >
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a 
                                href="https://linkedin.com" 
                                target="_blank" 
                                rel="noreferrer"
                                aria-label="Follow us on LinkedIn"
                                className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#4C3B8A] hover:text-[#4C3B8A] transition text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4C3B8A] focus:ring-offset-2 focus:ring-offset-[#F5F5F5]"
                            >
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            {/* Section 3 — Bottom bar */}
            <div className="border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    
                    <div className="text-sm text-gray-400 text-center md:text-left order-3 md:order-1">
                        Copyright 2025 &copy; CampusHat Team. All right reserved.
                    </div>

                    <div className="flex items-center gap-2 order-1 md:order-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">SECURED BY</span>
                        <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2 py-0.5">
                            <span className="text-xs font-bold text-green-600">SSLCommerz</span>
                        </div>
                    </div>

                    <div className="text-sm text-gray-400 order-2 md:order-3">
                        <Link href="/terms" className="hover:text-gray-600 transition focus:outline-none">Terms and Conditions</Link>
                        <span className="mx-2">&middot;</span>
                        <Link href="/privacy" className="hover:text-gray-600 transition focus:outline-none">Privacy Policy</Link>
                    </div>

                </div>
            </div>
        </footer>
    )
}
