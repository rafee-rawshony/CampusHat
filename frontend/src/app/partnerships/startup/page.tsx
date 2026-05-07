'use client'

import Link from 'next/link'
import { Rocket, Users, Megaphone, Star, CheckCircle2 } from 'lucide-react'

const BENEFITS = [
    { icon: Rocket, title: 'Zero Commission', desc: '6 months of zero platform commission on all sales while you find your footing.' },
    { icon: Users, title: 'Mentorship Access', desc: 'Connect with experienced entrepreneurs and alumni mentors in our network.' },
    { icon: Megaphone, title: 'Campus Marketing', desc: 'We help promote your startup to students across all partner campuses.' },
    { icon: Star, title: 'Featured Placement', desc: 'Your products get featured on the CampusHat homepage and category pages.' },
]

const ELIGIBILITY = [
    'Currently enrolled student or recent graduate (within 2 years)',
    'Viable business idea or early-stage product/service',
    'Campus-focused product, service, or social mission',
    'Commitment to at least 3 months on the platform',
]

export default function StartupPage() {
    return (
        <div className="min-h-screen bg-white">

            {/* Hero */}
            <div className="bg-gradient-to-br from-[#4C3B8A] to-[#2D1B69] py-20 px-4 text-center">
                <div className="max-w-2xl mx-auto">
                    <span className="inline-block px-3 py-1 text-xs font-bold bg-white/20 text-white rounded-full mb-4">Student Startup Program</span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Launch Your Startup on CampusHat</h1>
                    <p className="text-white/70 text-base sm:text-lg mb-8">
                        We give student founders the tools, audience, and support to turn ideas into real businesses.
                    </p>
                    <a
                        href="mailto:partnerships@campushat.com?subject=Student Startup Program Application"
                        className="inline-block px-8 py-3.5 bg-[#F97316] text-white font-bold rounded-xl hover:bg-[#ea6c0a] transition-colors text-sm"
                    >
                        Apply Now
                    </a>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">

                {/* Benefits */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What You Get</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-12">
                    {BENEFITS.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#4C3B8A]/10 flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-[#4C3B8A]" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{title}</p>
                                <p className="text-sm text-gray-500 mt-1">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Eligibility */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Who Can Apply?</h2>
                    <ul className="space-y-3">
                        {ELIGIBILITY.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <p className="text-gray-500 text-sm mb-4">Ready to build your campus business? Apply via email and we'll get back to you within 5 business days.</p>
                    <a
                        href="mailto:partnerships@campushat.com?subject=Student Startup Program Application"
                        className="inline-block px-8 py-3 bg-[#4C3B8A] text-white font-bold rounded-xl hover:bg-[#3d2e6e] transition-colors text-sm"
                    >
                        Send Application
                    </a>
                    <p className="text-xs text-gray-400 mt-3">
                        Or see our <Link href="/partnerships/affiliate" className="text-[#4C3B8A] hover:underline">Affiliate</Link> and <Link href="/partnerships/ambassador" className="text-[#4C3B8A] hover:underline">Ambassador</Link> programs.
                    </p>
                </div>
            </div>
        </div>
    )
}
