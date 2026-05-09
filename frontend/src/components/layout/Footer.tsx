'use client'

import React from 'react'
import Link from 'next/link'
import { Phone, Mail, Facebook, Twitter, Linkedin, Instagram, GraduationCap, Heart } from 'lucide-react'

export function Footer() {
    return (
        <footer className="mt-auto">
            {/* Main Footer */}
            <div className="bg-gradient-to-b from-[#f8f7fc] to-[#f0eef8] border-t border-[#e8e5f0]">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-12 pb-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                        
                        {/* COLUMN 1: About & Support */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#4C3B8A] to-[#6B5BA7] rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-4.5 h-4.5 text-white" />
                                </div>
                                <span className="font-bold text-[#2D2548] text-lg tracking-tight">CampusHat</span>
                            </div>
                            <p className="text-sm text-[#6B6580] leading-relaxed mb-5">
                                Your campus commerce platform — connecting students and faculty in one unified marketplace.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm border border-[#e8e5f0]">
                                        <Phone className="w-3.5 h-3.5 text-[#4C3B8A]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#9890a8]">Hotline</p>
                                        <p className="font-semibold text-[#2D2548] text-sm">+8801813923160</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm border border-[#e8e5f0]">
                                        <Mail className="w-3.5 h-3.5 text-[#4C3B8A]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#9890a8]">Email</p>
                                        <a href="mailto:support@campushat.com" className="font-semibold text-[#2D2548] text-sm hover:text-[#4C3B8A] transition">
                                            support@campushat.com
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 2: Partnerships */}
                        <div>
                            <h4 className="font-semibold text-[#2D2548] text-sm mb-4 uppercase tracking-wider">Partnerships</h4>
                            <ul className="space-y-2.5">
                                <li><Link href="/seller/register" className="text-sm text-[#6B6580] hover:text-[#4C3B8A] transition-colors focus:outline-none inline-flex items-center gap-1.5 group">
                                    <span className="w-1 h-1 rounded-full bg-[#c4bdd9] group-hover:bg-[#4C3B8A] transition-colors" />Sell on CampusHat
                                </Link></li>
                                <li><Link href="/partnerships/startup" className="text-sm text-[#6B6580] hover:text-[#4C3B8A] transition-colors focus:outline-none inline-flex items-center gap-1.5 group">
                                    <span className="w-1 h-1 rounded-full bg-[#c4bdd9] group-hover:bg-[#4C3B8A] transition-colors" />Student Startup Program
                                </Link></li>
                                <li><Link href="/partnerships/affiliate" className="text-sm text-[#6B6580] hover:text-[#4C3B8A] transition-colors focus:outline-none inline-flex items-center gap-1.5 group">
                                    <span className="w-1 h-1 rounded-full bg-[#c4bdd9] group-hover:bg-[#4C3B8A] transition-colors" />Affiliate Marketing
                                </Link></li>
                                <li><Link href="/partnerships/ambassador" className="text-sm text-[#6B6580] hover:text-[#4C3B8A] transition-colors focus:outline-none inline-flex items-center gap-1.5 group">
                                    <span className="w-1 h-1 rounded-full bg-[#c4bdd9] group-hover:bg-[#4C3B8A] transition-colors" />Campus Ambassador
                                </Link></li>
                            </ul>
                        </div>

                        {/* COLUMN 3: Customer Care */}
                        <div>
                            <h4 className="font-semibold text-[#2D2548] text-sm mb-4 uppercase tracking-wider">Customer Care</h4>
                            <ul className="space-y-2.5">
                                <li><Link href="/help" className="text-sm text-[#6B6580] hover:text-[#4C3B8A] transition-colors focus:outline-none inline-flex items-center gap-1.5 group">
                                    <span className="w-1 h-1 rounded-full bg-[#c4bdd9] group-hover:bg-[#4C3B8A] transition-colors" />Help Center
                                </Link></li>
                                <li><Link href="/orders" className="text-sm text-[#6B6580] hover:text-[#4C3B8A] transition-colors focus:outline-none inline-flex items-center gap-1.5 group">
                                    <span className="w-1 h-1 rounded-full bg-[#c4bdd9] group-hover:bg-[#4C3B8A] transition-colors" />Track My Order
                                </Link></li>
                                <li><Link href="/help/returns" className="text-sm text-[#6B6580] hover:text-[#4C3B8A] transition-colors focus:outline-none inline-flex items-center gap-1.5 group">
                                    <span className="w-1 h-1 rounded-full bg-[#c4bdd9] group-hover:bg-[#4C3B8A] transition-colors" />Returns & Refunds
                                </Link></li>
                                <li><Link href="/privacy" className="text-sm text-[#6B6580] hover:text-[#4C3B8A] transition-colors focus:outline-none inline-flex items-center gap-1.5 group">
                                    <span className="w-1 h-1 rounded-full bg-[#c4bdd9] group-hover:bg-[#4C3B8A] transition-colors" />Privacy Policy
                                </Link></li>
                            </ul>
                        </div>

                        {/* COLUMN 4: Connect */}
                        <div>
                            <h4 className="font-semibold text-[#2D2548] text-sm mb-4 uppercase tracking-wider">Connect With Us</h4>
                            <p className="text-sm text-[#6B6580] leading-relaxed mb-5">
                                Follow us for the latest updates and exclusive campus offers.
                            </p>
                            <div className="flex gap-2.5">
                                <a 
                                    href="https://facebook.com" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    aria-label="Follow us on Facebook"
                                    className="w-9 h-9 bg-white border border-[#e8e5f0] rounded-lg flex items-center justify-center hover:bg-[#4C3B8A] hover:border-[#4C3B8A] hover:text-white transition-all duration-200 text-[#6B6580] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30"
                                >
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a 
                                    href="https://twitter.com" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    aria-label="Follow us on Twitter"
                                    className="w-9 h-9 bg-white border border-[#e8e5f0] rounded-lg flex items-center justify-center hover:bg-[#4C3B8A] hover:border-[#4C3B8A] hover:text-white transition-all duration-200 text-[#6B6580] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30"
                                >
                                    <Twitter className="w-4 h-4" />
                                </a>
                                <a 
                                    href="https://instagram.com" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    aria-label="Follow us on Instagram"
                                    className="w-9 h-9 bg-white border border-[#e8e5f0] rounded-lg flex items-center justify-center hover:bg-[#4C3B8A] hover:border-[#4C3B8A] hover:text-white transition-all duration-200 text-[#6B6580] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30"
                                >
                                    <Instagram className="w-4 h-4" />
                                </a>
                                <a 
                                    href="https://linkedin.com" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    aria-label="Follow us on LinkedIn"
                                    className="w-9 h-9 bg-white border border-[#e8e5f0] rounded-lg flex items-center justify-center hover:bg-[#4C3B8A] hover:border-[#4C3B8A] hover:text-white transition-all duration-200 text-[#6B6580] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/30"
                                >
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-[#2D2548]">
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
                    
                    <div className="text-sm text-[#a8a0c0] text-center md:text-left order-2 md:order-1 flex items-center gap-1.5">
                        &copy; {new Date().getFullYear()} CampusHat Team. All rights reserved.
                    </div>

                    <div className="text-sm text-[#a8a0c0] order-1 md:order-2 flex items-center gap-3">
                        <Link href="/terms" className="hover:text-white transition focus:outline-none">Terms</Link>
                        <span className="text-[#5a4f78]">&middot;</span>
                        <Link href="/privacy" className="hover:text-white transition focus:outline-none">Privacy</Link>
                        <span className="text-[#5a4f78]">&middot;</span>
                        <Link href="/help" className="hover:text-white transition focus:outline-none">Help</Link>
                    </div>

                </div>
            </div>
        </footer>
    )
}
