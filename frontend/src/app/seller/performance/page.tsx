'use client'

/**
 * Seller Performance scorecard — Daraz-style.
 *
 * Shows the seller score (0-100) plus the sub-metrics that feed into it:
 * on-time ship rate, cancellation rate, delivery rate, response rate,
 * average rating. All numbers come from /analytics/seller/performance/.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    Loader2, TrendingUp, Truck, XCircle, MessageSquare, Star,
    ShoppingBag, Award, Clock,
} from 'lucide-react'

import { api } from '@/lib/api'
import { normalizeSingleResponse } from '@/lib/response'

interface PerformanceData {
    period_days: number
    total_orders: number
    cancelled_orders: number
    delivered_orders: number
    shipped_orders: number
    on_time_ship_rate: number
    cancellation_rate: number
    delivery_rate: number
    response_rate: number
    average_rating: number
    review_count: number
    seller_score: number
    avg_dispatch_hours: number
}

// Score thresholds for the big circular gauge — Daraz-style colour bands.
function scoreColor(score: number): { bg: string; text: string; ring: string; label: string } {
    if (score >= 80) return { bg: 'bg-emerald-500',  text: 'text-emerald-600', ring: 'stroke-emerald-500',  label: 'Excellent' }
    if (score >= 60) return { bg: 'bg-blue-500',     text: 'text-blue-600',    ring: 'stroke-blue-500',     label: 'Good' }
    if (score >= 40) return { bg: 'bg-amber-500',    text: 'text-amber-600',   ring: 'stroke-amber-500',    label: 'Fair' }
    return                   { bg: 'bg-red-500',     text: 'text-red-600',     ring: 'stroke-red-500',     label: 'Needs Work' }
}

// Reusable metric card. Higher rates are good; cancellation_rate inverts.
interface MetricCardProps {
    label: string
    value: number
    suffix?: string
    icon: React.ElementType
    iconBg: string
    iconColor: string
    sub?: string
    invertScore?: boolean
}

function MetricCard({ label, value, suffix = '%', icon: Icon, iconBg, iconColor, sub, invertScore }: MetricCardProps) {
    // For most metrics, higher is better; for cancellation rate, lower is better.
    const goodValue = invertScore ? 100 - value : value
    const valueClass = goodValue >= 80
        ? 'text-emerald-600'
        : goodValue >= 60
            ? 'text-blue-600'
            : goodValue >= 40
                ? 'text-amber-600'
                : 'text-red-600'
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                <div className={`w-9 h-9 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className={`font-bold text-2xl sm:text-3xl ${valueClass}`}>
                {value.toFixed(1)}<span className="text-base font-medium">{suffix}</span>
            </p>
            {sub && <p className="text-[11px] text-gray-500 mt-1">{sub}</p>}
        </div>
    )
}

// SVG circular score gauge.
function ScoreGauge({ score }: { score: number }) {
    const c = scoreColor(score)
    const radius = 70
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
        <div className="relative flex items-center justify-center">
            <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
                <circle cx="90" cy="90" r={radius} className="fill-none stroke-gray-100" strokeWidth="14" />
                <circle
                    cx="90" cy="90" r={radius}
                    className={`fill-none ${c.ring} transition-all duration-1000`}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={`text-5xl font-black ${c.text}`}>{Math.round(score)}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">out of 100</p>
                <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${c.text}`}>{c.label}</p>
            </div>
        </div>
    )
}

export default function SellerPerformancePage() {
    const [period, setPeriod] = useState(30)

    const { data, isLoading } = useQuery<PerformanceData>({
        queryKey: ['seller-performance', period],
        queryFn: () =>
            api.get('/analytics/seller/performance/', { params: { days: period } })
                .then((r) => normalizeSingleResponse<PerformanceData>(r.data?.data ?? r.data) || {}),
    })

    return (
        <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-bold text-2xl text-gray-900">Performance</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Daraz-style scorecard. Last {period} days.
                    </p>
                </div>
                <div className="flex gap-2">
                    {[7, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setPeriod(d)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                period === d
                                    ? 'bg-brand-primary text-white border border-brand-primary'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-primary'
                            }`}
                        >
                            Last {d} days
                        </button>
                    ))}
                </div>
            </div>

            {isLoading || !data ? (
                <div className="bg-white rounded-xl border border-gray-100 py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Hero — Seller Score */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <ScoreGauge score={data.seller_score} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="h-5 w-5 text-brand-primary" />
                                    <h2 className="text-lg font-bold text-gray-900">Your Seller Score</h2>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                    Composite score derived from on-time shipping, delivery rate,
                                    review response rate, average rating, and cancellation rate.
                                    Higher is better. This affects your ranking in search results.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                    <div>
                                        <p className="text-xs text-gray-500">Total Orders</p>
                                        <p className="font-bold text-gray-900 text-lg">{data.total_orders}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Delivered</p>
                                        <p className="font-bold text-emerald-600 text-lg">{data.delivered_orders}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Cancelled</p>
                                        <p className="font-bold text-red-600 text-lg">{data.cancelled_orders}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Reviews</p>
                                        <p className="font-bold text-amber-600 text-lg">{data.review_count}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metric grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <MetricCard
                            label="On-Time Shipping"
                            value={data.on_time_ship_rate}
                            icon={Truck}
                            iconBg="bg-blue-50"
                            iconColor="text-blue-600"
                            sub={`${data.shipped_orders} orders shipped`}
                        />
                        <MetricCard
                            label="Delivery Rate"
                            value={data.delivery_rate}
                            icon={ShoppingBag}
                            iconBg="bg-emerald-50"
                            iconColor="text-emerald-600"
                            sub={`${data.delivered_orders} of ${data.total_orders} delivered`}
                        />
                        <MetricCard
                            label="Cancellation Rate"
                            value={data.cancellation_rate}
                            icon={XCircle}
                            iconBg="bg-red-50"
                            iconColor="text-red-600"
                            sub={`${data.cancelled_orders} of ${data.total_orders} cancelled (lower is better)`}
                            invertScore
                        />
                        <MetricCard
                            label="Response Rate"
                            value={data.response_rate}
                            icon={MessageSquare}
                            iconBg="bg-purple-50"
                            iconColor="text-purple-600"
                            sub="Reviews you've replied to"
                        />
                        <MetricCard
                            label="Average Rating"
                            value={data.average_rating}
                            suffix=" ★"
                            icon={Star}
                            iconBg="bg-amber-50"
                            iconColor="text-amber-600"
                            sub={`${data.review_count} reviews`}
                        />
                        <div className="bg-white rounded-xl border border-gray-100 p-5">
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Dispatch</span>
                                <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="font-bold text-2xl sm:text-3xl text-gray-900">
                                {data.avg_dispatch_hours}<span className="text-base font-medium">h</span>
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">Promised dispatch time</p>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                        <h3 className="font-bold text-sm text-blue-900 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Tips to improve your score
                        </h3>
                        <ul className="text-xs text-blue-800 space-y-1.5 list-disc pl-5">
                            <li>Ship orders within your promised dispatch time</li>
                            <li>Respond to every review — even negative ones — to show good service</li>
                            <li>Keep cancellations minimal by maintaining accurate stock</li>
                            <li>Aim for 4.5+ average rating by listing accurate product details</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
