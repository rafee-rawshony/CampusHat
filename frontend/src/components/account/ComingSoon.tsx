'use client'

/**
 * Reusable "section coming soon" placeholder for dashboard pages
 * that aren't fully wired up to real data yet.
 */

import { type LucideIcon } from 'lucide-react'

interface Props {
    title: string
    description: string
    icon: LucideIcon
}

export function ComingSoon({ title, description, icon: Icon }: Props) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
            <div className="border-b border-gray-100 pb-4 mb-6">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <Icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Coming soon</p>
                <p className="text-xs text-gray-400 mt-1">This section is under construction.</p>
            </div>
        </div>
    )
}
