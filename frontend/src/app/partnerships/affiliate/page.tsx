'use client'

import Link from 'next/link'
import { Share2, TrendingUp, DollarSign } from 'lucide-react'

const STEPS = [
    { n: 1, icon: Share2, title: 'Sign Up', desc: 'Email us to get your unique affiliate link and dashboard access.' },
    { n: 2, icon: TrendingUp, title: 'Share', desc: 'Share your link on social media, in your campus groups, or on your blog.' },
    { n: 3, icon: DollarSign, title: 'Earn', desc: 'Earn commission every time someone signs up or makes a purchase through your link.' },
]

const RATES = [
    { label: 'Mall Product Sale', rate: '5%', detail: 'On every completed purchase' },
    { label: 'Marketplace Sale', rate: '3%', detail: 'On every completed ad sale' },
    { label: 'Referred Seller', rate: '৳500', detail: 'One-time bonus per approved seller' },
]

export default function AffiliatePage() {
    return (
        <div className="min-h-screen bg-white">

            {/* Hero */}
            <div className="bg-gradient-to-br from-[#4C3B8A] to-[#2D1B69] py-20 px-4 text-center">
                <div className="max-w-2xl mx-auto">
                    <span className="inline-block px-3 py-1 text-xs font-bold bg-white/20 text-white rounded-full mb-4">Affiliate Marketing</span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Earn by Sharing CampusHat</h1>
                    <p className="text-white/70 text-base sm:text-lg mb-8">
                        Recommend CampusHat to your campus community and earn real money for every sale or signup you bring in.
                    </p>
                    <a
                        href="mailto:affiliate@campushat.com?subject=Affiliate Program Application"
                        className="inline-block px-8 py-3.5 bg-[#F97316] text-white font-bold rounded-xl hover:bg-[#ea6c0a] transition-colors text-sm"
                    >
                        Join the Program
                    </a>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">

                {/* How it works */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
                <div className="grid sm:grid-cols-3 gap-4 mb-12">
                    {STEPS.map(({ n, icon: Icon, title, desc }) => (
                        <div key={n} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-[#4C3B8A]/10 flex items-center justify-center mx-auto mb-3">
                                <Icon className="w-5 h-5 text-[#4C3B8A]" />
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#4C3B8A] text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                                {n}
                            </div>
                            <p className="font-semibold text-gray-900">{title}</p>
                            <p className="text-sm text-gray-500 mt-1">{desc}</p>
                        </div>
                    ))}
                </div>

                {/* Commission rates */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Commission Rates</h2>
                    <div className="space-y-3">
                        {RATES.map(rate => (
                            <div key={rate.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{rate.label}</p>
                                    <p className="text-xs text-gray-400">{rate.detail}</p>
                                </div>
                                <span className="text-lg font-bold text-[#4C3B8A]">{rate.rate}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Minimum payout: ৳500. Earnings credited to your CampusHat wallet monthly.</p>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <a
                        href="mailto:affiliate@campushat.com?subject=Affiliate Program Application"
                        className="inline-block px-8 py-3 bg-[#4C3B8A] text-white font-bold rounded-xl hover:bg-[#3d2e6e] transition-colors text-sm"
                    >
                        Apply via Email
                    </a>
                    <p className="text-xs text-gray-400 mt-3">
                        Also see our <Link href="/partnerships/startup" className="text-[#4C3B8A] hover:underline">Startup</Link> and <Link href="/partnerships/ambassador" className="text-[#4C3B8A] hover:underline">Ambassador</Link> programs.
                    </p>
                </div>
            </div>
        </div>
    )
}
