'use client'

import Link from 'next/link'
import { CheckCircle2, Gift, BadgeCheck, Briefcase, Star } from 'lucide-react'

const RESPONSIBILITIES = [
    'Promote CampusHat within your campus community',
    'Onboard new students and sellers onto the platform',
    'Gather feedback and report issues to the CampusHat team',
    'Represent the brand at campus events and fairs',
    'Create content about your experience using CampusHat',
]

const PERKS = [
    { icon: Gift, title: 'Monthly Stipend', desc: 'Earn a monthly stipend based on your campus size and activity.' },
    { icon: BadgeCheck, title: 'Exclusive Merch', desc: 'CampusHat ambassador kit including branded clothing and accessories.' },
    { icon: Briefcase, title: 'Internship Reference', desc: 'Get a formal reference letter from CampusHat for job applications.' },
    { icon: Star, title: 'Priority Listings', desc: 'Your own listings get priority placement across the platform.' },
]

const ELIGIBILITY = [
    'Currently enrolled student at a partner campus',
    'Active on at least one social media platform (Instagram, Facebook, TikTok)',
    'Strong communication skills and campus network',
    'Passion for supporting local student businesses',
]

export default function AmbassadorPage() {
    return (
        <div className="min-h-screen bg-white">

            {/* Hero */}
            <div className="bg-gradient-to-br from-[#4C3B8A] to-[#2D1B69] py-20 px-4 text-center">
                <div className="max-w-2xl mx-auto">
                    <span className="inline-block px-3 py-1 text-xs font-bold bg-[#F97316] text-white rounded-full mb-4">Now Recruiting</span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Represent CampusHat on Your Campus</h1>
                    <p className="text-white/70 text-base sm:text-lg mb-8">
                        Become a CampusHat Campus Ambassador and help build the student economy at your university.
                    </p>
                    <a
                        href="mailto:ambassador@campushat.com?subject=Campus Ambassador Application"
                        className="inline-block px-8 py-3.5 bg-[#F97316] text-white font-bold rounded-xl hover:bg-[#ea6c0a] transition-colors text-sm"
                    >
                        Apply to Be an Ambassador
                    </a>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-12">

                {/* Responsibilities */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Your Role</h2>
                    <ul className="space-y-3">
                        {RESPONSIBILITIES.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-[#4C3B8A] mt-0.5 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Perks */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Ambassador Perks</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {PERKS.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-[#F97316]" />
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
                    <a
                        href="mailto:ambassador@campushat.com?subject=Campus Ambassador Application"
                        className="inline-block px-8 py-3 bg-[#4C3B8A] text-white font-bold rounded-xl hover:bg-[#3d2e6e] transition-colors text-sm"
                    >
                        Send Your Application
                    </a>
                    <p className="text-xs text-gray-400 mt-3">
                        Also see our <Link href="/partnerships/startup" className="text-[#4C3B8A] hover:underline">Startup</Link> and <Link href="/partnerships/affiliate" className="text-[#4C3B8A] hover:underline">Affiliate</Link> programs.
                    </p>
                </div>
            </div>
        </div>
    )
}
