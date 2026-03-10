'use client'

import React, { useEffect, useState } from 'react'
import { DollarSign, Users, Store, Grid, ShoppingBag, ArrowRight } from 'lucide-react'
import Link from 'next/link'


export default function AdminDashboardPage() {

    // Fallback static stat structures, will mutate async
    const [stats, setStats] = useState({
        total_revenue: 0,
        total_sellers: 0,
        mall_products: 0,
        marketplace_ads: 0,
        total_orders: 0
    })

    const [quickStats, setQuickStats] = useState({
        buy_listings: 0,
        rental_listings: 0,
        service_listings: 0,
        delivered_orders: 0,
        pending_orders: 0
    })

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mocking the aggregate dashboard API loads
        const fetchStats = async () => {
            try {
                // api.get('/admin/dashboard/stats/')
                // API isn't built yet, so we mock the demo values from S4 instructions
                setTimeout(() => {
                    setStats({
                        total_revenue: 4300.00,
                        total_sellers: 5,
                        mall_products: 16,
                        marketplace_ads: 10,
                        total_orders: 2
                    })

                    setQuickStats({
                        buy_listings: 4,
                        rental_listings: 2,
                        service_listings: 2,
                        delivered_orders: 1,
                        pending_orders: 0
                    })
                    setLoading(false)
                }, 800)
            } catch (err) {
                console.error("Failed to load dashboard stats", err)
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const statCards = [
        {
            label: 'TOTAL REVENUE',
            value: `৳${stats.total_revenue.toFixed(2)}`,
            icon: <DollarSign className="w-6 h-6 text-green-600" />,
            color: 'bg-green-100',
            link: '/admin/orders' // Revenue usually derived from orders/mall
        },
        {
            label: 'TOTAL SELLERS',
            value: stats.total_sellers,
            icon: <Users className="w-6 h-6 text-blue-600" />,
            color: 'bg-blue-100',
            link: '/admin/users?role=seller'
        },
        {
            label: 'MALL PRODUCTS',
            value: stats.mall_products,
            icon: <Store className="w-6 h-6 text-teal-600" />,
            color: 'bg-teal-100',
            link: '/admin/mall-products'
        },
        {
            label: 'MARKETPLACE LISTINGS',
            value: stats.marketplace_ads,
            icon: <Grid className="w-6 h-6 text-purple-600" />,
            color: 'bg-purple-100',
            link: '/admin/marketplace'
        },
        {
            label: 'TOTAL ORDERS',
            value: stats.total_orders,
            icon: <ShoppingBag className="w-6 h-6 text-red-600" />,
            color: 'bg-red-100',
            link: '/admin/orders'
        }
    ]

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Platform Overview</h1>
                <p className="text-gray-500 mt-1">Monitor the pulse of CampusHat.</p>
            </div>

            {/* Stat Cards Grid (Top 4 + bottom 1, per spec) */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.slice(0, 4).map((card, idx) => (
                        <div
                            key={idx}
                            className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden ${loading ? 'animate-pulse' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${card.color}`}>
                                    {card.icon}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <h3 className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">{card.label}</h3>
                                <div className="text-3xl font-black text-gray-900">
                                    {loading ? <div className="h-8 w-16 bg-gray-200 rounded mt-1"></div> : card.value}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link
                                    href={card.link}
                                    className="inline-flex items-center text-xs font-bold text-brand-primary hover:text-brand-primary-hover group"
                                >
                                    INSIGHT
                                    <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Second Row for overflow stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.slice(4).map((card, idx) => (
                        <div
                            key={`overflow-${idx}`}
                            className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden ${loading ? 'animate-pulse' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${card.color}`}>
                                    {card.icon}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <h3 className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">{card.label}</h3>
                                <div className="text-3xl font-black text-gray-900">
                                    {loading ? <div className="h-8 w-16 bg-gray-200 rounded mt-1"></div> : card.value}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link
                                    href={card.link}
                                    className="inline-flex items-center text-xs font-bold text-brand-primary hover:text-brand-primary-hover group"
                                >
                                    INSIGHT
                                    <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Stats</h2>

                <div className="space-y-4">
                    {/* Map quick stats to an array to iterate over dots */}
                    {[
                        { label: 'Buy Listings', val: quickStats.buy_listings },
                        { label: 'Rental Listings', val: quickStats.rental_listings },
                        { label: 'Service Listings', val: quickStats.service_listings },
                        { label: 'Delivered Orders', val: quickStats.delivered_orders },
                        { label: 'Pending Orders', val: quickStats.pending_orders },
                    ].map((stat, i) => (
                        <div key={i} className="flex items-end justify-between text-sm font-medium pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                            <span className="text-gray-600 relative overflow-hidden flex-1 after:content-['......................................................................'] after:absolute after:ml-2 after:text-gray-300">
                                {stat.label}
                            </span>
                            <span className="text-gray-900 font-bold bg-white z-10 pl-2">
                                {loading ? '-' : stat.val}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}
