'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, Search, ArrowLeft, ShoppingBag, Store, HelpCircle, Compass } from 'lucide-react'

function FloatingShape({ className, delay }: { className: string; delay: number }) {
    return (
        <div
            className={`absolute rounded-full opacity-[0.04] ${className}`}
            style={{
                animation: `float ${6 + delay}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
            }}
        />
    )
}

export default function NotFoundPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            window.location.href = `/marketplace?search=${encodeURIComponent(searchQuery.trim())}`
        }
    }

    const quickLinks = [
        { href: '/', label: 'Home', icon: Home, desc: 'Back to homepage' },
        { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag, desc: 'Browse listings' },
        { href: '/marketplace/explorer', label: 'Explorer', icon: Compass, desc: 'Discover products' },
        { href: '/help', label: 'Help Center', icon: HelpCircle, desc: 'Get support' },
    ]

    return (
        <>
            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    33% { transform: translateY(-20px) rotate(5deg); }
                    66% { transform: translateY(10px) rotate(-3deg); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes pulse404 {
                    0%, 100% { opacity: 0.08; }
                    50% { opacity: 0.15; }
                }
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>

            <div className="min-h-[80vh] relative overflow-hidden flex items-center justify-center px-4 py-12 sm:py-20">
                {/* Background floating shapes */}
                <div className="absolute inset-0 pointer-events-none">
                    <FloatingShape className="w-72 h-72 bg-[#4C3B8A] -top-20 -left-20" delay={0} />
                    <FloatingShape className="w-96 h-96 bg-[#6B5AAE] -bottom-32 -right-32" delay={2} />
                    <FloatingShape className="w-48 h-48 bg-[#4C3B8A] top-1/3 right-1/4" delay={4} />
                    <FloatingShape className="w-32 h-32 bg-[#8B7BC8] bottom-1/4 left-1/4" delay={1} />
                </div>

                <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
                    {/* 404 Number */}
                    <div
                        className={`transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                        style={{ animation: mounted ? 'scaleIn 0.6s ease-out' : 'none' }}
                    >
                        <div className="relative inline-block mb-6">
                            <span
                                className="text-[140px] sm:text-[180px] md:text-[220px] font-black leading-none tracking-tighter select-none"
                                style={{
                                    background: 'linear-gradient(135deg, #4C3B8A 0%, #6B5AAE 40%, #8B7BC8 70%, #4C3B8A 100%)',
                                    backgroundSize: '200% 200%',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    animation: 'gradientShift 4s ease infinite',
                                }}
                            >
                                404
                            </span>
                            <div
                                className="absolute inset-0 text-[140px] sm:text-[180px] md:text-[220px] font-black leading-none tracking-tighter select-none text-[#4C3B8A] blur-3xl"
                                style={{ animation: 'pulse404 3s ease-in-out infinite' }}
                            >
                                404
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    <div
                        className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                        style={{ animation: mounted ? 'fadeInUp 0.6s ease-out 0.2s both' : 'none' }}
                    >
                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#4C3B8A]/10 to-[#6B5AAE]/5 flex items-center justify-center">
                            <Store className="w-8 h-8 text-[#4C3B8A]" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                            Page not found
                        </h1>
                        <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-8">
                            The page you're looking for doesn't exist or has been moved.
                            Try searching or use one of the links below.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div
                        className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                        style={{ animation: mounted ? 'fadeInUp 0.6s ease-out 0.35s both' : 'none' }}
                    >
                        <form onSubmit={handleSearch} className="relative max-w-md mx-auto mb-10">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search the marketplace..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-28 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4C3B8A]/20 focus:border-[#4C3B8A]/40 shadow-sm transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#4C3B8A] text-white text-sm font-semibold rounded-xl hover:bg-[#3D2F6E] active:scale-[0.97] transition-all shadow-sm"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Quick Links Grid */}
                    <div
                        className={`transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                        style={{ animation: mounted ? 'fadeInUp 0.6s ease-out 0.5s both' : 'none' }}
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-10">
                            {quickLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="group flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl hover:border-[#4C3B8A]/20 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-[#4C3B8A]/10 flex items-center justify-center transition-colors">
                                        <link.icon className="w-5 h-5 text-gray-400 group-hover:text-[#4C3B8A] transition-colors" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 group-hover:text-[#4C3B8A] transition-colors">
                                        {link.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Back Button */}
                    <div
                        className={`transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                        style={{ animation: mounted ? 'fadeInUp 0.6s ease-out 0.65s both' : 'none' }}
                    >
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#4C3B8A] font-medium transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Go back to previous page
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
